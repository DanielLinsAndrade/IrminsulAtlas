import { useEffect, useState } from 'react';
import { useShell } from '../../../app/providers';
import { Button, Modal } from '../../../components';
import { PageHero } from '../../../components/PageLayout';
import { SettingsProfilesView } from '../../profiles';
import { type AssetCacheStats, type CatalogSummary, clearAssetCacheSafely, getAssetCacheStats, getCatalogSummary, getStoragePathsInfo, saveAppSetting } from '../../../domain/settings';
import { achievementsRepository, appSettingsRepository, catalogRepository, schemaMetadataRepository } from '../../../infrastructure/db';
import { defaultAssetCache, defaultNativeAssetStorage } from '../../../infrastructure/cache';
import appPackage from '../../../../package.json';
import './SettingsView.css';

export function SettingsView() {
  const { isSidebarCollapsed, toggleSidebar } = useShell();
  const [compact, setCompact] = useState(document.documentElement.dataset.density === 'compact');
  const [saving, setSaving] = useState(false);
  const [cacheStats, setCacheStats] = useState<AssetCacheStats | null>(null);
  const [catalog, setCatalog] = useState<CatalogSummary | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const paths = getStoragePathsInfo();
  useEffect(() => {
    let cancelled = false;
    void Promise.all([appSettingsRepository.getSetting('ui.compact_density'), getAssetCacheStats(defaultAssetCache), getCatalogSummary(catalogRepository, achievementsRepository, schemaMetadataRepository)]).then(([density, stats, summary]) => {
      if (!cancelled) { setCompact(density === 'true'); setCacheStats(stats); setCatalog(summary); }
    }).catch(cause => { if (!cancelled) setError(String(cause)); });
    return () => { cancelled = true; };
  }, []);
  async function updateDensity(value: boolean) {
    setSaving(true); setError(null);
    try { await saveAppSetting(appSettingsRepository, 'compactDensity', value); setCompact(value); document.documentElement.dataset.density = value ? 'compact' : 'comfortable'; setFeedback('Preferência salva.'); }
    catch (cause) { setError('Não foi possível salvar a preferência: ' + String(cause)); }
    finally { setSaving(false); }
  }
  async function clearCache() {
    setClearing(true); setError(null);
    try { await clearAssetCacheSafely(defaultAssetCache, defaultNativeAssetStorage); setCacheStats(await getAssetCacheStats(defaultAssetCache)); setConfirmClear(false); setFeedback('Cache de imagens limpo. Perfis, histórico e inventário permanecem intactos.'); }
    catch (cause) { setError('Não foi possível concluir a limpeza: ' + String(cause)); }
    finally { setClearing(false); }
  }
  return <div className="ui-page settings-page">
    <PageHero title="Configurações" subtitle="Sua conta, suas preferências e seus dados. Tudo sob seu controle." />
    <nav className="settings-section-nav" aria-label="Seções das configurações">{[['profiles', 'Perfis de Conta'], ['storage', 'Armazenamento & Cache'], ['preferences', 'Preferências'], ['catalog', 'Catálogo & Sistema']].map(([id, label]) => <button type="button" key={id} onClick={() => document.getElementById('settings-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{label}</button>)}</nav>
    {error && <p className="ui-error" role="alert">{error}</p>}{feedback && <p className="settings-feedback" role="status">{feedback}</p>}
    <div id="settings-profiles"><SettingsProfilesView /></div>
    <div className="settings-dashboard">
      <section className="ui-panel settings-section" id="settings-storage"><h2>Cache de Imagens & Assets</h2><p className="ui-muted">Somente arquivos temporários e metadados de imagens.</p><div className="settings-cache-count"><strong>{cacheStats?.totalCount ?? '—'}</strong><span>entradas no cache</span></div>
        <dl className="settings-facts">{[['Personagens', cacheStats?.charactersCount], ['Armas', cacheStats?.weaponsCount], ['Materiais', cacheStats?.materialsCount], ['Artefatos', cacheStats?.artifactsCount], ['Outros', cacheStats?.otherCount]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
        <p className="settings-note">Tamanho em bytes não disponível. Assets incluídos no aplicativo não são removidos.</p>
        <Button variant="outline" onClick={() => setConfirmClear(true)}>Limpar Cache de Imagens</Button>
        <h3>Diretórios de Armazenamento</h3><dl className="settings-paths"><dt>Banco de dados</dt><dd>{paths.databaseFile}</dd><dt>Imagens temporárias</dt><dd>{paths.assetCacheDir}</dd></dl>
        <div className="settings-preservation"><strong>Garantia de Preservação de Dados</strong><p>A limpeza não apaga SQLite, perfis, tiros, inventário ou builds. Use Backup & Restauração na seção de perfis para exportar seus dados.</p></div>
      </section>
      <section className="ui-panel settings-section" id="settings-preferences"><h2>Preferências da Aplicação</h2><p className="ui-muted">Ajustes locais aplicados ao aplicativo.</p>
        <label className="settings-switch"><span><strong>Densidade Compacta da Interface</strong><small>Reduz espaçamentos dos painéis e tabelas.</small></span><input type="checkbox" checked={compact} disabled={saving} onChange={event => void updateDensity(event.target.checked)} /></label>
        <label className="settings-switch"><span><strong>Menu lateral recolhido</strong><small>Ícones e botão Expandir sempre acessíveis.</small></span><input type="checkbox" checked={isSidebarCollapsed} onChange={toggleSidebar} /></label>
        <dl className="settings-facts"><div><dt>Idioma da interface</dt><dd>Português (Brasil)</dd></div><div><dt>Aparência</dt><dd>Fantasia noturna</dd></div><div><dt>Busca global</dt><dd><kbd>Ctrl + K</kbd></dd></div></dl>
        <div className="settings-preservation"><strong>Assets locais e exclusão segura</strong><p>As imagens usam o provider e os fallbacks locais. As confirmações de exclusão continuam ativas.</p></div>
        <p className="settings-note">Os antigos controles de download automático e banner padrão não tinham efeito nos módulos. Eles foram retirados desta tela; seus valores salvos não foram apagados.</p>
      </section>
      <section className="ui-panel settings-section" id="settings-catalog"><h2>Catálogo & Sistema</h2><h3>Versões & Ambiente</h3><dl className="settings-facts"><div><dt>Irminsul Atlas</dt><dd>{appPackage.version}</dd></div><div><dt>Revisão do catálogo</dt><dd>{catalog?.gameVersion ?? '—'}</dd></div><div><dt>Schema SQLite</dt><dd>{catalog?.schemaVersion ?? '—'}</dd></div><div><dt>Provider</dt><dd>{catalog?.sourceProvider ?? '—'}</dd></div></dl>
        <h3>Estatísticas do Catálogo de Jogo</h3><dl className="settings-facts">{[['Personagens', catalog?.charactersCount], ['Armas', catalog?.weaponsCount], ['Materiais', catalog?.materialsCount], ['Conjuntos de artefatos', catalog?.artifactSetsCount], ['Conquistas', catalog?.achievementsCount]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl><p className="settings-note">{paths.environmentDescription}</p><p className="settings-note">A revisão identifica o catálogo embarcado, não a versão mais recente do jogo. Atualização automática não disponível.</p>
      </section>
    </div>
    <Modal isOpen={confirmClear} onClose={() => { if (!clearing) setConfirmClear(false); }} title="Limpar cache de imagens?" footer={<><Button variant="secondary" disabled={clearing} onClick={() => setConfirmClear(false)}>Cancelar</Button><Button variant="danger" disabled={clearing} onClick={() => void clearCache()}>{clearing ? 'Limpando…' : 'Confirmar Limpeza'}</Button></>}><div className="settings-confirm"><p>Esta ação remove apenas o cache de imagens baixadas. Seus dados, perfis e assets incluídos no aplicativo serão preservados.</p>{error && <p role="alert" className="ui-error">{error}</p>}</div></Modal>
  </div>;
}
