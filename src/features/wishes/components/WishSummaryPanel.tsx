import React from 'react';
import { BannerOutcomeSummary } from './BannerOutcomeSummary';
import { BannerOutcomeDonut } from './BannerOutcomeDonut';
import { AssetImage } from '../../../components';
import { getBannerPityLimits } from '../../../domain/wishes/types';
import { standardPrediction } from '../../../domain/wishes/presentation';
import { WEAPON_FATE_LABELS } from '../../../domain/wishes/weaponFate';
import type { BannerCurrentPity, BannerStatistics, BannerType, WishEntry } from '../../../domain/wishes/types';

interface Props {
  banner: BannerType;
  stats: BannerStatistics;
  pity: BannerCurrentPity;
  guaranteed: boolean;
  wishes: WishEntry[];
  onBannerChange: (banner: BannerType) => void;
  onEditPity: () => void;
  onRecalculate: () => void;
  isSaving: boolean;
}

export const WishSummaryPanel: React.FC<Props> = ({ banner, stats, pity, guaranteed, wishes, onBannerChange, onEditPity, onRecalculate, isSaving }) => {
  const limit = getBannerPityLimits(banner).hardPity5Star;
  const hasFiftyFifty = banner === 'character';
  const latest = wishes.filter(w => w.bannerType === banner && w.rarity === 5).sort((a,b) => b.sequenceNo - a.sequenceNo)[0];
  const estimate = standardPrediction(wishes);
  const bannerState = banner === 'standard' ? estimate === 'character' ? 'Personagem' : estimate === 'weapon' ? 'Arma' : 'Sem histórico' : banner === 'weapon' ? latest?.weaponFateState ? WEAPON_FATE_LABELS[latest.weaponFateState].replace('Pontos do Destino ', '') : 'Não informado' : banner === 'chronicled' ? 'Por edição' : guaranteed ? 'Garantido' : '50 / 50';
  const decisions = stats.win50_50Count + stats.lost50_50Count;
  const recent = stats.recent5Stars.slice(0, 4);
  return <aside className="wishes-summary" aria-label="Resumo de tiros">
    <header><h2>Resumo de Tiros</h2><select aria-label="Banner do resumo" value={banner} onChange={e => onBannerChange(e.target.value as BannerType)}><option value="character">Personagem</option><option value="weapon">Arma</option><option value="standard">Padrão</option><option value="chronicled">Crônico</option></select></header>
    <p className="wishes-summary__scope">Histórico completo do banner, independente dos filtros da tabela.</p>
    <div className="wishes-metrics">
      <div className="wish-metric"><span>Pity atual</span><strong>{pity?.current5StarPity ?? 0} <small>/ {limit}</small></strong><progress aria-label="Pity atual 5 estrelas" max={limit} value={pity?.current5StarPity ?? 0} /><small>Pity 4★: {pity?.current4StarPity ?? 0} / 10</small></div>
      <div className="wish-metric"><span>{hasFiftyFifty ? 'Status do 50/50' : banner === 'standard' ? 'Predição de próximo tipo' : banner === 'weapon' ? 'Último estado do Caminho' : 'Destino Crônico'}</span><strong>{bannerState}</strong><small>{banner === 'standard' ? 'Estimativa, não garantia oficial' : hasFiftyFifty ? 'Derivado do histórico' : 'Estado histórico, por edição'}</small></div>
      <div className="wish-metric"><span>Pity médio 5★</span><strong>{stats.total5Star ? stats.avg5StarPity.toLocaleString('pt-BR') : '—'}</strong></div>
      <div className="wish-metric"><span>Total de tiros</span><strong>{stats.totalPullsRepresented.toLocaleString('pt-BR')}</strong><small>Ciclos 5★ + pity atual registrado</small></div>
      <div className="wish-metric"><span>Total de 5★</span><strong className="wish-gold">{stats.total5Star}</strong></div>
      <div className="wish-metric"><span>Total de 4★</span><strong className="wish-purple">{stats.total4Star}</strong></div>
    </div>
    {!hasFiftyFifty && <><BannerOutcomeDonut banner={banner} wishes={wishes} /><BannerOutcomeSummary banner={banner} wishes={wishes} /></>}
    {hasFiftyFifty && <section className="wishes-winrate" aria-label="Conquista no 50/50">
      <h3>Conquista no 50/50</h3>
      {hasFiftyFifty && decisions > 0 ? <div className="wishes-winrate__body">
        <div className="wish-ring" style={{ '--win-rate': stats.win50_50Rate + '%' } as React.CSSProperties}><span><strong>{stats.win50_50Rate.toLocaleString('pt-BR')}%</strong><small>Vitórias</small></span></div>
        <dl><div><dt>Vitórias</dt><dd>{stats.win50_50Count}</dd></div><div><dt>Derrotas</dt><dd>{stats.lost50_50Count}</dd></div><div><dt>Total</dt><dd>{decisions}</dd></div></dl>
      </div> : <p>{hasFiftyFifty ? 'Sem decisões de 50/50 registradas.' : '50/50 não se aplica a este banner.'}</p>}
      {hasFiftyFifty && <small>Resultados garantidos não entram na taxa.</small>}
    </section>}
    <section className="wishes-recent"><h3>Últimos 5★</h3>{recent.length ? <div>{recent.map(wish => {
      const entry = wishes.find(w => w.id === wish.id);
      return <article key={wish.id}><AssetImage entityType={entry?.itemType ?? 'character'} entityId={wish.itemId} alt={wish.itemName} size={44} /><strong title={wish.itemName}>{wish.itemName}</strong><small>{wish.pityIndex} pity</small><time dateTime={wish.occurredAt || undefined}>{wish.occurredAt ? new Date(wish.occurredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Sem data'}</time></article>;
    })}</div> : <p>Nenhum 5★ neste banner.</p>}</section>
    <div className="wishes-summary__actions"><button type="button" onClick={onEditPity} disabled={isSaving}>Editar pity atual</button><button type="button" onClick={onRecalculate} disabled={isSaving} title="Recalcular índices do histórico; não altera o pity atual manual">Recalcular histórico</button></div>
  </aside>;
};
