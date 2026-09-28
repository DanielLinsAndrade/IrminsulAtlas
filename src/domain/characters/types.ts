import type { Element, WeaponType } from '../catalog';
import type { CombatStats } from './combatStats';

/**
 * Registro de personagem da conta/perfil do usuário.
 * Conforme SPEC.md (Seções 11 e 12) e ARCHITECTURE.md (Seção 6).
 */
export interface AccountCharacter {
  combatStats?: CombatStats | null;
  id: string;
  profileId: string;
  characterId: string;
  owned: boolean;
  constellation: number; // 0 a 6 (C0 a C6)
  level: number; // 1 a 90
  ascension: number; // 0 a 6
  friendship: number | null; // 1 a 10 ou null
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Personagem da conta enriquecido com metadados e assets do catálogo estático.
 */
export interface AccountCharacterWithDetails extends AccountCharacter {
  gameKey: string;
  namePtBr: string;
  rarity: 4 | 5;
  element: Element;
  weaponType: WeaponType;
  releaseVersionId: string | null;
  iconUrl: string | null;
  splashUrl: string | null;
  region?: string | null;
  maxConstellation?: number;
  supportsFriendship?: boolean;
}

/**
 * Dados de entrada para atualização de progresso do personagem.
 */
export interface UpdateAccountCharacterInput {
  combatStats?: CombatStats | null;
  owned?: boolean;
  constellation?: number;
  level?: number;
  ascension?: number;
  friendship?: number | null;
  notes?: string | null;
}

export type OwnedFilter = 'all' | 'owned' | 'unowned';
export type ConstellationFilter = 'all' | 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CharacterSortBy = 'rarity' | 'acquisition' | 'name' | 'level';

/**
 * Opções de filtros para a coleção de personagens.
 */
export interface CharacterFilterOptions {
  search?: string;
  element?: Element | 'all';
  weaponType?: WeaponType | 'all';
  rarity?: 4 | 5 | 'all';
  owned?: OwnedFilter;
  constellation?: ConstellationFilter;
  region?: string | 'all';
  releaseVersion?: string | 'all';
  sortBy?: CharacterSortBy;
}
