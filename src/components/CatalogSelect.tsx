import { useEffect, useId, useRef, useState } from 'react';
import { AssetImage } from './AssetImage';
import { normalizeSearch } from '../app/search/searchIndex';
import './CatalogSelect.css';

export interface CatalogOption { value: string; label: string; entityId: string; detail?: string }
export function CatalogSelect({ value, onChange, options, label, entityType, emptyLabel }: {
  value: string; onChange: (value: string) => void; options: CatalogOption[]; label: string; entityType: 'character' | 'weapon' | 'artifact'; emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [above, setAbove] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = options.find(option => option.value === value);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    if (open) document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const choose = (next: string) => { onChange(next); setOpen(false); setSearch(''); trigger.current?.focus(); };
  const filtered = options.filter(option => normalizeSearch(option.label + ' ' + (option.detail ?? '')).includes(normalizeSearch(search)));
  return <div className="catalog-select" ref={root} onKeyDown={event => {
    if (open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('.catalog-select-options button') ?? []);
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = current < 0 ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1) : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
    if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <span id={`${id}-label`}>{label}</span>
    <button ref={trigger} type="button" aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-menu`} onClick={() => { const rect = trigger.current?.getBoundingClientRect(); setAbove(Boolean(rect && rect.bottom > window.innerHeight - 350 && rect.top > 330)); setOpen(!open); }}>
      {selected && <AssetImage entityType={entityType} entityId={selected.entityId} alt="" size={32}/>}<span id={`${id}-value`}>{selected?.label ?? (value ? 'Equipamento anterior indisponível — selecione uma opção válida' : emptyLabel)}</span><svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5" fill="none" stroke="currentColor"/></svg>
    </button>
    {open && <div id={`${id}-menu`} className={`catalog-select-menu${above ? ' catalog-select-menu--above' : ''}`}><input autoFocus type="search" aria-label={`Buscar ${label.toLowerCase()}`} placeholder="Buscar pelo nome…" value={search} onChange={event => setSearch(event.target.value)}/><div className="catalog-select-options" role="group" aria-label={`Opções de ${label.toLowerCase()}`}>
      <button type="button" onClick={() => choose('')} aria-pressed={!value}>{emptyLabel}</button>
      {filtered.map(option => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => choose(option.value)}><AssetImage entityType={entityType} entityId={option.entityId} alt="" size={34}/><span>{option.label}{option.detail && <small>{option.detail}</small>}</span></button>)}
      {!filtered.length && <p>Nenhum resultado.</p>}
    </div></div>}
  </div>;
}
