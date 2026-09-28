/**
 * Limites e intervalos normativos de domínio do Irminsul Atlas.
 * Centraliza as regras de negócio para garantir que todas as telas,
 * componentes de formulário e validações usem as mesmas fontes da verdade.
 */

export const PROFILE_LIMITS = {
  ADVENTURE_RANK: { MIN: 1, MAX: 60 },
  WORLD_LEVEL: { MIN: 0, MAX: 9 },
  UID_REGEX: /^\d{8,10}$/,
} as const;

export const CHARACTER_LIMITS = {
  LEVEL: { MIN: 1, MAX: 90 },
  ASCENSION: { MIN: 0, MAX: 6 },
  CONSTELLATION: { MIN: 0, MAX: 6 },
  FRIENDSHIP: { MIN: 1, MAX: 10 },
} as const;

export const WEAPON_LIMITS = {
  LEVEL: { MIN: 1, MAX: 90 },
  ASCENSION: { MIN: 0, MAX: 6 },
  REFINEMENT: { MIN: 1, MAX: 5 },
} as const;

export const TALENT_LIMITS = {
  LEVEL: { MIN: 1, MAX: 10 },
} as const;

export const ARTIFACT_LIMITS = {
  LEVEL: { MIN: 0, MAX: 20 },
  BY_RARITY: {
    1: { MIN: 0, MAX: 4 },
    2: { MIN: 0, MAX: 8 },
    3: { MIN: 0, MAX: 12 },
    4: { MIN: 0, MAX: 16 },
    5: { MIN: 0, MAX: 20 },
  } as Record<number, { MIN: number; MAX: number }>,
  PRESETS: [0, 4, 8, 12, 16, 20] as const,
} as const;

export const INVENTORY_LIMITS = {
  QUANTITY: { MIN: 0, MAX: 999_999_999 },
} as const;

/**
 * Retorna o nível máximo permitido de artefato baseado na raridade (1 a 5 estrelas).
 * Caso a raridade seja desconhecida ou nula, retorna 20 por padrão.
 */
export function getArtifactMaxLevelByRarity(rarity?: number | null): number {
  if (rarity && ARTIFACT_LIMITS.BY_RARITY[rarity]) {
    return ARTIFACT_LIMITS.BY_RARITY[rarity].MAX;
  }
  return ARTIFACT_LIMITS.LEVEL.MAX;
}

/**
 * Retorna os presets de melhoria aplicáveis a uma determinada raridade de artefato.
 */
export function getArtifactPresetsForRarity(rarity?: number | null): number[] {
  const max = getArtifactMaxLevelByRarity(rarity);
  return ARTIFACT_LIMITS.PRESETS.filter((p) => p <= max);
}
