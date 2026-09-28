import type { WeaponFilterOptions } from '../../../domain/weapons/types';
import { Button, Input } from '../../../components';

export function WeaponFilters({ filters, onChange, onReset }: { filters: WeaponFilterOptions; onChange: (filters: WeaponFilterOptions) => void; onReset: () => void }) {
  return <div className="ui-toolbar">
    <Input aria-label="Buscar arma" placeholder="Buscar arma…" value={filters.search ?? ''} onChange={e => onChange({ ...filters, search: e.target.value })}/>
    <select aria-label="Tipo de arma" value={filters.weaponType ?? 'all'} onChange={e => onChange({ ...filters, weaponType: e.target.value as WeaponFilterOptions['weaponType'] })}><option value="all">Todos os tipos</option>{[['sword','Espada'],['claymore','Espadão'],['polearm','Lança'],['bow','Arco'],['catalyst','Catalisador']].map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>
    <select aria-label="Raridade" value={filters.rarity ?? 'all'} onChange={e => onChange({ ...filters, rarity: e.target.value === 'all' ? 'all' : Number(e.target.value) as 1|2|3|4|5 })}><option value="all">Todas as raridades</option>{[5,4,3,2,1].map(r => <option key={r} value={r}>{r}★</option>)}</select>
    <select aria-label="Refinamento" value={filters.refinement ?? 'all'} onChange={e => onChange({ ...filters, refinement: e.target.value === 'all' ? 'all' : Number(e.target.value) as 1|2|3|4|5 })}><option value="all">Todos os refinamentos</option>{[1,2,3,4,5].map(r => <option key={r} value={r}>R{r}</option>)}</select>
    <select aria-label="Equipamento" value={filters.equipped ?? 'all'} onChange={e => onChange({ ...filters, equipped: e.target.value as WeaponFilterOptions['equipped'] })}><option value="all">Todas</option><option value="equipped">Equipadas</option><option value="unequipped">Desocupadas</option></select>
    <label><input type="checkbox" checked={filters.favoriteOnly ?? false} onChange={e => onChange({ ...filters, favoriteOnly: e.target.checked })}/> Favoritos</label><Button size="sm" variant="ghost" onClick={onReset}>Limpar filtros</Button>
  </div>;
}
