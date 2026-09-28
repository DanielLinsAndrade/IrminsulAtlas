import type {
  AccountCharacter,
  AccountCharacterWithDetails,
  CharacterFilterOptions,
} from './types';
import { CHARACTER_LIMITS } from '../constants/limits';

export const MIN_CONSTELLATION = CHARACTER_LIMITS.CONSTELLATION.MIN;
export const MAX_CONSTELLATION = CHARACTER_LIMITS.CONSTELLATION.MAX;
export const MIN_LEVEL = CHARACTER_LIMITS.LEVEL.MIN;
export const MAX_LEVEL = CHARACTER_LIMITS.LEVEL.MAX;
export const MIN_ASCENSION = CHARACTER_LIMITS.ASCENSION.MIN;
export const MAX_ASCENSION = CHARACTER_LIMITS.ASCENSION.MAX;
export const MIN_FRIENDSHIP = CHARACTER_LIMITS.FRIENDSHIP.MIN;
export const MAX_FRIENDSHIP = CHARACTER_LIMITS.FRIENDSHIP.MAX;

export const ASCENSION_MAX_LEVEL_MAP: Record<number, number> = {
  0: 20,
  1: 40,
  2: 50,
  3: 60,
  4: 70,
  5: 80,
  6: 90,
};

/**
 * Valida o valor da constelação (deve ser um inteiro entre 0 e 6, ou maxConstellation específico).
 */
export function validateConstellation(value: unknown, maxAllowed: number = MAX_CONSTELLATION): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    throw new Error('A constelação deve ser um número inteiro válido.');
  }
  if (num < MIN_CONSTELLATION || num > maxAllowed) {
    throw new Error(`A constelação deve estar entre C${MIN_CONSTELLATION} e C${maxAllowed}.`);
  }
  return num;
}

/**
 * Valida o nível do personagem (deve ser um inteiro entre 1 e 90).
 */
export function validateLevel(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 1;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    throw new Error('O nível deve ser um número inteiro válido.');
  }
  if (num < MIN_LEVEL || num > MAX_LEVEL) {
    throw new Error(`O nível deve estar entre ${MIN_LEVEL} e ${MAX_LEVEL}.`);
  }
  return num;
}

/**
 * Valida a fase de ascensão do personagem (deve ser um inteiro entre 0 e 6).
 */
export function validateAscension(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    throw new Error('A ascensão deve ser um número inteiro válido.');
  }
  if (num < MIN_ASCENSION || num > MAX_ASCENSION) {
    throw new Error(`A fase de ascensão deve estar entre ${MIN_ASCENSION} e ${MAX_ASCENSION}.`);
  }
  return num;
}

/**
 * Valida o nível de amizade do personagem (deve ser um inteiro entre 1 e 10, ou null).
 */
export function validateFriendship(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    throw new Error('A amizade deve ser um número inteiro válido.');
  }
  if (num < MIN_FRIENDSHIP || num > MAX_FRIENDSHIP) {
    throw new Error(`A amizade deve estar entre ${MIN_FRIENDSHIP} e ${MAX_FRIENDSHIP}.`);
  }
  return num;
}

/**
 * Retorna o nível máximo permitido para a fase de ascensão indicada.
 */
export function getAscensionMaxLevel(ascension: number): number {
  return ASCENSION_MAX_LEVEL_MAP[ascension] ?? 90;
}

/**
 * Cria o registro padrão de personagem para um perfil (estado não possuído).
 */
export function createDefaultAccountCharacter(
  profileId: string,
  characterId: string
): AccountCharacter {
  const now = new Date().toISOString();
  return {
    id: `${profileId}_${characterId}`,
    profileId,
    characterId,
    owned: false,
    constellation: 0,
    level: 1,
    ascension: 0,
    friendship: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Predicado de filtro para personagens com detalhes.
 */
export function matchesCharacterFilters(
  char: AccountCharacterWithDetails,
  filters: CharacterFilterOptions
): boolean {
  // Filtro de busca por nome ou gameKey
  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.trim().toLowerCase();
    const nameMatch = char.namePtBr.toLowerCase().includes(q);
    const keyMatch = char.gameKey.toLowerCase().includes(q);
    if (!nameMatch && !keyMatch) return false;
  }

  // Filtro de Elemento
  if (filters.element && filters.element !== 'all') {
    if (char.element !== filters.element) return false;
  }

  // Filtro de Tipo de Arma
  if (filters.weaponType && filters.weaponType !== 'all') {
    if (char.weaponType !== filters.weaponType) return false;
  }

  // Filtro de Raridade (4★ ou 5★)
  if (filters.rarity && filters.rarity !== 'all') {
    if (char.rarity !== filters.rarity) return false;
  }

  // Filtro de Possui / Não possui
  if (filters.owned && filters.owned !== 'all') {
    if (filters.owned === 'owned' && !char.owned) return false;
    if (filters.owned === 'unowned' && char.owned) return false;
  }

  // Filtro de Constelação
  if (filters.constellation !== undefined && filters.constellation !== 'all') {
    if (char.constellation !== filters.constellation) return false;
  }

  // Filtro de Região
  if (filters.region && filters.region !== 'all') {
    if ((char.region || '').toLowerCase() !== filters.region.toLowerCase()) return false;
  }

  // Filtro de Versão de Lançamento (ex.: '1.x', '2.x', ..., ou '5.4')
  if (filters.releaseVersion && filters.releaseVersion !== 'all') {
    const charVer = char.releaseVersionId || '';
    if (filters.releaseVersion.endsWith('.x')) {
      const major = filters.releaseVersion.split('.')[0];
      if (!charVer.startsWith(`${major}.`)) return false;
    } else {
      if (charVer !== filters.releaseVersion) return false;
    }
  }

  return true;
}
