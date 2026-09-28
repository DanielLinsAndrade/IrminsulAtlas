import type { WishEntry } from './types';

/** Resultados 4★/3★ já estão contidos nos ciclos dos 5★. Pity atual é manual. */
export function calculateRepresentedPulls(history: readonly Pick<WishEntry, 'rarity' | 'pityIndex'>[], currentPity: number): number {
  return history.reduce((total, wish) => total + (wish.rarity === 5 ? wish.pityIndex : 0), 0) + currentPity;
}
