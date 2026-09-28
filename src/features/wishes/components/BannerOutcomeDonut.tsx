import type { BannerType, WishEntry } from '../../../domain/wishes/types';
import { outcomeDistribution } from '../../../domain/wishes/outcomeDistribution';
import './BannerOutcomeSummary.css';

export function BannerOutcomeDonut({ banner, wishes }: { banner: BannerType; wishes: WishEntry[] }) {
  const { title, labels, values, colors, helper } = outcomeDistribution(banner, wishes);
  const total = values[0] + values[1];
  const rate = total ? values[0] / total * 100 : 0;
  return <section className="banner-outcome-donut" aria-label={title}>
    <h3>{title}</h3><div className="banner-outcome-donut__body">
      <div className="banner-outcome-donut__ring" role="img" aria-label={`${labels[0]}: ${values[0]}; ${labels[1]}: ${values[1]}`} style={{ background: total ? `conic-gradient(${colors[0]} ${rate}%,${colors[1]} 0)` : '#36344f' }}><span><strong>{total ? `${Math.round(rate)}%` : '—'}</strong><small>{total ? labels[0] : 'Sem dados'}</small></span></div>
      <dl>{labels.map((label,index) => <div key={label}><dt><i style={{background:colors[index]}}/>{label}</dt><dd>{values[index]}</dd></div>)}</dl>
    </div><p className="banner-helper">{helper}</p>
  </section>;
}
