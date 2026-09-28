import { useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import { MAJOR_VERSION_FILTERS } from '../domain/shared/versionFilter';
import { CATALOG_VERSIONS } from '../domain/catalog/versions';
import './VersionFilter.css';

export function VersionFilter({ value, onChange, label = 'Versão das conquistas', placement = 'bottom', fieldLabel }: { value: string; onChange: (value: string) => void; label?: string; placement?: 'top' | 'bottom'; fieldLabel?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ left: 16, top: 80, maxHeight: 400 });
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const dialog = trigger.current?.closest('.modal-dialog')?.getBoundingClientRect();
      const rightEdge = Math.min(window.innerWidth - 16, dialog ? dialog.right - 16 : window.innerWidth - 16);
      const above = rect.top - 48;
      const below = window.innerHeight - rect.bottom - 24;
      const up = placement === 'top' ? above >= 240 || above > below : below < 280 && above > below;
      const height = Math.min(430, Math.max(160, up ? above : below));
      setBounds({ left: Math.max(16, Math.min(rect.left, rightEdge - 360)), top: up ? Math.max(40, rect.top - height - 8) : rect.bottom + 8, maxHeight: height });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, placement]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const select = (version: string) => { onChange(version); setOpen(false); trigger.current?.focus(); };
  return <div ref={ref} className={`version-filter${fieldLabel ? ' version-filter--field' : ''}`} onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
    {fieldLabel && <span className="version-filter__label">{fieldLabel}</span>}
    <button ref={trigger} type="button" aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{!fieldLabel && 'Versão '}<strong>{value === 'all' ? 'Todas' : value}</strong><svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>
    {open && <div id={id} ref={panel} style={{ position: 'fixed', left: bounds.left, top: bounds.top, bottom: 'auto', maxHeight: bounds.maxHeight }} className="version-filter__panel" onKeyDown={event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const buttons = [...(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
        event.preventDefault(); buttons[next]?.focus();
      }} role="group" aria-label="Selecionar versão">
      <div className="version-filter__grid">{MAJOR_VERSION_FILTERS.map(major => <div key={major}>
        <button type="button" className="version-filter__major" aria-pressed={value === major} onClick={() => select(major)}>{major}</button>
        {CATALOG_VERSIONS.filter(v => v.split('.')[0] === major.split('.')[0]).map(version => <button type="button" key={version} aria-pressed={value === version} onClick={() => select(version)}>{version}</button>)}
      </div>)}</div>
      <button type="button" className="version-filter__reset" disabled={value === 'all'} onClick={() => select('all')}>Resetar</button>
    </div>}
  </div>;
}
