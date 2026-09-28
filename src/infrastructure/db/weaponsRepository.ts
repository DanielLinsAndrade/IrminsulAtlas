import { requireProfileTraveler } from './travelerRepository';
import type {
  AccountWeapon,
  CreateAccountWeaponInput,
  UpdateAccountWeaponInput,
} from '../../domain/weapons/types';
import {
  validateRefinement,
  validateWeaponAscension,
  validateWeaponLevel,
} from '../../domain/weapons/validation';
import { getDatabase } from './client';

export interface AccountWeaponRow {
  id: string;
  profile_id: string;
  weapon_id: string;
  instance_no: number;
  level: number;
  ascension: number;
  refinement: number;
  equipped_character_id: string | null;
  favorite: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapAccountWeaponRow(row: AccountWeaponRow): AccountWeapon {
  return {
    id: row.id,
    profileId: row.profile_id,
    weaponId: row.weapon_id,
    instanceNo: row.instance_no,
    level: row.level,
    ascension: row.ascension,
    refinement: row.refinement,
    equippedCharacterId: row.equipped_character_id,
    favorite: Boolean(row.favorite),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface IWeaponsRepository {
  getAccountWeapons(profileId: string): Promise<AccountWeapon[]>;
  getAccountWeapon(id: string): Promise<AccountWeapon | null>;
  getAccountWeaponById(id: string): Promise<AccountWeapon | null>;
  getAccountWeaponsByWeaponId(profileId: string, weaponId: string): Promise<AccountWeapon[]>;
  createAccountWeapon(profileId: string, input: CreateAccountWeaponInput): Promise<AccountWeapon>;
  updateAccountWeapon(id: string, input: UpdateAccountWeaponInput): Promise<AccountWeapon>;
  deleteAccountWeapon(id: string): Promise<boolean>;
  toggleFavorite(id: string): Promise<AccountWeapon>;
  setEquippedCharacter(id: string, characterId: string | null): Promise<AccountWeapon>;
  getNextInstanceNo(profileId: string, weaponId: string): Promise<number>;
}

export class SqliteWeaponsRepository implements IWeaponsRepository {
  public async getAccountWeapons(profileId: string): Promise<AccountWeapon[]> {
    const db = await getDatabase();
    const rows = await db.select<AccountWeaponRow[]>(
      'SELECT * FROM account_weapons WHERE profile_id = $1 ORDER BY updated_at DESC',
      [profileId]
    );
    return rows.map(mapAccountWeaponRow);
  }

  public async getAccountWeapon(id: string): Promise<AccountWeapon | null> {
    const db = await getDatabase();
    const rows = await db.select<AccountWeaponRow[]>(
      'SELECT * FROM account_weapons WHERE id = $1',
      [id]
    );
    if (!rows || rows.length === 0) return null;
    return mapAccountWeaponRow(rows[0]);
  }

  public async getAccountWeaponById(id: string): Promise<AccountWeapon | null> {
    return this.getAccountWeapon(id);
  }

  public async getAccountWeaponsByWeaponId(
    profileId: string,
    weaponId: string
  ): Promise<AccountWeapon[]> {
    const db = await getDatabase();
    const rows = await db.select<AccountWeaponRow[]>(
      'SELECT * FROM account_weapons WHERE profile_id = $1 AND weapon_id = $2 ORDER BY instance_no ASC',
      [profileId, weaponId]
    );
    return rows.map(mapAccountWeaponRow);
  }

  public async getNextInstanceNo(profileId: string, weaponId: string): Promise<number> {
    const db = await getDatabase();
    const rows = await db.select<Array<{ max_instance: number | null }>>(
      'SELECT MAX(instance_no) as max_instance FROM account_weapons WHERE profile_id = $1 AND weapon_id = $2',
      [profileId, weaponId]
    );
    const currentMax = rows?.[0]?.max_instance ?? 0;
    return (currentMax || 0) + 1;
  }

  public async createAccountWeapon(
    profileId: string,
    input: CreateAccountWeaponInput
  ): Promise<AccountWeapon> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const instanceNo = await this.getNextInstanceNo(profileId, input.weaponId);
    const id = `aw_${profileId}_${input.weaponId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const level = validateWeaponLevel(input.level ?? 1);
    const ascension = validateWeaponAscension(input.ascension ?? 0);
    const refinement = validateRefinement(input.refinement ?? 1);
    const favorite = input.favorite ? 1 : 0;
    const equippedCharacterId = input.equippedCharacterId || null;
    if (equippedCharacterId) await requireProfileTraveler(profileId, equippedCharacterId);
    const notes = input.notes?.trim() || null;

    await db.execute(
      `INSERT INTO account_weapons (
        id, profile_id, weapon_id, instance_no, level, ascension,
        refinement, equipped_character_id, favorite, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        profileId,
        input.weaponId,
        instanceNo,
        level,
        ascension,
        refinement,
        equippedCharacterId,
        favorite,
        notes,
        now,
        now,
      ]
    );

    return {
      id,
      profileId,
      weaponId: input.weaponId,
      instanceNo,
      level,
      ascension,
      refinement,
      equippedCharacterId,
      favorite: Boolean(favorite),
      notes,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async updateAccountWeapon(
    id: string,
    input: UpdateAccountWeaponInput
  ): Promise<AccountWeapon> {
    const existing = await this.getAccountWeapon(id);
    if (!existing) {
      throw new Error(`Arma da conta com id '${id}' não encontrada.`);
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    const level = input.level !== undefined ? validateWeaponLevel(input.level) : existing.level;
    const ascension =
      input.ascension !== undefined ? validateWeaponAscension(input.ascension) : existing.ascension;
    const refinement =
      input.refinement !== undefined ? validateRefinement(input.refinement) : existing.refinement;
    const favorite = input.favorite !== undefined ? (input.favorite ? 1 : 0) : (existing.favorite ? 1 : 0);
    const equippedCharacterId =
      input.equippedCharacterId !== undefined ? input.equippedCharacterId : existing.equippedCharacterId;
    if (equippedCharacterId) await requireProfileTraveler(existing.profileId, equippedCharacterId);
    const notes = input.notes !== undefined ? (input.notes?.trim() || null) : existing.notes;

    await db.execute(
      `UPDATE account_weapons SET
        level = $1,
        ascension = $2,
        refinement = $3,
        equipped_character_id = $4,
        favorite = $5,
        notes = $6,
        updated_at = $7
      WHERE id = $8`,
      [
        level,
        ascension,
        refinement,
        equippedCharacterId,
        favorite,
        notes,
        now,
        id,
      ]
    );

    return {
      ...existing,
      level,
      ascension,
      refinement,
      equippedCharacterId,
      favorite: Boolean(favorite),
      notes,
      updatedAt: now,
    };
  }

  public async deleteAccountWeapon(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.execute('DELETE FROM account_weapons WHERE id = $1', [id]);
    return result.rowsAffected > 0;
  }

  public async toggleFavorite(id: string): Promise<AccountWeapon> {
    const existing = await this.getAccountWeapon(id);
    if (!existing) {
      throw new Error(`Arma da conta com id '${id}' não encontrada.`);
    }

    const nextFav = !existing.favorite;
    const now = new Date().toISOString();
    const db = await getDatabase();

    await db.execute('UPDATE account_weapons SET favorite = $1, updated_at = $2 WHERE id = $3', [
      nextFav ? 1 : 0,
      now,
      id,
    ]);

    return {
      ...existing,
      favorite: nextFav,
      updatedAt: now,
    };
  }

  public async setEquippedCharacter(
    id: string,
    characterId: string | null
  ): Promise<AccountWeapon> {
    const existing = await this.getAccountWeapon(id);
    if (!existing) {
      throw new Error(`Arma da conta com id '${id}' não encontrada.`);
    }

    const now = new Date().toISOString();
    const db = await getDatabase();

    await db.execute(
      'UPDATE account_weapons SET equipped_character_id = $1, updated_at = $2 WHERE id = $3',
      [characterId, now, id]
    );

    return {
      ...existing,
      equippedCharacterId: characterId,
      updatedAt: now,
    };
  }
}

export const weaponsRepository: IWeaponsRepository = new SqliteWeaponsRepository();
