export type BannerType = 'character' | 'weapon' | 'standard' | 'chronicled';

export type WishItemType = 'character' | 'weapon';

export interface WishEntry {
  weaponPathResult?: import('./weaponFate').WeaponPathResult | null;
  weaponFateState?: import('./weaponFate').WeaponFateState | null;
  id: string;
  profileId: string;
  occurredAt: string;
  gameVersionId: string | null;
  bannerType: BannerType;
  bannerName: string | null;
  itemType: WishItemType;
  itemId: string;
  itemName: string;
  rarity: number;
  pityIndex: number;
  sequenceNo: number;
  isFeatured: boolean;
  wonPityRate: boolean;
  ruleSetId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FiftyFiftyStatus = 'won' | 'lost' | 'guaranteed';

export interface CreateWishInput {
  weaponPathResult?: import('./weaponFate').WeaponPathResult | null;
  weaponFateState?: import('./weaponFate').WeaponFateState | null;
  occurredAt?: string;
  gameVersionId?: string | null;
  bannerType: BannerType;
  bannerName?: string | null;
  itemType: WishItemType;
  itemId: string;
  itemName: string;
  rarity: number;
  pityIndex?: number;
  sequenceNo?: number;
  isFeatured?: boolean;
  wonPityRate?: boolean;
  ruleSetId?: string | null;
  notes?: string | null;
}

export interface UpdateWishInput {
  weaponPathResult?: import('./weaponFate').WeaponPathResult | null;
  weaponFateState?: import('./weaponFate').WeaponFateState | null;
  occurredAt?: string;
  gameVersionId?: string | null;
  bannerType?: BannerType;
  bannerName?: string | null;
  itemType?: WishItemType;
  itemId?: string;
  itemName?: string;
  rarity?: number;
  pityIndex?: number;
  isFeatured?: boolean;
  wonPityRate?: boolean;
  ruleSetId?: string | null;
  notes?: string | null;
}

export interface WishRuleSet {
  id: string;
  gameKey: string;
  name: string;
  bannerType: BannerType;
  hardPity5Star: number;
  softPity5Star: number;
  hardPity4Star: number;
  softPity4Star: number;
  baseRate5Star: number;
  baseRate4Star: number;
  featuredGuaranteeSystem: '50_50' | 'epitomized_path' | 'chronicled_fate' | 'none';
}

export interface PityState {
  bannerType: BannerType;
  current5StarPity: number;
  current4StarPity: number;
  is5StarGuaranteed: boolean;
  is4StarGuaranteed: boolean;
  totalPulls: number;
  last5Star: WishEntry | null;
  last4Star: WishEntry | null;
}

export interface BannerPullCard5Star {
  id: string;
  itemId: string;
  itemName: string;
  occurredAt: string;
  pityIndex: number;
  wonPityRate: boolean;
  isFeatured: boolean;
}

export interface BannerStatistics {
  bannerType: BannerType;
  totalPulls: number;
  total5Star: number;
  total4Star: number;
  total3Star: number;
  avg5StarPity: number;
  avg4StarPity: number;
  win50_50Count: number;
  lost50_50Count: number;
  guaranteed5StarCount: number;
  win50_50Rate: number; // 0 to 100
  avgCostPerLimited: number;
  avgCostWhenLost50_50: number;
  totalPullsRepresented: number;
  recent5Stars: BannerPullCard5Star[];
  currentPity: PityState;
}

export interface WishSummaryStatistics {
  totalPulls: number;
  totalPrimogemEquivalent: number;
  total5Star: number;
  total4Star: number;
  total3Star: number;
  global50_50Rate: number;
  avg5StarPity: number;
  avgCostPerLimited: number;
  avgCostWhenLost50_50: number;
  totalPullsRepresented: number;
  bannerStats: Record<BannerType, BannerStatistics>;
}

export const BANNER_LABELS: Record<BannerType, string> = {
  character: 'Oração de Evento de Personagem',
  weapon: 'Oração de Evento de Arma',
  standard: 'Invocação do Mochileiro (Comum)',
  chronicled: 'Oração de Registro',
};

export const DEFAULT_RULE_SETS: Record<BannerType, WishRuleSet> = {
  character: {
    id: 'rule_character',
    gameKey: 'character_event',
    name: 'Oração de Evento de Personagem',
    bannerType: 'character',
    hardPity5Star: 90,
    softPity5Star: 74,
    hardPity4Star: 10,
    softPity4Star: 8,
    baseRate5Star: 0.006,
    baseRate4Star: 0.051,
    featuredGuaranteeSystem: '50_50',
  },
  weapon: {
    id: 'rule_weapon',
    gameKey: 'weapon_event',
    name: 'Oração de Evento de Arma',
    bannerType: 'weapon',
    hardPity5Star: 80,
    softPity5Star: 63,
    hardPity4Star: 10,
    softPity4Star: 7,
    baseRate5Star: 0.007,
    baseRate4Star: 0.060,
    featuredGuaranteeSystem: 'epitomized_path',
  },
  standard: {
    id: 'rule_standard',
    gameKey: 'standard_wish',
    name: 'Oração Comum (Invocação do Mochileiro)',
    bannerType: 'standard',
    hardPity5Star: 90,
    softPity5Star: 74,
    hardPity4Star: 10,
    softPity4Star: 8,
    baseRate5Star: 0.006,
    baseRate4Star: 0.051,
    featuredGuaranteeSystem: 'none',
  },
  chronicled: {
    id: 'rule_chronicled',
    gameKey: 'chronicled_wish',
    name: 'Oração de Registro',
    bannerType: 'chronicled',
    hardPity5Star: 90,
    softPity5Star: 74,
    hardPity4Star: 10,
    softPity4Star: 8,
    baseRate5Star: 0.006,
    baseRate4Star: 0.051,
    featuredGuaranteeSystem: 'chronicled_fate',
  },
};

export interface BannerCurrentPity {
  id: string;
  profileId: string;
  bannerType: BannerType;
  current5StarPity: number;
  current4StarPity: number;
  updatedAt: string;
}

export interface SetBannerCurrentPityInput {
  current5StarPity: number;
  current4StarPity: number;
}

export interface BannerPityLimits {
  max5StarPity: number;
  softPity5Star: number;
  hardPity5Star: number;
  max4StarPity: number;
  hardPity4Star: number;
}

export function getBannerPityLimits(bannerType: BannerType): BannerPityLimits {
  const rule = DEFAULT_RULE_SETS[bannerType];
  return {
    max5StarPity: rule.hardPity5Star - 1,
    softPity5Star: rule.softPity5Star,
    hardPity5Star: rule.hardPity5Star,
    max4StarPity: rule.hardPity4Star - 1,
    hardPity4Star: rule.hardPity4Star,
  };
}

export function clampBannerPity(
  bannerType: BannerType,
  fiveStar: number,
  fourStar: number,
): { current5StarPity: number; current4StarPity: number } {
  const limits = getBannerPityLimits(bannerType);
  const clamped5 = Math.max(0, Math.min(limits.max5StarPity, Math.floor(Number(fiveStar) || 0)));
  const clamped4 = Math.max(0, Math.min(limits.max4StarPity, Math.floor(Number(fourStar) || 0)));
  return {
    current5StarPity: clamped5,
    current4StarPity: clamped4,
  };
}
