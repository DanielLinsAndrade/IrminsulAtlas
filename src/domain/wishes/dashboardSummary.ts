import type { ProfileResources } from '../inventory';
import { PRIMOGEMS_PER_WISH, STARGLITTER_PER_WISH } from '../inventory/calculations';
export interface TotalWishSelection { scenario: 'character' | 'weapon' | 'both'; characterPity: boolean; weaponPity: boolean; primogems: boolean; fates: boolean; glitter: boolean; crystals: boolean }
export const DEFAULT_TOTAL_SELECTION: TotalWishSelection = { scenario: 'character', characterPity: true, weaponPity: true, primogems: true, fates: true, glitter: true, crystals: false };
export function calculateDashboardTotal(resources: ProfileResources | null, characterPity: number, weaponPity: number, selection: TotalWishSelection) {
  const gems = (selection.primogems ? resources?.primogems ?? 0 : 0) + (selection.crystals ? resources?.genesisCrystals ?? 0 : 0);
  const available = Math.floor(gems / PRIMOGEMS_PER_WISH) + (selection.fates ? resources?.intertwinedFates ?? 0 : 0) + (selection.glitter ? Math.floor((resources?.starglitter ?? 0) / STARGLITTER_PER_WISH) : 0);
  const progress = (selection.characterPity && selection.scenario !== 'weapon' ? characterPity : 0) + (selection.weaponPity && selection.scenario !== 'character' ? weaponPity : 0);
  return { available, progress, total: available + progress };
}
