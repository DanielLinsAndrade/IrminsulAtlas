import type { AccountWeaponWithDetails, WeaponFilterOptions } from './types';
import { WEAPON_LIMITS } from '../constants/limits';

export const MIN_WEAPON_LEVEL = WEAPON_LIMITS.LEVEL.MIN;
export const MAX_WEAPON_LEVEL = WEAPON_LIMITS.LEVEL.MAX;
export const MIN_WEAPON_ASCENSION = WEAPON_LIMITS.ASCENSION.MIN;
export const MAX_WEAPON_ASCENSION = WEAPON_LIMITS.ASCENSION.MAX;
export const MIN_WEAPON_REFINEMENT = WEAPON_LIMITS.REFINEMENT.MIN;
export const MAX_WEAPON_REFINEMENT = WEAPON_LIMITS.REFINEMENT.MAX;

/**
 * Valida o nível de refinamento (R1 a R5).
 */
export function validateRefinement(refinement: unknown): number {
  if (refinement === undefined || refinement === null || refinement === '') {
    return 1;
  }
  const parsed = Number(refinement);
  if (!Number.isInteger(parsed)) {
    throw new Error('O refinamento deve ser um número inteiro válido.');
  }
  if (parsed < MIN_WEAPON_REFINEMENT || parsed > MAX_WEAPON_REFINEMENT) {
    throw new Error(`O refinamento deve estar entre R${MIN_WEAPON_REFINEMENT} e R${MAX_WEAPON_REFINEMENT}.`);
  }
  return parsed;
}

/**
 * Valida o nível da arma (1 a 90).
 */
export function validateWeaponLevel(level: unknown): number {
  if (level === undefined || level === null || level === '') {
    return 1;
  }
  const parsed = Number(level);
  if (!Number.isInteger(parsed)) {
    throw new Error('O nível da arma deve ser um número inteiro válido.');
  }
  if (parsed < MIN_WEAPON_LEVEL || parsed > MAX_WEAPON_LEVEL) {
    throw new Error(`O nível da arma deve estar entre ${MIN_WEAPON_LEVEL} e ${MAX_WEAPON_LEVEL}.`);
  }
  return parsed;
}

/**
 * Valida a fase de ascensão da arma (0 a 6).
 */
export function validateWeaponAscension(ascension: unknown): number {
  if (ascension === undefined || ascension === null || ascension === '') {
    return 0;
  }
  const parsed = Number(ascension);
  if (!Number.isInteger(parsed)) {
    throw new Error('A fase de ascensão deve ser um número inteiro válido.');
  }
  if (parsed < MIN_WEAPON_ASCENSION || parsed > MAX_WEAPON_ASCENSION) {
    throw new Error(`A fase de ascensão deve estar entre ${MIN_WEAPON_ASCENSION} e ${MAX_WEAPON_ASCENSION}.`);
  }
  return parsed;
}

/**
 * Retorna o nível máximo permitido para cada fase de ascensão de arma.
 */
export function getWeaponAscensionMaxLevel(ascension: number): number {
  switch (ascension) {
    case 0: return 20;
    case 1: return 40;
    case 2: return 50;
    case 3: return 60;
    case 4: return 70;
    case 5: return 80;
    case 6: return 90;
    default: return 90;
  }
}

/**
 * Avalia se uma arma satisfaz o conjunto de filtros fornecido.
 */
export function matchesWeaponFilters(
  weapon: AccountWeaponWithDetails,
  filters: WeaponFilterOptions
): boolean {
  // Filtro textual
  if (filters.search && filters.search.trim() !== '') {
    const term = filters.search.toLowerCase().trim();
    const nameMatch = weapon.namePtBr.toLowerCase().includes(term);
    const keyMatch = weapon.gameKey.toLowerCase().includes(term);
    if (!nameMatch && !keyMatch) return false;
  }

  // Filtro por tipo de arma
  if (filters.weaponType && filters.weaponType !== 'all') {
    if (weapon.weaponType !== filters.weaponType) return false;
  }

  // Filtro por raridade
  if (filters.rarity && filters.rarity !== 'all') {
    if (weapon.rarity !== filters.rarity) return false;
  }

  // Filtro por refinamento
  if (filters.refinement && filters.refinement !== 'all') {
    if (weapon.refinement !== filters.refinement) return false;
  }

  // Filtro por equipamento
  if (filters.equipped && filters.equipped !== 'all') {
    if (filters.equipped === 'equipped' && !weapon.equippedCharacterId) return false;
    if (filters.equipped === 'unequipped' && weapon.equippedCharacterId) return false;
  }

  // Filtro por favoritos
  if (filters.favoriteOnly) {
    if (!weapon.favorite) return false;
  }

  return true;
}
