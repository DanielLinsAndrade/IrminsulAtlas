import React, { useState } from 'react';
import { VersionFilter } from '../../../components/VersionFilter';
import { AssetImage, Button, Modal } from '../../../components';
import type { BannerType, CreateWishInput, UpdateWishInput, WishEntry } from '../../../domain/wishes/types';
import { BANNER_LABELS, getBannerPityLimits } from '../../../domain/wishes/types';
import { UI_ASSETS } from '../../../infrastructure/providers';
import { useWishes } from '../hooks/useWishes';
import { WishFormModal } from './WishFormModal';
import { EditCurrentPityModal } from './EditCurrentPityModal';
import { WishSummaryPanel } from './WishSummaryPanel';
import { WishDistributionChart } from './WishDistributionChart';
import './WishesView.css';
import { WishHistoryModal } from './WishHistoryModal';
import { WishVersionChart } from './WishVersionChart';
import { exportWishHistory } from '../../../domain/wishes/history';
import { saveWishHistory } from '../../../lib/saveWishHistory';
import { wishResultColor, wishResultLabel } from '../../../domain/wishes/presentation';

const bannerNames: Record<BannerType, string> = { character: 'Personagem', weapon: 'Arma', standard: 'Padrão', chronicled: 'Crônico' };
const bannerIcons = { character: UI_ASSETS.sidebar.characters.default, weapon: UI_ASSETS.sidebar.weapons, standard: UI_ASSETS.items.acquaintFate, chronicled: UI_ASSETS.sidebar.wishes };

