import type {
  BannerType,
  PityState,
  WishEntry,
  WishRuleSet,
} from './types';
import { DEFAULT_RULE_SETS } from './types';

/**
 * Ordena os desejos cronologicamente (mais antigo primeiro).
 * Utiliza sequenceNo estável quando disponível, com fallback para occurredAt e id.
 */
export function sortWishesChronologically(wishes: WishEntry[]): WishEntry[] {
  return [...wishes].sort((a, b) => {
    const aSeq = a.sequenceNo ?? 0;
    const bSeq = b.sequenceNo ?? 0;
    if (aSeq > 0 && bSeq > 0 && aSeq !== bSeq) {
      return aSeq - bSeq;
    }
    const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Calcula o estado atual de pity de um banner a partir do histórico cronológico de desejos.
 * Regras puras de domínio sem acoplamento com UI.
 */
export function calculatePityProgression(
  wishes: WishEntry[],
  bannerType: BannerType,
  ruleSet: WishRuleSet = DEFAULT_RULE_SETS[bannerType]
): PityState {
  const bannerWishes = sortWishesChronologically(
    wishes.filter((w) => w.bannerType === bannerType)
  );

  let current5StarPity = 0;
  let current4StarPity = 0;
  let is5StarGuaranteed = false;
  let is4StarGuaranteed = false;
  let last5Star: WishEntry | null = null;
  let last4Star: WishEntry | null = null;

  for (const wish of bannerWishes) {
    if (wish.rarity === 5) {
      last5Star = wish;
      current5StarPity = 0;
      current4StarPity++;

      if (ruleSet.featuredGuaranteeSystem === '50_50') {
        if (wish.isFeatured) {
          is5StarGuaranteed = false;
        } else {
          // Perdeu o 50/50 -> próximo 5★ garantido
          is5StarGuaranteed = true;
        }
      } else if (ruleSet.featuredGuaranteeSystem === 'epitomized_path') {
        if (wish.isFeatured) {
          is5StarGuaranteed = false;
        } else {
          is5StarGuaranteed = true;
        }
      }
    } else if (wish.rarity === 4) {
      last4Star = wish;
      current4StarPity = 0;
      current5StarPity++;
      if (wish.isFeatured) {
        is4StarGuaranteed = false;
      } else {
        is4StarGuaranteed = true;
      }
    } else {
      current5StarPity++;
      current4StarPity++;
    }
  }

  return {
    bannerType,
    current5StarPity,
    current4StarPity,
    is5StarGuaranteed,
    is4StarGuaranteed,
    totalPulls: bannerWishes.length,
    last5Star,
    last4Star,
  };
}

/**
 * Recalcula o estado derivado (como garantias e wonPityRate) sem jamais sobrescrever os valores informados pelo usuário.
 * Conforme SPEC e Regra 1.1: O pity de obtenção de um registro gravado é imutável.
 */
export function recalculatePityIndices(
  wishes: WishEntry[],
  bannerType: BannerType
): WishEntry[] {
  const sorted = sortWishesChronologically(
    wishes.filter((w) => w.bannerType === bannerType)
  );

  let running5StarPity = 0;
  let wasGuaranteed = false;

  return sorted.map((wish) => {
    running5StarPity++;
    let pityIndex = running5StarPity;
    if (wish.rarity === 5) {
      // Se o usuário informou um pityIndex explícito (ex.: 76, 80) e não há tiros suficientes no log para atingir o valor,
      // o valor digitado pelo usuário tem precedência absoluta.
      if (wish.pityIndex && wish.pityIndex > running5StarPity) {
        pityIndex = wish.pityIndex;
      }
      running5StarPity = 0;
    }

    let wonPityRate = wish.wonPityRate;
    if (wish.rarity === 5) {
      if (bannerType === 'character' || bannerType === 'weapon') {
        if (wish.isFeatured) {
          // Ganhou o 50/50 caso não estivesse previamente garantido
          wonPityRate = !wasGuaranteed;
          wasGuaranteed = false;
        } else {
          wonPityRate = false;
          wasGuaranteed = true;
        }
      }
    }

    return {
      ...wish,
      pityIndex,
      wonPityRate,
    };
  });
}
