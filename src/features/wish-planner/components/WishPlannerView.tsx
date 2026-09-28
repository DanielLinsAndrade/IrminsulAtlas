import React, { useEffect, useState } from 'react';
import { AssetImage, Badge, Button, ElementIcon, EmptyState, Input, LoadingState } from '../../../components';
import { MetricCard, PageHero, ProgressMeter } from '../../../components/PageLayout';
import { useShell } from '../../../app/providers';
import { normalizeSearch } from '../../../app/search/searchIndex';
import type { CharacterData, WeaponData } from '../../../domain/catalog';
import type { CreateWishGoalInput, UpdateWishGoalInput, WishGoal } from '../../../domain/wishes/goalTypes';
import { defaultGameDataProvider } from '../../../infrastructure/providers';
import { useWishPlanner } from '../hooks/useWishPlanner';
import { GoalFormModal } from './GoalFormModal';
import './WishPlannerView.css';
import { CharacterArt } from '../../../components/CharacterArt';

const statuses = { planning: 'Planejando', reserved: 'Reservado', completed: 'Obtido', canceled: 'Cancelado' };
const priorities = { 1: 'Alta', 2: 'Média', 3: 'Baixa' };

function GoalPreview({ goal, onEdit }: { goal: WishGoal; onEdit: () => void }) {
  const [catalog, setCatalog] = useState<CharacterData | WeaponData | null>(null);
  useEffect(() => {
    let cancelled = false;
    const lookup = goal.targetType === 'character' ? defaultGameDataProvider.getCharacter(goal.targetId) : defaultGameDataProvider.getWeapon(goal.targetId);
    void lookup.then(data => { if (!cancelled) setCatalog(data); }).catch(error => console.warn('Metadados da meta indisponíveis', error));
    return () => { cancelled = true; };
  }, [goal.targetId, goal.targetType]);
  return <article className="planner-target">
    {goal.targetType === 'character' ? <CharacterArt characterId={goal.targetId} name={goal.targetName} context="goal" className="planner-target-art" /> : <AssetImage className="planner-target-art" entityType="weapon" entityId={goal.targetId} alt={goal.targetName} size={185} />}
    <button type="button" className="planner-target-caption" onClick={onEdit} aria-label={`Editar meta ${goal.targetName}`}>
      <h3>{goal.targetName}</h3>
      <span className="ui-gold">{catalog ? `${catalog.rarity}★ · ` : ''}{goal.targetType === 'character' ? 'C' : 'R'}{goal.targetRank}</span>
      {catalog && 'element' in catalog && <ElementIcon element={catalog.element} size={18}/>}
      <Badge variant={goal.priority === 1 ? 'gold' : 'purple'} size="sm">Prioridade {priorities[goal.priority]}</Badge>
      <p>{goal.notes || statuses[goal.status]}</p>
      <small>{goal.expectedVersionId ? `Versão planejada ${goal.expectedVersionId}` : 'Versão não definida'}</small>
    </button>
  </article>;
}

