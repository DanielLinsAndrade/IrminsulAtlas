import type { WishEntry, BannerType } from '../../../domain/wishes/types';
import { useState } from 'react';
import { matchesVersion } from '../../../domain/shared/versionFilter';
import { VersionFilter } from '../../../components/VersionFilter';
const names: Record<BannerType, string> = { character: 'Personagem', weapon: 'Arma', standard: 'Padrão', chronicled: 'Crônico' };
const colors = ['#77d9a5', '#f4cd82', '#78b5f4', '#bba4ff'];
export function WishVersionChart({ wishes, bannerContext = 'all' }: { wishes: WishEntry[]; bannerContext?: BannerType | 'all' }) {
  return <ContextualWishVersionChart key={bannerContext} wishes={wishes} bannerContext={bannerContext} />;
}

function ContextualWishVersionChart({ wishes, bannerContext }: { wishes: WishEntry[]; bannerContext: BannerType | 'all' }) {
  const available = (Object.keys(names) as BannerType[]).filter(banner => bannerContext === 'all' || banner === bannerContext);
  const [versionFilter, setVersionFilter] = useState('all');
  const [enabled, setEnabled] = useState<BannerType[]>(available);
  const records = wishes.filter(w => w.rarity === 5 && w.gameVersionId && matchesVersion(w.gameVersionId, versionFilter) && enabled.includes(w.bannerType));
  const versions = [...new Set(records.map(w => w.gameVersionId!))].sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
  const width = Math.max(680, versions.length * 85);
  const x = (index: number) => 50 + index * (width - 100) / Math.max(1, versions.length - 1);
  return <section className="ui-panel" style={{ gridColumn: '1 / -1', minWidth: 0 }}><h2>Pity por versão</h2><p className="ui-muted">Média do pity dos resultados 5★ em cada versão, por banner. Registros sem versão não entram no gráfico; não representa o pity atual.</p>
    {!records.length ? <p className="ui-empty">Registre resultados 5★ com versão para visualizar a progressão.</p> : <div style={{ overflowX: 'auto' }}><svg viewBox={`0 0 ${width} 270`} style={{ width: '100%', minWidth: width, height: 270 }} role="img" aria-label="Média de pity 5 estrelas por versão e banner">
      {[0,30,60,90].map(n => <g key={n}><line x1="45" x2={width-25} y1={220-n*2} y2={220-n*2} stroke="currentColor" opacity=".12"/><text x="10" y={224-n*2} fill="currentColor" fontSize="12">{n}</text></g>)}
      {versions.map((version,index) => <text key={version} x={x(index)} y="246" textAnchor="middle" fill="currentColor" fontSize="12">{version}</text>)}
      {(Object.keys(names) as BannerType[]).filter(banner => enabled.includes(banner)).map((banner) => {
        const colorIndex = Object.keys(names).indexOf(banner);
        const points = versions.flatMap((version,index) => { const items = records.filter(w => w.bannerType === banner && w.gameVersionId === version); return items.length ? [{ x: x(index), mean: items.reduce((sum,w) => sum+w.pityIndex,0)/items.length, version, count: items.length }] : []; });
        return <g key={banner} fill={colors[colorIndex]}><polyline fill="none" stroke={colors[colorIndex]} strokeWidth="2" points={points.map(p => `${p.x},${220-p.mean*2}`).join(' ')}/>{points.map(p => <circle key={p.version} cx={p.x} cy={220-p.mean*2} r="5"><title>{names[banner]} · {p.version}: {p.mean.toFixed(1)} pity · {p.count} resultados</title></circle>)}</g>;
      })}
    </svg></div>}
    <div className="ui-toolbar pity-version-filters">
      <VersionFilter placement="top" label="Versão do gráfico de pity" value={versionFilter} onChange={setVersionFilter} />
      <button className="pity-version-reset" type="button" onClick={() => setEnabled(available)}>Todos os banners</button>
      {(Object.keys(names) as BannerType[]).map((key, index) => <div className="pity-version-series" key={key} style={{ color: colors[index] }}>
        <label><input type="checkbox" disabled={!available.includes(key)} checked={enabled.includes(key)} onChange={() => setEnabled(old => old.includes(key) ? old.filter(b => b !== key) : [...old, key])} />{names[key]}</label>
        <button type="button" disabled={!available.includes(key)} aria-label={'Isolar ' + names[key]} onClick={() => setEnabled([key])}>Somente</button>
      </div>)}
    </div>
  </section>;
}
