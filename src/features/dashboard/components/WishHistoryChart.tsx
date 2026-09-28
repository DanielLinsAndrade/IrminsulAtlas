import type { CSSProperties } from 'react';
import type { WishEntry } from '../../../domain/wishes/types';
import { recentFiveStarWishes } from '../../../domain/wishes/recentHistory';
import './WishHistoryChart.css';

export function WishHistoryChart({ wishes, maxBars = 20 }: { wishes: WishEntry[]; maxBars?: number }) {
  const recent = recentFiveStarWishes(wishes, maxBars);
  if (!recent.length) return null;
  const cap = Math.max(90, ...recent.map(w => w.pityIndex));
  return <div className="home-wish-chart" role="figure" aria-label="Histórico de pity dos últimos 20 resultados 5 estrelas">
    <div className="home-wish-chart__plot" style={{ '--bars': recent.length } as CSSProperties}>
      {recent.map(wish => <div className="home-wish-chart__column" key={wish.id} data-banner={wish.bannerType}>
        <div className="home-wish-chart__bar" style={{ height: `${wish.pityIndex / cap * 100}%` }}>
          <span className="home-wish-chart__value">{wish.pityIndex}</span>
        </div>
        <span className="home-wish-chart__label" tabIndex={0} title={`${wish.itemName} · Pity ${wish.pityIndex}`} aria-label={`${wish.itemName} · Pity ${wish.pityIndex}`}>{wish.itemName}</span>
      </div>)}
    </div>
    <p className="home-wish-chart__caption">{recent.length} resultados 5★ mais recentes · nomes completos ao focar ou passar o cursor</p>
  </div>;
}