export const WishPlannerView: React.FC = () => {
  const { activeProfile, navigationTarget } = useShell();
  const planner = useWishPlanner();
  const { goals, simulations, resources, totalSavingsPulls, characterPity, weaponPity, aggregated, isLoading, isSaving, error, createGoal, updateGoal, deleteGoal, markCompleted, reorderGoals } = planner;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WishGoal | null>(null);
  const [query, setQuery] = useState(navigationTarget?.route === 'banners' ? navigationTarget.query : '');
  const [type, setType] = useState('all');
  const openEdit = (goal: WishGoal) => { setEditingGoal(goal); setIsModalOpen(true); };
  const openAdd = () => { setEditingGoal(null); setIsModalOpen(true); };
  const submit = async (input: CreateWishGoalInput | UpdateWishGoalInput) => {
    if (editingGoal) await updateGoal(editingGoal.id, input);
    else await createGoal(input as CreateWishGoalInput);
  };
  const remove = async (goal: WishGoal) => {
    if (window.confirm(`Deseja remover a meta "${goal.targetName}"?`)) await deleteGoal(goal.id);
  };
  const move = (index: number, direction: number) => {
    const ids = goals.map(g => g.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    void reorderGoals(ids);
  };
  const filtered = simulations.filter(s => (type === 'all' || s.goal.targetType === type) && normalizeSearch(s.goal.targetName).includes(normalizeSearch(query)));
  const activeGoals = goals.filter(g => g.status !== 'completed' && g.status !== 'canceled');
  const versions = [...new Set(activeGoals.map(g => g.expectedVersionId ?? 'Sem versão'))];
  if (!activeProfile) return <EmptyState title="Nenhum perfil ativo" description="Selecione um perfil para planejar seus desejos."/>;
  if (isLoading && !goals.length) return <LoadingState title="Carregando planejamento…"/>;
  return <div className="ui-page">
    <PageHero title="Planejamento de Banners" subtitle="Organize seus desejos, trace suas metas e acompanhe cada próximo encontro." actions={<Button onClick={openAdd}>Adicionar alvo</Button>}/>
    {error && <p role="alert">{error}</p>}
    <div className="metric-grid">
      <MetricCard label="Tiros disponíveis" value={totalSavingsPulls} hint={`${resources?.intertwinedFates ?? 0} destinos entrelaçados`} tone="cyan"/>
      <MetricCard label="Primogemas atuais" value={(resources?.primogems ?? 0).toLocaleString('pt-BR')} hint="Saldo registrado no perfil" tone="gold"/>
      <MetricCard label="Viabilidade conservadora" value={aggregated.isFullyGuaranteed ? 'Coberto' : 'Acumular'} hint={`${aggregated.activeGoalsCount} metas ativas`} tone={aggregated.isFullyGuaranteed ? 'green' : 'violet'}/>
      <MetricCard label="Ainda falta guardar" value={Math.max(0, -aggregated.overallWorstCaseBalance)} hint="Tiros no cenário conservador" tone="gold"/>
    </div>
    <div className="planner-overview">
      <section className="ui-panel"><div className="ui-panel-heading"><h2>Próximos Alvos</h2><small className="ui-muted">Suas metas cadastradas</small></div>
        {activeGoals.length ? <div className="planner-targets">{activeGoals.slice(0, 4).map(goal => <GoalPreview key={goal.id} goal={goal} onEdit={() => openEdit(goal)}/>)}</div> : <EmptyState title="Sem metas ativas" description="Adicione seu próximo personagem ou arma." actionLabel="Adicionar alvo" onAction={openAdd}/>}
      </section>
      <section className="ui-panel"><div className="ui-panel-heading"><h2>Simulador de Tiros</h2></div>
        <div className="planner-scenarios">
          <MetricCard label="Conservador" value={aggregated.totalWorstCasePullsNeeded} hint={`Saldo: ${aggregated.overallWorstCaseBalance} tiros`} tone="green"/>
          <MetricCard label="Esperado" value={aggregated.totalExpectedPullsNeeded} hint={`Saldo: ${aggregated.overallExpectedBalance} tiros`} tone="cyan"/>
        </div>
        <p className="ui-muted planner-explanation">Personagens: projeção a 80 tiros por 5★, considerando constelações já obtidas, pity atual, garantia e Captura de Esplendor. É uma estimativa, não garantia de custo. As metas são simuladas individualmente.</p>
        <div className="ui-toolbar"><strong>Captura de Esplendor {planner.capturePoints}/4</strong><label>Ajuste de pontos<select aria-label="Pontos de Captura de Esplendor" disabled={isSaving} value={planner.captureOverride ?? 'auto'} onChange={event => void planner.saveCaptureOverride(event.target.value === 'auto' ? null : Number(event.target.value))}><option value="auto">Usar histórico</option>{[0,1,2,3,4].map(points => <option key={points} value={points}>{points}/4</option>)}</select></label></div>
        <p className="ui-muted">{planner.captureOverride !== null ? 'Ajuste manual deste perfil; selecione Usar histórico para voltar ao cálculo automático.' : planner.captureReliable ? 'Estado derivado a partir do último reset observado no histórico.' : 'Histórico sem reset confirmado: estimativa a partir de zero. Ajuste os pontos se o histórico estiver incompleto.'}</p>
        <dl className="planner-pity"><div><dt>Pity personagem</dt><dd>{characterPity.current5StarPity} / 90</dd></div><div><dt>Garantia personagem</dt><dd>{characterPity.is5StarGuaranteed ? 'Garantido' : '50/50'}</dd></div><div><dt>Pity arma</dt><dd>{weaponPity.current5StarPity} / 80</dd></div></dl>
      </section>
    </div>
    <div className="ui-split">
      <section className="ui-panel">
        <div className="ui-panel-heading"><h2>Lista de Planejamento</h2><span className="ui-muted">{goals.length} metas</span></div>
        <div className="ui-toolbar"><Input aria-label="Buscar meta" placeholder="Buscar alvo…" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="Tipo de meta" value={type} onChange={e => setType(e.target.value)}><option value="all">Todos os tipos</option><option value="character">Personagens</option><option value="weapon">Armas</option></select></div>
        <div className="ui-table-scroll"><table className="ui-table planner-table"><thead><tr><th>Alvo</th><th>Prioridade</th><th>Versão</th><th>Meta / Reserva</th><th>Status</th><th>Ações</th></tr></thead><tbody>
          {filtered.map(({ goal, pullsRequiredWorstCase }) => <tr key={goal.id}><td><div className="planner-row-name"><AssetImage entityType={goal.targetType} entityId={goal.targetId} alt={goal.targetName} size={36}/><div><strong>{goal.targetName}</strong><small>{goal.targetType === 'character' ? 'C' : 'R'}{goal.targetRank}</small></div></div></td><td>{priorities[goal.priority]}</td><td>{goal.expectedVersionId ?? 'A definir'}</td><td>{goal.reservedWishes} / {pullsRequiredWorstCase}<ProgressMeter label={`Reserva para ${goal.targetName}`} value={pullsRequiredWorstCase > 0 ? goal.reservedWishes / pullsRequiredWorstCase * 100 : 100}/><small>Reserva individual / pior caso</small></td><td><Badge variant={goal.status === 'completed' ? 'success' : 'purple'}>{statuses[goal.status]}</Badge></td><td><div className="planner-row-actions"><Button size="sm" variant="ghost" onClick={() => openEdit(goal)} disabled={isSaving}>Editar</Button>{goal.status !== 'completed' && <Button size="sm" variant="secondary" onClick={() => void markCompleted(goal.id).catch(console.error)} disabled={isSaving}>Obtido</Button>}<Button size="sm" variant="danger" disabled={isSaving} onClick={() => void remove(goal).catch(console.error)}>Excluir</Button></div></td></tr>)}
        </tbody></table>{!filtered.length && <p className="ui-muted">Nenhuma meta corresponde aos filtros.</p>}</div>
      </section>
      <aside className="ui-panel"><div className="ui-panel-heading"><h2>Prioridades</h2></div><ol className="planner-priorities">{goals.map((goal, index) => <li key={goal.id}><span>{index + 1}</span><AssetImage entityType={goal.targetType} entityId={goal.targetId} alt={goal.targetName} size={28}/><strong>{goal.targetName}</strong><Button size="sm" variant="ghost" aria-label={`Subir ${goal.targetName}`} disabled={isSaving || index === 0} onClick={() => move(index, -1)}>↑</Button><Button size="sm" variant="ghost" aria-label={`Descer ${goal.targetName}`} disabled={isSaving || index === goals.length - 1} onClick={() => move(index, 1)}>↓</Button></li>)}</ol></aside>
    </div>
    <section className="ui-panel"><div className="ui-panel-heading"><h2>Versões Planejadas</h2><small className="ui-muted">Organização manual das metas; não é um calendário oficial de banners.</small></div><div className="planner-versions">{versions.map(version => <article key={version}><h3>{version}</h3>{activeGoals.filter(g => (g.expectedVersionId ?? 'Sem versão') === version).map(g => <button type="button" key={g.id} onClick={() => openEdit(g)}>{g.targetName}</button>)}</article>)}</div></section>
    <GoalFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={submit} editingGoal={editingGoal} isSaving={isSaving}/>
  </div>;
};
