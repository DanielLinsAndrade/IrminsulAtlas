import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AssetImage } from '../../../components';
import { MetricCard, PageHero, ProgressMeter } from '../../../components/PageLayout';
import { PRIMOGEMS_PER_WISH } from '../../../domain/inventory/calculations';
import { BANNER_LABELS } from '../../../domain/wishes/types';
import type { BannerType } from '../../../domain/wishes/types';
import { useWishes } from '../hooks/useWishes';
import './StatisticsView.css';
import { BannerDetailChart } from './BannerDetailChart';
import { WishVersionChart } from './WishVersionChart';
import { wishResultColor, wishResultLabel } from '../../../domain/wishes/presentation';
import { BannerOutcomeSummary } from './BannerOutcomeSummary';

const banners: BannerType[] = ['character', 'weapon', 'standard', 'chronicled'];
const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR');
}

export function StatisticsView() {
  const { summaryStats: stats, wishes, currentBannerPity, isLoading, error } = useWishes();
  const [type, setType] = useState('all');
  const [banner, setBanner] = useState<BannerType | 'all'>('all');
  const [order, setOrder] = useState('recent');
  const historyTrack = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (historyTrack.current) historyTrack.current.scrollLeft = 0; }, [type, banner, order, wishes]);
  const fiveStars = useMemo(() => wishes.filter(wish => wish.rarity === 5 && (type === 'all' || wish.itemType === type) && (banner === 'all' || wish.bannerType === banner)).sort((a, b) => order === 'pity' ? a.pityIndex - b.pityIndex : order === 'oldest' ? a.occurredAt.localeCompare(b.occurredAt) || a.sequenceNo - b.sequenceNo : b.occurredAt.localeCompare(a.occurredAt) || b.sequenceNo - a.sequenceNo), [wishes, type, banner, order]);
  const buckets = [20, 40, 60, 80, 90].map((end, index, ends) => ({ end, start: index === 0 ? 1 : ends[index - 1] + 1, count: fiveStars.filter(wish => wish.pityIndex <= end && wish.pityIndex > (index === 0 ? 0 : ends[index - 1])).length }));
  const maximum = Math.max(1, ...buckets.map(bucket => bucket.count));
  const wins = stats.bannerStats.character.win50_50Count;
  const losses = stats.bannerStats.character.lost50_50Count;
  return <div className="ui-page statistics-page">
    <PageHero title="Estatísticas & Análise de Sorte" subtitle="Uma leitura do seu histórico, das conquistas e de cada desejo investido." />
    {error && <p role="alert" className="ui-error">{error}</p>}
    {isLoading && <p role="status">Carregando histórico…</p>}
    <section className="statistics-metrics" aria-label="Resumo do histórico">
      <MetricCard label="Total de Tiros" value={number(stats.totalPullsRepresented)} hint="Tiros representados pelo histórico registrado" />
      <MetricCard label="Gemas Investidas" value={number(stats.totalPullsRepresented * PRIMOGEMS_PER_WISH)} hint="Equivalência em primogemas · não gasto financeiro" tone="gold" />
      <MetricCard label="Vitórias no 50/50" value={wins + losses > 0 ? number(stats.global50_50Rate) + '%' : '—'} hint={wins + ' vitórias · ' + losses + ' derrotas'} tone="green" />
      <MetricCard label="Média Pity 5★" value={stats.total5Star ? number(stats.avg5StarPity) : '—'} hint={stats.total5Star + ' resultados 5★ registrados'} tone="cyan" />
      <MetricCard label="Custo Médio / Limitado" value={stats.avgCostPerLimited > 0 ? number(stats.avgCostPerLimited) : '—'} hint="Tiros por personagem limitado obtido" tone="gold" />
      <MetricCard label="Média ao Perder 50/50" value={stats.avgCostWhenLost50_50 > 0 ? number(stats.avgCostWhenLost50_50) : '—'} hint="Ciclos completos até o personagem garantido" tone="red" />
    </section>
    <section className="ui-panel statistics-history">
      <div className="ui-toolbar"><div><h2>Histórico dos 5★</h2><p className="ui-muted">{fiveStars.length} resultados · os filtros afetam o histórico e sua distribuição</p></div>
        <select aria-label="Tipo de item" value={type} onChange={event => setType(event.target.value)}><option value="all">Todos os tipos</option><option value="character">Personagens</option><option value="weapon">Armas</option></select>
        <select aria-label="Banner do histórico" value={banner} onChange={event => setBanner(event.target.value as BannerType | 'all')}><option value="all">Todos os banners</option>{banners.map(value => <option key={value} value={value}>{BANNER_LABELS[value]}</option>)}</select>
        <select aria-label="Ordenação do histórico" value={order} onChange={event => setOrder(event.target.value)}><option value="recent">Mais recentes</option><option value="oldest">Mais antigos</option><option value="pity">Menor pity</option></select>
      </div>
      <div ref={historyTrack} className="statistics-history-track">{fiveStars.map(wish => <article key={wish.id} className="statistics-wish" style={{ borderColor: wishResultColor(wish) }}>
        <div className="statistics-wish-art"><AssetImage entityType={wish.itemType} entityId={wish.itemId} alt={wish.itemName} size={108} /></div><strong className="statistics-wish-pity">Pity {wish.pityIndex}</strong>
        <h3>{wish.itemName}</h3><p>{wish.bannerName || BANNER_LABELS[wish.bannerType]}</p>
        <span className="statistics-result" style={{ color: wishResultColor(wish), borderColor: wishResultColor(wish) }}>{wishResultLabel(wish)}</span>
        <time dateTime={wish.occurredAt}>{dateLabel(wish.occurredAt)}</time>
      </article>)}</div>
      {!fiveStars.length && <p className="ui-empty">Nenhum resultado 5★ corresponde aos filtros.</p>}
    </section>
    <section><h2>Detalhamento por Banner</h2><div className="statistics-banners">{banners.map(value => {
      const current = stats.bannerStats[value];
      const trials = current.win50_50Count + current.lost50_50Count;
      return <article className="ui-panel statistics-banner" key={value}><h3>{BANNER_LABELS[value]}</h3><div className="statistics-banner-total"><strong>{number(current.totalPullsRepresented)}</strong><span>tiros representados</span></div>
        <BannerDetailChart banner={value} wishes={wishes} currentPity={currentBannerPity?.[value]?.current5StarPity ?? 0} />
        <BannerOutcomeSummary banner={value} wishes={wishes} />
        <dl><div><dt>Resultados 5★</dt><dd>{current.total5Star}</dd></div><div><dt>Resultados 4★</dt><dd>{current.total4Star}</dd></div><div><dt>Pity médio 5★</dt><dd>{current.total5Star ? number(current.avg5StarPity) : '—'}</dd></div><div><dt>Pity derivado do histórico</dt><dd>{current.currentPity.current5StarPity}</dd></div></dl>
        {value === 'character' && <div className="statistics-banner-rate"><span>Vitórias no 50/50 <strong>{trials ? number(current.win50_50Rate) + '%' : '—'}</strong></span><ProgressMeter value={current.win50_50Rate} label={'Vitórias no 50/50 · ' + BANNER_LABELS[value]} /><small>{current.win50_50Count} vitórias · {current.lost50_50Count} derrotas · {current.guaranteed5StarCount} garantidos</small></div>}
      </article>;
    })}</div></section>
    <section className="ui-panel"><h2>Distribuição de Pity dos 5★</h2><p className="ui-muted">Quantidade de resultados registrados em cada faixa de pity, conforme os filtros acima.</p><div className="statistics-histogram">{buckets.map(bucket => <div key={bucket.end}><strong>{bucket.count}</strong><div className="statistics-bar-space"><span style={{ height: bucket.count / maximum * 100 + '%' }} /></div><small>{bucket.start}–{bucket.end}</small></div>)}</div></section>
    <WishVersionChart wishes={fiveStars} bannerContext={banner} />
  </div>;
}
