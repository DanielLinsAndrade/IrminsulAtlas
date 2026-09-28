import type { BannerType, WishEntry } from '../../../domain/wishes/types';
import { getBannerPityLimits } from '../../../domain/wishes/types';
import { UI_ASSETS } from '../../../infrastructure/providers';
export function BannerDetailChart({ banner, wishes, currentPity }: { banner: BannerType; wishes: WishEntry[]; currentPity: number }) {
  const cap = getBannerPityLimits(banner).hardPity5Star;
  const five = wishes.filter(w => w.bannerType === banner && w.rarity === 5);
  const ends = [20,40,60,80,...(cap > 80 ? [90] : [])];
  const buckets = ends.map((end,i) => ({ start: i ? ends[i-1]+1 : 1, end, count: five.filter(w => w.pityIndex >= (i ? ends[i-1]+1 : 1) && w.pityIndex <= end).length }));
  const max = Math.max(1,...buckets.map(b => b.count));
  const icon = banner === 'weapon' ? UI_ASSETS.sidebar.weapons : banner === 'standard' ? UI_ASSETS.items.acquaintFate : UI_ASSETS.sidebar.characters.default;
  const color = { character:'#77d9a5', weapon:'#e7bc64', standard:'#78b5f4', chronicled:'#bba4ff' }[banner];
  return <div className="banner-detail-chart"><div className="banner-pity-ring" style={{ background: `conic-gradient(${color} ${Math.min(100,currentPity/cap*100)}%, #31324b 0)` }}><div><img src={icon} alt=""/><strong>{currentPity}<small> / {cap}</small></strong></div></div><div><small>Pity atual cadastrado</small><strong>{five.length} resultados 5★</strong><div className="banner-labeled-bars" aria-label="Distribuição de pity por intervalos">{buckets.map(b => <div key={b.end}><span style={{ height: `${Math.max(2,b.count/max*55)}px`, background: color }} title={`${b.start}–${b.end}: ${b.count}`} /><small>{b.start}–{b.end}</small></div>)}</div></div></div>;
}
