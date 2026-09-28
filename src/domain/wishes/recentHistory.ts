import type { WishEntry } from './types';

export function recentFiveStarWishes(wishes: WishEntry[], limit = 20) {
  return wishes.filter(w => w.rarity === 5).sort((a, b) =>
    b.sequenceNo - a.sequenceNo || b.occurredAt.localeCompare(a.occurredAt)
  ).slice(0, Math.max(0, Math.min(20, limit))).reverse();
}
