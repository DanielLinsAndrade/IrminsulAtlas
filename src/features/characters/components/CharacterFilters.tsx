import type { CharacterFilterOptions } from '../../../domain/characters/types';
import { Button, Input } from '../../../components';

interface CharacterFiltersProps {
  filters: CharacterFilterOptions;
  onChange: (filters: CharacterFilterOptions) => void;
  onReset: () => void;
  availableRegions?: string[];
}
export function CharacterFilters({ filters, onChange, onReset, availableRegions = ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru', 'Fontaine', 'Natlan', 'Snezhnaya'] }: CharacterFiltersProps) {
  return <div className="ui-toolbar character-filters">
    <Input aria-label="Buscar personagem" placeholder="Buscar personagem…" value={filters.search ?? ''} onChange={e => onChange({ ...filters, search: e.target.value })}/>
    <select aria-label="Elemento" value={filters.element ?? 'all'} onChange={e => onChange({ ...filters, element: e.target.value as CharacterFilterOptions['element'] })}><option value="all">Todos os elementos</option>{['pyro', 'hydro', 'anemo', 'electro', 'dendro', 'cryo', 'geo'].map(el => <option key={el} value={el}>{el[0].toUpperCase() + el.slice(1)}</option>)}</select>
    <select aria-label="Tipo de arma" value={filters.weaponType ?? 'all'} onChange={e => onChange({ ...filters, weaponType: e.target.value as CharacterFilterOptions['weaponType'] })}><option value="all">Todas as armas</option>{[['sword','Espada'],['claymore','Espadão'],['polearm','Lança'],['bow','Arco'],['catalyst','Catalisador']].map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>
    <select aria-label="Raridade" value={filters.rarity ?? 'all'} onChange={e => onChange({ ...filters, rarity: e.target.value === 'all' ? 'all' : Number(e.target.value) as 4 | 5 })}><option value="all">Todas as raridades</option><option value="5">5★</option><option value="4">4★</option></select>
    <select aria-label="Ordenação" value={filters.sortBy ?? 'rarity'} onChange={e => onChange({ ...filters, sortBy: e.target.value as CharacterFilterOptions['sortBy'] })}><option value="rarity">Raridade</option><option value="name">Nome</option><option value="level">Nível</option><option value="acquisition">Ordem de aquisição</option></select>
    <details><summary>Mais filtros</summary><div className="ui-toolbar">
      <select aria-label="Região" value={filters.region ?? 'all'} onChange={e => onChange({ ...filters, region: e.target.value })}><option value="all">Todas as regiões</option>{availableRegions.map(region => <option key={region}>{region}</option>)}</select>
      <select aria-label="Constelação" value={filters.constellation ?? 'all'} onChange={e => onChange({ ...filters, constellation: e.target.value === 'all' ? 'all' : Number(e.target.value) as 0|1|2|3|4|5|6 })}><option value="all">Todas as constelações</option>{[0,1,2,3,4,5,6].map(c => <option key={c} value={c}>C{c}</option>)}</select>
      <select aria-label="Versão de lançamento" value={filters.releaseVersion ?? 'all'} onChange={e => onChange({ ...filters, releaseVersion: e.target.value })}><option value="all">Todas as versões</option>{['1.x','2.x','3.x','4.x','5.x','6.x','7.x'].map(v => <option key={v}>{v}</option>)}</select>
    </div></details>
    <Button variant="ghost" size="sm" onClick={onReset}>Limpar filtros</Button>
  </div>;
}
