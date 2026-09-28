import { requireProfileTraveler } from './travelerRepository';
import type {
  AccountCharacter,
  UpdateAccountCharacterInput,
} from '../../domain/characters/types';
import {
  createDefaultAccountCharacter,
  validateAscension,
  validateConstellation,
  validateFriendship,
  validateLevel,
} from '../../domain/characters/validation';
import { getDatabase } from './client';
import { validateCombatStats } from '../../domain/characters/combatStats';

export interface AccountCharacterRow {
  combat_stats?: string | null;
  id: string;
  profile_id: string;
  character_id: string;
  owned: number;
  constellation: number;
  level: number;
  ascension: number;
  friendship: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToAccountCharacter(row: AccountCharacterRow): AccountCharacter {
  return {
    combatStats: row.combat_stats ? validateCombatStats(JSON.parse(row.combat_stats)) : null,
    id: row.id,
    profileId: row.profile_id,
    characterId: row.character_id,
    owned: Boolean(row.owned),
    constellation: Number(row.constellation) || 0,
    level: Number(row.level) || 1,
    ascension: Number(row.ascension) || 0,
    friendship: row.friendship !== null && row.friendship !== undefined ? Number(row.friendship) : null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ICharactersRepository {
  getAccountCharacters(profileId: string): Promise<AccountCharacter[]>;
  getAccountCharacter(profileId: string, characterId: string): Promise<AccountCharacter | null>;
  upsertAccountCharacter(
    profileId: string,
    characterId: string,
    input: UpdateAccountCharacterInput
  ): Promise<AccountCharacter>;
  toggleCharacterOwned(profileId: string, characterId: string): Promise<AccountCharacter>;
  setConstellation(profileId: string, characterId: string, constellation: number): Promise<AccountCharacter>;
  deleteAccountCharacter(profileId: string, characterId: string): Promise<void>;
}

export class SqliteCharactersRepository implements ICharactersRepository {
  public async getAccountCharacters(profileId: string): Promise<AccountCharacter[]> {
    const db = await getDatabase();
    const rows = await db.select<AccountCharacterRow[]>(
      'SELECT * FROM account_characters WHERE profile_id = $1 ORDER BY created_at ASC, id ASC',
      [profileId]
    );

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(mapRowToAccountCharacter);
  }

  public async getAccountCharacter(
    profileId: string,
    characterId: string
  ): Promise<AccountCharacter | null> {
    const db = await getDatabase();
    const rows = await db.select<AccountCharacterRow[]>(
      'SELECT * FROM account_characters WHERE profile_id = $1 AND character_id = $2',
      [profileId, characterId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    return mapRowToAccountCharacter(rows[0]);
  }

  public async upsertAccountCharacter(
    profileId: string,
    characterId: string,
    input: UpdateAccountCharacterInput
  ): Promise<AccountCharacter> {
    await requireProfileTraveler(profileId, characterId);
    const current =
      (await this.getAccountCharacter(profileId, characterId)) ??
      createDefaultAccountCharacter(profileId, characterId);

    const now = new Date().toISOString();

    const owned = input.owned !== undefined ? Boolean(input.owned) : current.owned;
    const constellation =
      input.constellation !== undefined
        ? validateConstellation(input.constellation)
        : current.constellation;
    const level = input.level !== undefined ? validateLevel(input.level) : current.level;
    const ascension =
      input.ascension !== undefined ? validateAscension(input.ascension) : current.ascension;
    const friendship =
      input.friendship !== undefined ? validateFriendship(input.friendship) : current.friendship;
    const notes = input.notes !== undefined ? (input.notes?.trim() || null) : current.notes;
    const combatStats = validateCombatStats(input.combatStats !== undefined ? input.combatStats : current.combatStats);

    const id = current.id || `${profileId}_${characterId}`;
    const createdAt = current.createdAt || now;

    const db = await getDatabase();
    await db.execute(
      `INSERT OR REPLACE INTO account_characters (
        id, profile_id, character_id, owned, constellation, level, ascension, friendship, notes, created_at, updated_at, combat_stats
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        profileId,
        characterId,
        owned ? 1 : 0,
        constellation,
        level,
        ascension,
        friendship,
        notes,
        createdAt,
        now,
        combatStats ? JSON.stringify(combatStats) : null,
      ]
    );

    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('wishlog-characters-changed', { detail: profileId }));
    return {
      id,
      combatStats,
      profileId,
      characterId,
      owned,
      constellation,
      level,
      ascension,
      friendship,
      notes,
      createdAt,
      updatedAt: now,
    };
  }

  public async toggleCharacterOwned(
    profileId: string,
    characterId: string
  ): Promise<AccountCharacter> {
    const current =
      (await this.getAccountCharacter(profileId, characterId)) ??
      createDefaultAccountCharacter(profileId, characterId);

    return this.upsertAccountCharacter(profileId, characterId, {
      owned: !current.owned,
    });
  }

  public async setConstellation(
    profileId: string,
    characterId: string,
    constellation: number
  ): Promise<AccountCharacter> {
    const validated = validateConstellation(constellation);
    return this.upsertAccountCharacter(profileId, characterId, {
      constellation: validated,
      owned: true, // Configurar constelação implica posse do personagem
    });
  }

  public async deleteAccountCharacter(profileId: string, characterId: string): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'DELETE FROM account_characters WHERE profile_id = $1 AND character_id = $2',
      [profileId, characterId]
    );
  }
}

export const charactersRepository: ICharactersRepository = new SqliteCharactersRepository();