export const WishesView: React.FC = () => {
  const { wishes, filteredWishes, pityStates, currentBannerPity, bannerStats,
    selectedBanner, setSelectedBanner, rarityFilter, setRarityFilter,
    versionFilter, setVersionFilter, searchQuery, setSearchQuery,
    isLoading, isSaving, error, addWish, updateWish, deleteWish,
    recalculateBannerPity, updateBannerCurrentPity, refresh } = useWishes();
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportHistory = async () => {
    setExporting(true); setExportError(null);
    try { await saveWishHistory(exportWishHistory(wishes)); }
    catch (cause) { setExportError(`Não foi possível exportar: ${cause instanceof Error ? cause.message : String(cause)}`); }
    finally { setExporting(false); }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<WishEntry | null>(null);
  const [deletingWish, setDeletingWish] = useState<WishEntry | null>(null);
  const [isEditPityModalOpen, setIsEditPityModalOpen] = useState(false);
  const [summaryBanner, setSummaryBanner] = useState<BannerType>('character');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [ascending, setAscending] = useState(false);
  const activeBanner = selectedBanner === 'all' ? summaryBanner : selectedBanner;

  const chooseBanner = (banner: BannerType | 'all') => { setSelectedBanner(banner); setPage(1); };
  const openAdd = () => { setEditingWish(null); setIsModalOpen(true); };
  const submit = async (input: CreateWishInput | UpdateWishInput) => {
    if (editingWish) await updateWish(editingWish.id, input);
    else await addWish(input as CreateWishInput);
  };
  const remove = async (wish: WishEntry) => {
    await deleteWish(wish.id);
    setDeletingWish(null);
  };
  // Filtros e paginação são apenas apresentação; nenhuma escrita no histórico.
  const cutoff = period === 'all' ? null : new Date().setDate(new Date().getDate() - Number(period));
  const visible = filteredWishes.filter(w => cutoff === null || new Date(w.occurredAt).getTime() >= cutoff)
    .sort((a, b) => (ascending ? 1 : -1) * (new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime() || a.sequenceNo - b.sequenceNo));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const rows = visible.slice(start, start + pageSize);

  if (isLoading && !wishes.length) return <div className="wishes-empty" role="status">Carregando histórico de tiros...</div>;

  return <div className="wishes-view">
    {deletingWish && <Modal isOpen title="Excluir registro de tiro?" onClose={() => { if (!isSaving) setDeletingWish(null); }} footer={<><Button variant="secondary" disabled={isSaving} onClick={() => setDeletingWish(null)}>Cancelar</Button><Button disabled={isSaving} onClick={() => { void remove(deletingWish).catch(() => { /* useWishes exposes the persistence error below. */ }); }}>Confirmar exclusão</Button></>}>
      <p>Excluir somente o registro de {deletingWish.itemName}? O pity manual e a ordem dos outros registros serão preservados.</p>
      {error && <p role="alert">{error}</p>}
    </Modal>}
    {importOpen && <WishHistoryModal onClose={() => setImportOpen(false)} onImported={refresh} />}
    <header className="wishes-hero">
      <div className="wishes-hero__title"><img src={UI_ASSETS.sidebar.wishes} alt="" /><div><h1>Registro de Tiros</h1><p>Acompanhe seu histórico, analise sua sorte e reviva cada conquista.</p></div></div>
      <div className="wishes-hero__bottom">
        <nav className="wishes-banner-tabs" aria-label="Selecionar banner">
          {(['character', 'weapon', 'standard', 'chronicled'] as const).map(type => <button type="button" key={type} aria-pressed={selectedBanner === type} onClick={() => chooseBanner(type)}>
            <img src={bannerIcons[type]} alt="" /><span>{bannerNames[type]}<small>Pity {currentBannerPity[type]?.current5StarPity ?? 0} / {getBannerPityLimits(type).hardPity5Star}</small></span>
          </button>)}
        </nav>
        <div className="wishes-toolbar-actions" role="group" aria-label="Ações do histórico">
        <Button variant="secondary" disabled={exporting} onClick={() => { void exportHistory(); }}>{exporting ? 'Exportando...' : 'Exportar'}</Button>
        <Button variant="secondary" onClick={() => setImportOpen(true)}>Importar Histórico</Button>
        <Button onClick={openAdd}>Registrar Tiro</Button>
        </div>
      </div>
    </header>
    {error && <div className="wishes-error" role="alert">{error}</div>}
    {exportError && <div className="wishes-error" role="alert">{exportError}</div>}
    <div className="wishes-workspace">
      <section className="wishes-history" aria-label="Histórico de tiros">
        <div className="wishes-filters">
          <label>Banner<select value={selectedBanner} onChange={e => chooseBanner(e.target.value as BannerType | 'all')}><option value="all">Todos os banners</option>{Object.entries(bannerNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
          <label>Raridade<select value={rarityFilter} onChange={e => { setRarityFilter(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1); }}><option value="all">Todas</option>{[5, 4, 3].map(r => <option key={r} value={r}>{r}★</option>)}</select></label>
          <VersionFilter fieldLabel="Versão" label="Versão do histórico" value={versionFilter} onChange={value => { setVersionFilter(value); setPage(1); }} />
          <label>Período<select value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }}><option value="all">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Último ano</option></select></label>
          <label className="wishes-search">Buscar item ou banner<input type="search" placeholder="Buscar no histórico..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} /></label>
        </div>
        <div className="wishes-table-scroll">
          <table className="wishes-table">
            <caption className="visually-hidden">Tiros registrados, filtrados por banner, raridade, versão e período</caption>
            <thead><tr><th scope="col" aria-sort={ascending ? 'ascending' : 'descending'}><button type="button" onClick={() => { setAscending(!ascending); setPage(1); }}>Data {ascending ? '↑' : '↓'}</button></th><th scope="col">Item / Banner</th><th scope="col">Raridade</th><th scope="col">Pity</th><th scope="col">Resultado</th><th scope="col">Observações</th><th scope="col">Ações</th></tr></thead>
            <tbody>{rows.map(wish => <tr key={wish.id} className={`wish-row wish-row--${wish.rarity}`}>
              <td><time dateTime={wish.occurredAt || undefined}>{wish.occurredAt ? new Date(wish.occurredAt).toLocaleDateString('pt-BR') : 'Data não informada'}</time><small>{wish.gameVersionId ? `v${wish.gameVersionId}` : 'Versão não informada'}</small></td>
              <td><div className="wish-item"><AssetImage entityType={wish.itemType} entityId={wish.itemId} alt={wish.itemName} size={38} /><span><strong>{wish.itemName}</strong><small title={BANNER_LABELS[wish.bannerType]}>{wish.bannerName || bannerNames[wish.bannerType]}</small>{wish.notes && <small className="wish-inline-note" title={wish.notes}>{wish.notes}</small>}</span></div></td>
              <td><span className="wish-stars" aria-label={`${wish.rarity} estrelas`}>{'★'.repeat(wish.rarity)}</span></td>
              <td><b className="wish-pity">{wish.pityIndex}</b></td>
              <td><span className="wish-result" style={{ color: wishResultColor(wish), backgroundColor: `${wishResultColor(wish)}18` }}>{wishResultLabel(wish)}</span></td>
              <td><span className="wish-notes" title={wish.notes || undefined}>{wish.notes || '—'}</span></td>
              <td><div className="wish-actions"><button type="button" aria-label={`Editar ${wish.itemName}`} disabled={isSaving} onClick={() => { setEditingWish(wish); setIsModalOpen(true); }}>Editar</button><button type="button" aria-label={`Excluir ${wish.itemName}`} disabled={isSaving} onClick={() => setDeletingWish(wish)}>Excluir</button></div></td>
            </tr>)}</tbody>
          </table>
          {!visible.length && <div className="wishes-empty"><h2>{wishes.length ? 'Nenhum resultado para estes filtros' : 'Seu histórico começa aqui'}</h2><p>{wishes.length ? 'Ajuste os filtros para encontrar seus tiros.' : 'Registre seu primeiro tiro para acompanhar a jornada.'}</p>{!wishes.length && <Button onClick={openAdd}>Registrar Tiro</Button>}</div>}
        </div>
        <footer className="wishes-pagination">
          <span role="status">Mostrando {visible.length ? start + 1 : 0}–{Math.min(start + pageSize, visible.length)} de {visible.length} tiros</span>
          <nav aria-label="Paginação do histórico"><button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span>Página {currentPage} de {pageCount}</span><button type="button" aria-label="Próxima página" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></nav>
          <label>Por página<select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>{[8, 16, 32].map(n => <option key={n}>{n}</option>)}</select></label>
        </footer>
      </section>
      <WishSummaryPanel banner={activeBanner} stats={bannerStats[activeBanner]} pity={currentBannerPity[activeBanner]} guaranteed={pityStates[activeBanner].is5StarGuaranteed} wishes={wishes} onBannerChange={banner => { setSummaryBanner(banner); if (selectedBanner !== 'all') chooseBanner(banner); }} onEditPity={() => setIsEditPityModalOpen(true)} onRecalculate={() => { void recalculateBannerPity(activeBanner).catch(console.error); }} isSaving={isSaving} />
      <WishDistributionChart wishes={visible} />
      <WishVersionChart wishes={visible} bannerContext={selectedBanner} />
    </div>
    {isModalOpen && <WishFormModal isOpen onClose={() => setIsModalOpen(false)} onSubmit={submit} initialBannerType={activeBanner} editingWish={editingWish} isSaving={isSaving} />}
    {isEditPityModalOpen && <EditCurrentPityModal isOpen onClose={() => setIsEditPityModalOpen(false)} bannerType={activeBanner} current5StarPity={currentBannerPity[activeBanner]?.current5StarPity ?? 0} current4StarPity={currentBannerPity[activeBanner]?.current4StarPity ?? 0} onSave={async (type, input) => { await updateBannerCurrentPity(type, input); }} isSaving={isSaving} />}
  </div>;
};
