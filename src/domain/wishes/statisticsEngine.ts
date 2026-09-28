import type {
  BannerPullCard5Star,
  BannerStatistics,
  BannerType,
  WishEntry,
  WishSummaryStatistics,
} from './types';
import { calculatePityProgression, sortWishesChronologically } from './pityEngine';
import { calculateRepresentedPulls } from './representedPulls';

/**
 * Calcula as estatísticas completas de um banner específico.
 */
export function calculateBannerStatistics(
  wishes: WishEntry[],
  bannerType: BannerType,
  manualCurrentPity = 0,
): BannerStatistics {
  const bannerWishes = sortWishesChronologically(
    wishes.filter((w) => w.bannerType === bannerType)
  );

  const currentPity = calculatePityProgression(bannerWishes, bannerType);

  let total5Star = 0;
  let total4Star = 0;
  let total3Star = 0;
  let sum5StarPity = 0;
  let sum4StarPity = 0;
  let win50_50Count = 0;
  let lost50_50Count = 0;
  let guaranteed5StarCount = 0;

  const fiveStars: WishEntry[] = [];
  const limitedCosts: number[] = [];
  const lossCycleCosts: number[] = [];
  let pendingLossPity = 0;

  for (const wish of bannerWishes) {
    if (wish.rarity === 5) {
      total5Star++;
      sum5StarPity += wish.pityIndex;
      fiveStars.push(wish);

      if (bannerType === 'character' || bannerType === 'chronicled') {
        if (wish.isFeatured) {
          if (wish.wonPityRate) {
            // Venceu 50/50 (sem estar previamente garantido)
            win50_50Count++;
            limitedCosts.push(pendingLossPity + wish.pityIndex);
            pendingLossPity = 0;
          } else {
            // Garantido: não entra no denominador do 50/50
            guaranteed5StarCount++;
            const cost = pendingLossPity > 0 ? pendingLossPity + wish.pityIndex : wish.pityIndex;
            limitedCosts.push(cost);
            if (pendingLossPity > 0) {
              lossCycleCosts.push(pendingLossPity + wish.pityIndex);
            }
            pendingLossPity = 0;
          }
        } else {
          // Perdeu 50/50
          lost50_50Count++;
          pendingLossPity += wish.pityIndex;
        }
      }
    } else if (wish.rarity === 4) {
      total4Star++;
      sum4StarPity += wish.pityIndex;
    } else {
      total3Star++;
    }
  }

  const avg5StarPity = total5Star > 0 ? Math.round((sum5StarPity / total5Star) * 10) / 10 : 0;
  const avg4StarPity = total4Star > 0 ? Math.round((sum4StarPity / total4Star) * 10) / 10 : 0;

  const total50_50Decisions = win50_50Count + lost50_50Count;
  const win50_50Rate =
    total50_50Decisions > 0
      ? Math.round((win50_50Count / total50_50Decisions) * 1000) / 10
      : 0;

  const avgCostPerLimited =
    limitedCosts.length > 0
      ? Math.round((limitedCosts.reduce((a, b) => a + b, 0) / limitedCosts.length) * 10) / 10
      : 0;

  const avgCostWhenLost50_50 =
    lossCycleCosts.length > 0
      ? Math.round((lossCycleCosts.reduce((a, b) => a + b, 0) / lossCycleCosts.length) * 10) / 10
      : 0;

  const totalPullsRepresented = calculateRepresentedPulls(bannerWishes, manualCurrentPity);

  // Linha do tempo dos 5 estrelas mais recentes (mais recente primeiro)
  const recent5Stars: BannerPullCard5Star[] = [...fiveStars]
    .reverse()
    .map((w) => ({
      id: w.id,
      itemId: w.itemId,
      itemName: w.itemName,
      occurredAt: w.occurredAt,
      pityIndex: w.pityIndex,
      wonPityRate: w.wonPityRate,
      isFeatured: w.isFeatured,
    }));

  return {
    bannerType,
    totalPulls: bannerWishes.length,
    total5Star,
    total4Star,
    total3Star,
    avg5StarPity,
    avg4StarPity,
    win50_50Count,
    lost50_50Count,
    guaranteed5StarCount,
    win50_50Rate,
    avgCostPerLimited,
    avgCostWhenLost50_50,
    totalPullsRepresented,
    recent5Stars,
    currentPity,
  };
}

/**
 * Consolida estatísticas de todos os banners para exibição global.
 */
export function calculateWishSummary(wishes: WishEntry[], currentPity: Partial<Record<BannerType, number>> = {}): WishSummaryStatistics {
  const bannerTypes: BannerType[] = ['character', 'weapon', 'standard', 'chronicled'];

  const bannerStats = {} as Record<BannerType, BannerStatistics>;
  let totalPulls = 0;
  let total5Star = 0;
  let total4Star = 0;
  let total3Star = 0;
  let sumAll5StarPity = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalPullsRepresented = 0;

  const allLimitedCosts: number[] = [];
  const allLossCycleCosts: number[] = [];

  for (const bType of bannerTypes) {
    const stats = calculateBannerStatistics(wishes, bType, currentPity[bType] ?? 0);
    bannerStats[bType] = stats;

    totalPulls += stats.totalPulls;
    total5Star += stats.total5Star;
    total4Star += stats.total4Star;
    total3Star += stats.total3Star;
    totalPullsRepresented += stats.totalPullsRepresented;

    sumAll5StarPity += stats.total5Star * stats.avg5StarPity;
    if (bType === 'character') {
      totalWins += stats.win50_50Count;
      totalLosses += stats.lost50_50Count;
    }

    if (stats.avgCostPerLimited > 0) {
      allLimitedCosts.push(stats.avgCostPerLimited);
    }
    if (stats.avgCostWhenLost50_50 > 0) {
      allLossCycleCosts.push(stats.avgCostWhenLost50_50);
    }
  }

  const avg5StarPity = total5Star > 0 ? Math.round((sumAll5StarPity / total5Star) * 10) / 10 : 0;
  const totalDecisions = totalWins + totalLosses;
  const global50_50Rate =
    totalDecisions > 0 ? Math.round((totalWins / totalDecisions) * 1000) / 10 : 0;

  const charStats = bannerStats.character;
  const avgCostPerLimited = charStats ? charStats.avgCostPerLimited : 0;
  const avgCostWhenLost50_50 = charStats ? charStats.avgCostWhenLost50_50 : 0;

  return {
    totalPulls,
    totalPrimogemEquivalent: totalPullsRepresented * 160,
    total5Star,
    total4Star,
    total3Star,
    global50_50Rate,
    avg5StarPity,
    avgCostPerLimited,
    avgCostWhenLost50_50,
    totalPullsRepresented,
    bannerStats,
  };
}
