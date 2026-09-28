import type { WishEntry } from './types';
export function wishResultLabel(wish: Pick<WishEntry, 'bannerType' | 'isFeatured' | 'wonPityRate' | 'rarity'>): string {
  if (wish.rarity !== 5) return '—';
  if (wish.bannerType === 'standard') return 'Padrão';
  if (wish.bannerType === 'weapon') return wish.isFeatured ? 'Promocional' : 'Não promocional';
  if (wish.bannerType === 'chronicled') return !wish.isFeatured ? 'Destino não escolhido' : wish.wonPityRate ? 'Destino escolhido' : 'Destino garantido';
  return !wish.isFeatured ? 'Perdeu 50/50' : wish.wonPityRate ? 'Venceu 50/50' : 'Garantido';
}
export function wishResultColor(wish: Pick<WishEntry, 'bannerType' | 'isFeatured' | 'wonPityRate'>): string {
  if (wish.bannerType === 'weapon') return '#e7bc64';
  if (wish.bannerType === 'standard') return '#78b5f4';
  if (wish.bannerType === 'chronicled') return '#bba4ff';
  return !wish.isFeatured ? '#ef8585' : wish.wonPityRate ? '#77d9a5' : '#75d9d1';
}
export function standardPrediction(wishes: WishEntry[]): 'character' | 'weapon' | null {
  const last = wishes.filter(w => w.bannerType === 'standard' && w.rarity === 5).sort((a,b) => b.sequenceNo - a.sequenceNo)[0];
  return last ? last.itemType === 'weapon' ? 'character' : 'weapon' : null;
}
