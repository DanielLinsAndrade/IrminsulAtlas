import type { Rarity, WeaponType } from '../catalog';

/**
 * Registro de uma cópia de arma possuída pela conta/perfil.
 * Permite múltiplas instâncias da mesma arma (sem UNIQUE em weapon_id).
 * Conforme SPEC.md (Seções 11 e 12) e ARCHITECTURE.md (Seção 6).
 */
export interface AccountWeapon {
  id: string;
  profileId: string;
  weaponId: string;
  instanceNo: number; // 1, 2, 3...
  level: number; // 1 a 90
  ascension: number; // 0 a 6
  refinement: number; // 1 a 5 (R1 a R5)
  equippedCharacterId: string | null;
  favorite: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Instância da arma enriquecida com dados estáticos do catálogo e personagem equipado.
 */
export interface AccountWeaponWithDetails extends AccountWeapon {
  gameKey: string;
  namePtBr: string;
  rarity: Rarity;
  weaponType: WeaponType;
  releaseVersionId: string | null;
  iconUrl: string | null;
  equippedCharacterName?: string | null;
  equippedCharacterIconUrl?: string | null;
}

/**
 * Dados para criação de uma nova cópia de arma.
 */
export interface CreateAccountWeaponInput {
  weaponId: string;
  level?: number;
  ascension?: number;
  refinement?: number;
  equippedCharacterId?: string | null;
  favorite?: boolean;
  notes?: string | null;
}

/**
 * Dados para atualização de uma arma existente.
 */
export interface UpdateAccountWeaponInput {
  level?: number;
  ascension?: number;
  refinement?: number;
  equippedCharacterId?: string | null;
  favorite?: boolean;
  notes?: string | null;
}

export type EquippedFilter = 'all' | 'equipped' | 'unequipped';
export type RefinementFilter = 'all' | 1 | 2 | 3 | 4 | 5;

/**
 * Opções de filtros para a coleção de armas.
 */
export interface WeaponFilterOptions {
  search?: string;
  weaponType?: WeaponType | 'all';
  rarity?: Rarity | 'all';
  refinement?: RefinementFilter;
  equipped?: EquippedFilter;
  favoriteOnly?: boolean;
}
