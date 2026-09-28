import type { ReactNode } from 'react';
import { DecorativeStar } from './DecorativeStar';
import './PageLayout.css';

export function PageHero({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return <header className="page-hero">
    <svg className="page-hero-skyline" viewBox="0 0 500 150" aria-hidden="true"><path fill="currentColor" d="M0 150V135H60V100H80V65L90 45L100 65V100H120V130H170V85H190V45L205 18L220 45V85H235V125H270V60H285V25L295 0L305 25V60H320V120H370V80H390V50L400 30L410 50V80H430V130H500V150Z"/></svg>
    <div><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}

export function MetricCard({ label, value, hint, tone = 'violet' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'violet' | 'gold' | 'green' | 'cyan' | 'red' }) {
  return <article className={`metric-card metric-card--${tone}`}><DecorativeStar className="metric-emblem" size={40}/><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</article>;
}

export function ViewToggle({ value, onChange }: { value: 'grid' | 'list'; onChange: (value: 'grid' | 'list') => void }) {
  return <div className="view-toggle" role="group" aria-label="Visualização">{(['grid', 'list'] as const).map(mode => <button key={mode} type="button" aria-pressed={value === mode} onClick={() => onChange(mode)}>{mode === 'grid' ? 'Grade' : 'Lista'}</button>)}</div>;
}

export function ProgressMeter({ value, label }: { value: number; label: string }) {
  return <progress className="ui-progress" max={100} value={Math.min(100, Math.max(0, value))} aria-label={label}/>;
}
