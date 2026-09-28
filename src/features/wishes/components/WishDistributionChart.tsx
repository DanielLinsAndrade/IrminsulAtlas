import React from 'react';
import type { WishEntry } from '../../../domain/wishes/types';

export const WishDistributionChart: React.FC<{ wishes: WishEntry[] }> = ({ wishes }) => {
  // Agrupamento visual dos índices registrados, sem recalcular pity ou garantias.
  const bins = Array.from({ length: 9 }, (_, index) => {
    const min = index * 10 + 1;
    const max = min + 9;
    const entries = wishes.filter(w => w.pityIndex >= min && w.pityIndex <= max);
    return { label: `${min}–${max}`, four: entries.filter(w => w.rarity === 4).length, five: entries.filter(w => w.rarity === 5).length };
  });
  const maxCount = Math.ceil(Math.max(3, ...bins.flatMap(bin => [bin.four, bin.five])) / 3) * 3;
  return <section className="wishes-distribution" aria-labelledby="distribution-title">
    <header><div><h2 id="distribution-title">Distribuição de Tiros</h2><p>Ocorrências de 4★ e 5★ por faixa de pity • acompanha os filtros, não a página.</p></div><div className="wish-chart-legend"><span className="wish-purple">4★</span><span className="wish-gold">5★</span></div></header>
    <div className="wish-chart-scroll"><svg viewBox="0 0 900 190" role="img" aria-label="Distribuição dos tiros por faixa de pity">
      {[0, 1, 2, 3].map(tick => { const y = 150 - tick * 44; return <g key={tick}><line x1="35" x2="890" y1={y} y2={y} stroke="currentColor" opacity=".15" /><text x="27" y={y + 4} textAnchor="end">{Number((maxCount * tick / 3).toFixed(1))}</text></g>; })}
      {bins.map((bin, i) => <g key={bin.label}>
        <rect x={52 + i * 94} y={150 - bin.four / maxCount * 132} width="24" height={bin.four / maxCount * 132} rx="3" fill="#a38af0"><title>{bin.label}: {bin.four} registros 4★</title></rect>
        <rect x={80 + i * 94} y={150 - bin.five / maxCount * 132} width="24" height={bin.five / maxCount * 132} rx="3" fill="#e5b967"><title>{bin.label}: {bin.five} registros 5★</title></rect>
        <text x={78 + i * 94} y="177" textAnchor="middle">{bin.label}</text>
      </g>)}
    </svg></div>
    {!wishes.some(w => w.rarity === 4 || w.rarity === 5) && <p className="wishes-chart-empty">Nenhum tiro de 4★ ou 5★ nos filtros atuais.</p>}
  </section>;
};
