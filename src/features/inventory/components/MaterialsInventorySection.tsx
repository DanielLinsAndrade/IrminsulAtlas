import { useState } from 'react';
import { useShell } from '../../../app/providers';
import { normalizeSearch } from '../../../app/search/searchIndex';
import type { InventoryItemWithDetails } from '../../../domain/inventory';
import { INVENTORY_LIMITS } from '../../../domain/constants/limits';
import { AssetImage, Button, EmptyState, Input } from '../../../components';
import { MetricCard, ViewToggle } from '../../../components/PageLayout';

interface MaterialsInventorySectionProps {
  onOpenWeapons?: () => void;
  inventory: InventoryItemWithDetails[];
  onSetQuantity: (materialId: string, quantity: number) => Promise<void>;
  onAdjustQuantity: (materialId: string, delta: number) => Promise<void>;
  isSaving: boolean;
}
const labels: Record<string, string> = { currency: 'Moedas e EXP', character_ascension: 'Ascensão', talent: 'Talentos', weapon_ascension: 'Armas', local_specialty: 'Naturais', boss: 'Bosses', common: 'Inimigos', other: 'Outros' };
export function MaterialsInventorySection({ onOpenWeapons, inventory, onSetQuantity, onAdjustQuantity, isSaving }: MaterialsInventorySectionProps) {
  const { navigationTarget } = useShell();
  const [query, setQuery] = useState(navigationTarget?.route === 'inventory' ? navigationTarget.query : '');
  const [category, setCategory] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [order, setOrder] = useState('name');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const categories = [...new Set(inventory.map(item => item.category))];
  const items = inventory.filter(item => (category === 'all' || item.category === category) && (rarity === 'all' || String(item.rarity) === rarity) && normalizeSearch(item.namePtBr + ' ' + (item.region ?? '')).includes(normalizeSearch(query))).sort((a,b) => order === 'quantity' ? b.quantity - a.quantity : order === 'rarity' ? (b.rarity ?? 0) - (a.rarity ?? 0) : a.namePtBr.localeCompare(b.namePtBr));
  const adjust = async (id: string, delta: number) => { try { setError(''); await onAdjustQuantity(id, delta); } catch (reason) { setError(String(reason)); } };
  const save = async (id: string) => {
    const value = Number(draft);
    if (!Number.isSafeInteger(value) || value < 0 || value > INVENTORY_LIMITS.QUANTITY.MAX) { setError('Informe uma quantidade inteira válida.'); return; }
    try { setError(''); await onSetQuantity(id, value); setEditing(null); } catch (reason) { setError(String(reason)); }
  };
  return <div className="ui-split">
    <section className="ui-panel">
      <div className="ui-toolbar"><Input aria-label="Buscar materiais" placeholder="Buscar material ou região…" value={query} onChange={e => setQuery(e.target.value)}/>
        <select aria-label="Categoria de material" value={category} onChange={e => setCategory(e.target.value)}><option value="all">Todas as categorias</option>{categories.map(cat => <option key={cat} value={cat}>{labels[cat] ?? cat}</option>)}</select>
        <select aria-label="Raridade do material" value={rarity} onChange={e => setRarity(e.target.value)}><option value="all">Todas as raridades</option>{[1,2,3,4,5].map(r => <option key={r} value={r}>{r}★</option>)}</select>
        <select aria-label="Ordenar materiais" value={order} onChange={e => setOrder(e.target.value)}><option value="name">Nome</option><option value="quantity">Quantidade</option><option value="rarity">Raridade</option></select>
        <ViewToggle value={layout} onChange={setLayout}/>
      </div>
      {error && <p role="alert">{error}</p>}
      {!items.length && <EmptyState title="Nenhum material encontrado" description="Tente outros filtros."/>}
      <div className={`material-grid material-grid--${layout}`}>{items.map(item => <article className="material-tile" key={item.materialId}>
        <AssetImage entityType="material" entityId={item.materialId} alt={item.namePtBr} size={56}/>
        <strong>{item.namePtBr}</strong><span className="ui-gold">{item.rarity ? `${item.rarity}★` : ''}</span><small>{labels[item.category]}{item.region ? ` · ${item.region}` : ''}</small>
        {editing === item.materialId ? <form onSubmit={e => { e.preventDefault(); void save(item.materialId); }}><input aria-label={`Quantidade de ${item.namePtBr}`} inputMode="numeric" autoFocus value={draft} onChange={e => setDraft(e.target.value.replace(/\D/g, ''))} onKeyDown={e => { if (e.key === 'Escape') setEditing(null); }}/><Button size="sm" type="submit" disabled={isSaving}>Salvar</Button></form> : <button type="button" className="material-quantity" aria-label={`Editar quantidade de ${item.namePtBr}`} onClick={() => { setEditing(item.materialId); setDraft(String(item.quantity)); }}>{item.quantity.toLocaleString('pt-BR')}</button>}
        <div className="material-stepper">{[-10,-1,1,10].map(delta => <button type="button" key={delta} disabled={isSaving || (delta < 0 && item.quantity === 0)} aria-label={`${delta > 0 ? 'Adicionar' : 'Remover'} ${Math.abs(delta)} ${item.namePtBr}`} onClick={() => void adjust(item.materialId, delta)}>{delta > 0 ? '+' : ''}{delta}</button>)}</div>
      </article>)}</div>
    </section>
    <aside className="inventory-summary ui-panel"><h2>Resumo do Inventário</h2>{onOpenWeapons && <div><Button style={{ width: '100%', minHeight: 42, justifyContent: 'center' }} variant="secondary" onClick={onOpenWeapons}>Coleção de Armas</Button></div>}<MetricCard label="Materiais com estoque" value={inventory.filter(i => i.quantity > 0).length} hint={`De ${inventory.length} materiais do catálogo`}/><MetricCard label="Unidades registradas" value={inventory.reduce((sum,item) => sum + item.quantity, 0).toLocaleString('pt-BR')} tone="gold"/><h3>Por categoria</h3>{categories.map(cat => <div className="inventory-category" key={cat}><span>{labels[cat]}</span><strong>{inventory.filter(i => i.category === cat && i.quantity > 0).length}</strong></div>)}<small className="ui-muted">Quantidade de materiais distintos com estoque, sem somar novamente os recursos de desejos.</small></aside>
  </div>;
}
