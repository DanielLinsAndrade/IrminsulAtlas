/** Emblema vetorial compartilhado pelos cards de métricas e títulos de modais. */
export function DecorativeStar({ className, size = 22 }: { className?: string; size?: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true"><path d="m20 3 5 11 12 6-12 5-5 12-5-12L3 20l12-6Z" fill="currentColor" opacity=".18"/><path d="m20 9 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" stroke="currentColor" fill="none"/></svg>;
}
