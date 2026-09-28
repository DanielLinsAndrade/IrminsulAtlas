import { useMemo, useState } from 'react';
import { Button } from '../../../components';
import { MetricCard, PageHero, ProgressMeter } from '../../../components/PageLayout';
import { normalizeSearch } from '../../../app/search/searchIndex';
import { useAchievements } from '../hooks/useAchievements';
import { SeelieImportModal } from './SeelieImportModal';
import './AchievementsView.css';
import { exportAchievementHistory } from '../../../domain/achievements/history';
import { ACHIEVEMENT_CATALOG_INFO } from '../../../domain/achievements/seedData';
import { downloadJson } from '../../../lib/downloadJson';
import { useShell } from '../../../app/providers';
import { matchesVersion } from '../../../domain/shared/versionFilter';
import { compareAchievementCategories } from '../categoryOrder';
import { VersionFilter } from '../../../components/VersionFilter';
import { UI_ASSETS } from '../../../infrastructure/providers';
import { AchievementCategoryIcon } from '../../../components/AchievementCategoryIcon';

export function AchievementsView() {
  const { navigationTarget } = useShell();
  const { achievements, summary, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, filterCompleted, setFilterCompleted, isLoading, error, toggleAchievement, refresh } = useAchievements();
  const [layer, setLayer] = useState<'categories' | 'list'>(navigationTarget?.route === 'achievements' ? 'list' : 'categories');
  const [version, setVersion] = useState('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const searched = useMemo(() => achievements.filter(item => matchesVersion(item.versionId, version) && normalizeSearch(item.namePtBr + ' ' + item.descriptionPtBr + ' ' + item.category).includes(normalizeSearch(searchQuery))), [achievements, version, searchQuery]);
  const categories = useMemo(() => {
    const grouped = new Map<string, { total: number; completed: number }>();
    for (const item of searched) {
      const entry = grouped.get(item.category) ?? { total: 0, completed: 0 };
      entry.total++; if (item.completed) entry.completed++;
      grouped.set(item.category, entry);
    }
    const complete = new Set(summary?.categorySummaries.filter(c => c.completed === c.total).map(c => c.category));
    return [...grouped].sort(([a], [b]) => compareAchievementCategories(a, b)).filter(([name, entry]) => (!hideCompleted || !complete.has(name)) && (filterCompleted === 'all' || (filterCompleted === 'completed' ? entry.completed > 0 : entry.completed < entry.total)));
  }, [searched, hideCompleted, filterCompleted, summary]);
  const visibleCategories = new Set(categories.map(([name]) => name));
  const filtered = searched.filter(item => visibleCategories.has(item.category) && (selectedCategory === 'all' || item.category === selectedCategory) && (filterCompleted === 'all' || (filterCompleted === 'completed' ? item.completed : !item.completed)));
  const pages = Math.max(1, Math.ceil(filtered.length / (pageSize || Math.max(1, filtered.length))));
  const currentPage = Math.min(page, pages);
  const displayed = pageSize ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize) : filtered;
  const completedCategories = summary?.categorySummaries.filter(item => item.completed === item.total).length ?? 0;
  async function toggle(id: string, completed: boolean) {
    setActionError(null); setSavingIds(previous => new Set(previous).add(id));
    try { await toggleAchievement(id, completed); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Não foi possível salvar a conquista.'); }
    finally { setSavingIds(previous => { const next = new Set(previous); next.delete(id); return next; }); }
  }
  return <div className="ui-page achievements-page">
    <PageHero title="Conquistas & Recompensas" subtitle="Explore suas jornadas em Teyvat e acompanhe cada conquista do seu perfil." actions={<><Button variant="secondary" onClick={() => downloadJson('irminsul-atlas-achievements.json', exportAchievementHistory(achievements))}>Exportar conquistas</Button><Button onClick={() => setImportOpen(true)}>Importar Seelie / Irminsul Atlas</Button></>} />
    {(error || actionError) && <p role="alert" className="ui-error">{actionError || error}</p>}
    {isLoading && <p role="status">Carregando conquistas…</p>}
    <section className="achievement-metrics">
      <MetricCard label="Progresso Geral" value={(summary?.overallPercentage ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'} hint={(summary?.completedAchievements ?? 0) + ' / ' + (summary?.totalAchievements ?? 0) + ' conquistas locais'} />
      <MetricCard label="Gemas Ganhas" value={(summary?.earnedPrimogems ?? 0).toLocaleString('pt-BR')} hint="Recompensas das conquistas concluídas" tone="gold" />
      <MetricCard label="Categorias Finalizadas" value={completedCategories} hint={(summary?.categorySummaries.length ?? 0) + ' categorias no catálogo local'} tone="green" />
      <MetricCard label="Conquistas Pendentes" value={(summary?.totalAchievements ?? 0) - (summary?.completedAchievements ?? 0)} hint="Continue sua jornada" tone="cyan" />
    </section>
    <div className="ui-toolbar"><Button variant={layer === 'categories' ? 'primary' : 'secondary'} onClick={() => setLayer('categories')}>Categorias</Button><Button variant={layer === 'list' ? 'primary' : 'secondary'} onClick={() => setLayer('list')}>Lista detalhada</Button></div>
    <section className="ui-panel">
      <div className="ui-toolbar"><input type="search" aria-label="Buscar conquistas" placeholder="Buscar nome, descrição ou categoria…" value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setPage(1); }} />
        <VersionFilter value={version} onChange={value => { setVersion(value); setPage(1); }} />
        <select aria-label="Filtrar status das conquistas" value={filterCompleted} onChange={event => { setFilterCompleted(event.target.value as 'all' | 'pending' | 'completed'); setPage(1); }}><option value="all">Todos os status</option><option value="pending">Pendentes</option><option value="completed">Concluídas</option></select>
        <Button variant="secondary" onClick={() => { setVersion('all'); setSearchQuery(''); setSelectedCategory('all'); setFilterCompleted('all'); setHideCompleted(false); setPage(1); }}>Limpar filtros</Button>
        <label className="achievement-hide"><input type="checkbox" checked={hideCompleted} onChange={event => setHideCompleted(event.target.checked)} />Ocultar categorias concluídas</label>
      </div>
      {layer === 'categories' && <><div className="achievement-category-heading"><h2>Categorias</h2><button type="button" className="achievement-reset" onClick={() => { setSelectedCategory('all'); setPage(1); }} aria-pressed={selectedCategory === 'all'}>Todas as categorias</button></div>
      <div className="achievement-category-grid">{categories.map(([category, entry]) => <button type="button" className="achievement-category" key={category} aria-pressed={selectedCategory === category} onClick={() => { setSelectedCategory(category); setLayer('list'); setPage(1); }}>
        <AchievementCategoryIcon category={category} size={100} />
        <strong>{category}</strong><span>{(entry.completed / entry.total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span><small>{entry.completed} / {entry.total}</small><ProgressMeter value={entry.completed / entry.total * 100} label={'Progresso · ' + category} />
      </button>)}</div>
      {!categories.length && <p className="ui-empty">Nenhuma categoria corresponde aos filtros.</p>}
      </>}
      <p className="achievement-catalog-note">{ACHIEVEMENT_CATALOG_INFO.count} conquistas canônicas disponíveis offline. Entradas obsoletas não são importadas nem contabilizadas.</p>
    </section>
    {layer === 'list' && <section className="ui-panel">
      <div className="ui-toolbar"><select aria-label="Categoria" value={selectedCategory} onChange={event => { setSelectedCategory(event.target.value); setPage(1); }}><option value="all">Todas as categorias</option>{categories.map(([name]) => <option key={name}>{name}</option>)}</select><h2>{selectedCategory === 'all' ? 'Todas as Conquistas' : selectedCategory}</h2><div className="achievement-status-tabs" role="group" aria-label="Status das conquistas">{(['all', 'pending', 'completed'] as const).map(value => <button type="button" key={value} aria-pressed={filterCompleted === value} onClick={() => { setFilterCompleted(value); setPage(1); }}>{value === 'all' ? 'Todas' : value === 'pending' ? 'Pendentes' : 'Concluídas'}</button>)}</div><span className="ui-muted">{filtered.length} resultados</span></div>
      <div className="achievement-table-scroll"><table className="ui-table achievement-table"><thead><tr><th>Status</th><th>Conquista</th><th>Categoria</th><th>Versão</th><th>Primogemas</th><th>Conclusão</th></tr></thead><tbody>{displayed.map(item => <tr key={item.id} className={item.completed ? 'achievement-completed' : ''}><td><input type="checkbox" aria-label={'Concluir ' + item.namePtBr} checked={item.completed} disabled={savingIds.has(item.id)} onChange={event => void toggle(item.id, event.target.checked)} /></td><td><strong>{item.namePtBr}</strong><p>{item.descriptionPtBr}</p></td><td>{item.category}</td><td>{item.versionId || '—'}</td><td className="achievement-reward"><span className="achievement-reward-value"><img src={UI_ASSETS.items.primogem} alt="" width="24" height="24"/>{item.rewardPrimogems}</span></td><td>{item.completedAt ? new Date(item.completedAt).toLocaleDateString('pt-BR') : '—'}</td></tr>)}</tbody></table></div>
      {!displayed.length && <p className="ui-empty">Nenhuma conquista encontrada para estes filtros.</p>}
      <footer className="achievement-pagination"><label>Por página <select aria-label="Conquistas por página" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[25, 50, 100, 0].map(size => <option key={size} value={size}>{size || 'Todas'}</option>)}</select></label><span>Página {currentPage} de {pages}</span><Button variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button><Button variant="secondary" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Próxima</Button></footer>
    </section>
    }
    <SeelieImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImportSuccess={refresh} />
  </div>;
}
