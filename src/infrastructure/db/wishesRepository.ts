import type {
  BannerCurrentPity,
  BannerType,
  CreateWishInput,
  SetBannerCurrentPityInput,
  UpdateWishInput,
  WishEntry,
  WishItemType,
  WishRuleSet,
} from '../../domain/wishes/types';
import { clampBannerPity, DEFAULT_RULE_SETS } from '../../domain/wishes/types';
import {
  calculatePityProgression,
  recalculatePityIndices,
} from '../../domain/wishes/pityEngine';
import { getDatabaseInstance } from './client';
import { validateWeaponFate, validateWeaponPath, type WeaponFateState, type WeaponPathResult } from '../../domain/wishes/weaponFate';
import { assertBannerItem } from '../../domain/wishes/bannerEligibility';

export interface WishEntryRow {
  weapon_path_result?: WeaponPathResult | null;
  weapon_fate_state?: WeaponFateState | null;
  id: string;
  profile_id: string;
  occurred_at: string;
  game_version_id: string | null;
  banner_type: string;
  banner_name: string | null;
  item_type: string;
  item_id: string;
  item_name: string;
  rarity: number;
  pity_index: number;
  sequence_no: number;
  is_featured: number;
  won_pity_rate: number;
  rule_set_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishRuleSetRow {
  id: string;
  game_key: string;
  name: string;
  banner_type: string;
  hard_pity_5star: number;
  soft_pity_5star: number;
  hard_pity_4star: number;
  soft_pity_4star: number;
  base_rate_5star: number;
  base_rate_4star: number;
  featured_guarantee_system: string;
  created_at: string;
}

export interface BannerPityStateRow {
  id: string;
  profile_id: string;
  banner_type: string;
  current_5star_pity: number;
  current_4star_pity: number;
  updated_at: string;
}

function mapRowToWish(row: WishEntryRow): WishEntry {
  return {
    weaponPathResult: row.weapon_path_result ?? null,
    weaponFateState: row.weapon_fate_state ?? null,
    id: row.id,
    profileId: row.profile_id,
    occurredAt: row.occurred_at,
    gameVersionId: row.game_version_id,
    bannerType: row.banner_type as BannerType,
    bannerName: row.banner_name,
    itemType: row.item_type as WishItemType,
    itemId: row.item_id,
    itemName: row.item_name,
    rarity: row.rarity,
    pityIndex: row.pity_index,
    sequenceNo: Number(row.sequence_no) || 0,
    isFeatured: Boolean(row.is_featured),
    wonPityRate: Boolean(row.won_pity_rate),
    ruleSetId: row.rule_set_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class WishesRepository {
  public async importHistory(profileId: string, entries: import('../../domain/wishes/history').PortableWish[]): Promise<number> {
    if (!profileId || !entries.length) return 0;
    const db = await getDatabaseInstance();
    const now = new Date().toISOString();
    for (const wish of entries) { validateWeaponFate(wish.bannerType, wish.weaponFateState); validateWeaponPath(wish.bannerType, wish.weaponPathResult); }
    const values = entries.map(w => [w.id, profileId, w.occurredAt, w.gameVersionId, w.bannerType, w.bannerName, w.itemType, w.itemId, w.itemName, w.rarity, w.pityIndex, w.sequenceNo, Number(w.isFeatured), Number(w.wonPityRate), w.ruleSetId, w.notes, now, now, w.weaponFateState ?? null, w.weaponPathResult ?? null]);
    // One SQLite statement is atomic even with the plugin's connection pool.
    const result = await db.execute(`INSERT INTO wish_entries (id, profile_id, occurred_at, game_version_id, banner_type, banner_name, item_type, item_id, item_name, rarity, pity_index, sequence_no, is_featured, won_pity_rate, rule_set_id, notes, created_at, updated_at, weapon_fate_state, weapon_path_result)
      SELECT ${Array.from({ length: 20 }, (_, i) => `json_extract(value, '$[${i}]')`).join(', ')} FROM json_each($1) WHERE true ON CONFLICT(id) DO NOTHING`, [JSON.stringify(values)]);
    return result.rowsAffected;
  }

  public async getRuleSets(): Promise<WishRuleSet[]> {
    const db = await getDatabaseInstance();
    const rows = await db.select<WishRuleSetRow[]>(
      'SELECT * FROM wish_rule_sets ORDER BY id ASC'
    );
    if (!rows || rows.length === 0) {
      return Object.values(DEFAULT_RULE_SETS);
    }
    return rows.map((r: WishRuleSetRow) => ({
      id: r.id,
      gameKey: r.game_key,
      name: r.name,
      bannerType: r.banner_type as BannerType,
      hardPity5Star: r.hard_pity_5star,
      softPity5Star: r.soft_pity_5star,
      hardPity4Star: r.hard_pity_4star,
      softPity4Star: r.soft_pity_4star,
      baseRate5Star: r.base_rate_5star,
      baseRate4Star: r.base_rate_4star,
      featuredGuaranteeSystem: r.featured_guarantee_system as WishRuleSet['featuredGuaranteeSystem'],
    }));
  }

  public async backfillSequenceNumbers(profileId: string): Promise<void> {
    const db = await getDatabaseInstance();
    const all = await db.select<WishEntryRow[]>(
      'SELECT * FROM wish_entries WHERE profile_id = $1 ORDER BY occurred_at ASC, created_at ASC, id ASC',
      [profileId]
    );
    let seq = 1;
    for (const wish of all) {
      await db.execute(
        'UPDATE wish_entries SET sequence_no = $1 WHERE id = $2',
        [seq++, wish.id]
      );
    }
  }

  public async getWishesByProfile(
    profileId: string,
    bannerType?: BannerType
  ): Promise<WishEntry[]> {
    const db = await getDatabaseInstance();

    // Backfill retrocompatível de sequence_no caso registros anteriores existam sem numeração
    try {
      const zeroSeqRows = await db.select<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM wish_entries WHERE profile_id = $1 AND (sequence_no IS NULL OR sequence_no = 0)',
        [profileId]
      );
      if (zeroSeqRows && zeroSeqRows[0]?.count > 0) {
        await this.backfillSequenceNumbers(profileId);
      }
    } catch {
      // Ignora em caso de tabela ainda sendo criada
    }

    let query = 'SELECT * FROM wish_entries WHERE profile_id = $1';
    const params: unknown[] = [profileId];

    if (bannerType) {
      query += ' AND banner_type = $2';
      params.push(bannerType);
    }

    // Ordem histórica determinística: sequence_no DESC preserva posição imutável mesmo após edição
    query += ' ORDER BY sequence_no DESC, occurred_at DESC, id DESC';
    const rows = await db.select<WishEntryRow[]>(query, params);
    return (rows || []).map(mapRowToWish);
  }

  public async insertWish(profileId: string, input: CreateWishInput): Promise<WishEntry> {
    assertBannerItem(input);
    validateWeaponFate(input.bannerType, input.weaponFateState);
    validateWeaponPath(input.bannerType, input.weaponPathResult);
    const db = await getDatabaseInstance();
    const now = new Date().toISOString();
    const occurredAt = input.occurredAt || now;
    const id = `wish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Busca o histórico prévio para calcular pity correto caso não tenha sido informado manualmente
    const existing = await this.getWishesByProfile(profileId, input.bannerType);
    const pityState = calculatePityProgression(existing, input.bannerType);
    const pityIndex =
      input.pityIndex !== undefined && input.pityIndex > 0
        ? input.pityIndex
        : input.rarity === 5
        ? pityState.current5StarPity + 1
        : input.rarity === 4
        ? pityState.current4StarPity + 1
        : 1;

    const isFeatured = input.isFeatured !== undefined ? input.isFeatured : true;
    let wonPityRate = false;
    if (input.rarity === 5) {
      if (input.wonPityRate !== undefined) {
        wonPityRate = input.wonPityRate;
      } else {
        wonPityRate = isFeatured && !pityState.is5StarGuaranteed;
      }
    }

    // Determina o próximo sequence_no de forma contínua e imutável
    let sequenceNo: number;
    if (input.sequenceNo && input.sequenceNo > 0) {
      sequenceNo = input.sequenceNo;
    } else {
      const maxRows = await db.select<{ max_seq: number | null }[]>(
        'SELECT MAX(sequence_no) as max_seq FROM wish_entries WHERE profile_id = $1',
        [profileId]
      );
      sequenceNo = (maxRows?.[0]?.max_seq ?? 0) + 1;
    }

    await db.execute(
      `INSERT INTO wish_entries (
        id, profile_id, occurred_at, game_version_id, banner_type, banner_name,
        item_type, item_id, item_name, rarity, pity_index, sequence_no, is_featured,
        won_pity_rate, rule_set_id, notes, created_at, updated_at, weapon_fate_state, weapon_path_result
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        id,
        profileId,
        occurredAt,
        input.gameVersionId ?? null,
        input.bannerType,
        input.bannerName ?? null,
        input.itemType,
        input.itemId,
        input.itemName,
        input.rarity,
        pityIndex,
        sequenceNo,
        isFeatured ? 1 : 0,
        wonPityRate ? 1 : 0,
        input.ruleSetId ?? null,
        input.notes ?? null,
        now,
        now,
        input.weaponFateState ?? null,
        input.weaponPathResult ?? null,
      ]
    );

    return {
      id,
      profileId,
      occurredAt,
      gameVersionId: input.gameVersionId ?? null,
      bannerType: input.bannerType,
      bannerName: input.bannerName ?? null,
      itemType: input.itemType,
      itemId: input.itemId,
      itemName: input.itemName,
      rarity: input.rarity,
      pityIndex,
      sequenceNo,
      isFeatured,
      wonPityRate,
      ruleSetId: input.ruleSetId ?? null,
      notes: input.notes ?? null,
      weaponFateState: input.weaponFateState ?? null,
      weaponPathResult: input.weaponPathResult ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async updateWish(id: string, input: UpdateWishInput): Promise<WishEntry | null> {
    const db = await getDatabaseInstance();
    const rows = await db.select<WishEntryRow[]>(
      'SELECT * FROM wish_entries WHERE id = $1',
      [id]
    );
    if (!rows || rows.length === 0) return null;

    const current = mapRowToWish(rows[0]);
    const now = new Date().toISOString();

    const occurredAt = input.occurredAt ?? current.occurredAt;
    const gameVersionId = input.gameVersionId !== undefined ? input.gameVersionId : current.gameVersionId;
    const bannerType = input.bannerType ?? current.bannerType;
    const bannerName = input.bannerName !== undefined ? input.bannerName : current.bannerName;
    const itemType = input.itemType ?? current.itemType;
    const itemId = input.itemId ?? current.itemId;
    const itemName = input.itemName ?? current.itemName;
    const rarity = input.rarity ?? current.rarity;
    if (bannerType !== current.bannerType || itemId !== current.itemId || itemType !== current.itemType || rarity !== current.rarity || gameVersionId !== current.gameVersionId) assertBannerItem({ bannerType, itemType, itemId, rarity, gameVersionId });
    const pityIndex = input.pityIndex ?? current.pityIndex;
    const isFeatured = input.isFeatured !== undefined ? input.isFeatured : current.isFeatured;
    const wonPityRate = input.wonPityRate !== undefined ? input.wonPityRate : current.wonPityRate;
    const ruleSetId = input.ruleSetId !== undefined ? input.ruleSetId : current.ruleSetId;
    const notes = input.notes !== undefined ? input.notes : current.notes;
    const weaponFateState = input.weaponFateState !== undefined ? input.weaponFateState : bannerType === 'weapon' ? current.weaponFateState ?? null : null;
    validateWeaponFate(bannerType, weaponFateState);
    const weaponPathResult = input.weaponPathResult !== undefined ? input.weaponPathResult : bannerType === 'weapon' ? current.weaponPathResult ?? null : null;
    validateWeaponPath(bannerType, weaponPathResult);

    // sequence_no e created_at NUNCA são alterados em edições, garantindo estabilidade absoluta de posição
    await db.execute(
      `UPDATE wish_entries SET
        occurred_at = $1, game_version_id = $2, banner_type = $3, banner_name = $4,
        item_type = $5, item_id = $6, item_name = $7, rarity = $8, pity_index = $9,
        is_featured = $10, won_pity_rate = $11, rule_set_id = $12, notes = $13,
        updated_at = $14, weapon_fate_state = $15, weapon_path_result = $16
      WHERE id = $17`,
      [
        occurredAt,
        gameVersionId,
        bannerType,
        bannerName,
        itemType,
        itemId,
        itemName,
        rarity,
        pityIndex,
        isFeatured ? 1 : 0,
        wonPityRate ? 1 : 0,
        ruleSetId,
        notes,
        now,
        weaponFateState,
        weaponPathResult,
        id,
      ]
    );

    return {
      ...current,
      occurredAt,
      gameVersionId,
      bannerType,
      bannerName,
      itemType,
      itemId,
      itemName,
      rarity,
      pityIndex,
      isFeatured,
      wonPityRate,
      ruleSetId,
      notes,
      weaponFateState,
      weaponPathResult,
      updatedAt: now,
    };
  }

  public async deleteWish(id: string): Promise<boolean> {
    const db = await getDatabaseInstance();
    const res = await db.execute('DELETE FROM wish_entries WHERE id = $1', [id]);
    return res.rowsAffected > 0;
  }

  public async deleteWishesByProfile(profileId: string): Promise<number> {
    const db = await getDatabaseInstance();
    const res = await db.execute('DELETE FROM wish_entries WHERE profile_id = $1', [profileId]);
    return res.rowsAffected;
  }

  public async recalculateAndSavePity(
    profileId: string,
    bannerType: BannerType
  ): Promise<void> {
    const db = await getDatabaseInstance();
    const wishes = await this.getWishesByProfile(profileId, bannerType);
    const recalculated = recalculatePityIndices(wishes, bannerType);

    // Atualiza SOMENTE o estado derivado won_pity_rate sem jamais sobrescrever o pity_index obtido
    for (const wish of recalculated) {
      await db.execute(
        'UPDATE wish_entries SET won_pity_rate = $1 WHERE id = $2',
        [wish.wonPityRate ? 1 : 0, wish.id]
      );
    }
  }

  public async getBannerCurrentPity(
    profileId: string
  ): Promise<Record<BannerType, BannerCurrentPity>> {
    const db = await getDatabaseInstance();
    const rows = await db.select<BannerPityStateRow[]>(
      'SELECT * FROM banner_pity_states WHERE profile_id = $1',
      [profileId]
    );

    const bannerTypes: BannerType[] = ['character', 'weapon', 'standard', 'chronicled'];
    const rowMap = new Map<BannerType, BannerPityStateRow>();
    if (rows) {
      for (const row of rows) {
        rowMap.set(row.banner_type as BannerType, row);
      }
    }

    const result = {} as Record<BannerType, BannerCurrentPity>;
    for (const bt of bannerTypes) {
      const existing = rowMap.get(bt);
      if (existing) {
        const clamped = clampBannerPity(bt, existing.current_5star_pity, existing.current_4star_pity);
        result[bt] = {
          id: existing.id,
          profileId: existing.profile_id,
          bannerType: bt,
          current5StarPity: clamped.current5StarPity,
          current4StarPity: clamped.current4StarPity,
          updatedAt: existing.updated_at,
        };
      } else {
        result[bt] = {
          id: `pity_${profileId}_${bt}`,
          profileId,
          bannerType: bt,
          current5StarPity: 0,
          current4StarPity: 0,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    return result;
  }

  public async setBannerCurrentPity(
    profileId: string,
    bannerType: BannerType,
    input: SetBannerCurrentPityInput
  ): Promise<BannerCurrentPity> {
    const db = await getDatabaseInstance();
    const id = `pity_${profileId}_${bannerType}`;
    const now = new Date().toISOString();
    const { current5StarPity, current4StarPity } = clampBannerPity(
      bannerType,
      input.current5StarPity,
      input.current4StarPity
    );

    await db.execute(
      `INSERT INTO banner_pity_states (
        id, profile_id, banner_type, current_5star_pity, current_4star_pity, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(profile_id, banner_type) DO UPDATE SET
        current_5star_pity = excluded.current_5star_pity,
        current_4star_pity = excluded.current_4star_pity,
        updated_at = excluded.updated_at`,
      [id, profileId, bannerType, current5StarPity, current4StarPity, now]
    );

    return {
      id,
      profileId,
      bannerType,
      current5StarPity,
      current4StarPity,
      updatedAt: now,
    };
  }
}

export const wishesRepository = new WishesRepository();
