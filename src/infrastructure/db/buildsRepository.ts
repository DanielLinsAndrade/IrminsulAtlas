import { requireProfileTraveler } from './travelerRepository';
import { validateArtifactSubstats, decodeSubstats, encodeSubstats, validateSubstatValues } from '../../domain/builds/substats';
import type {
  ArtifactSlot,
  ArtifactSlotKey,
  CharacterBuild,
  UpdateArtifactSlotInput,
  UpdateCharacterBuildInput,
} from '../../domain/builds/types';
import {
  ARTIFACT_SLOT_KEYS,
  validateArtifactLevel,
  validateBuildStatus,
  validateTalentLevel,
} from '../../domain/builds/validation';
import { getDatabase } from './client';
import { BUNDLED_GAME_CATALOG } from '../importers/bundledCatalog';
import { resolveCatalogEntry } from '../../domain/catalog/identity';

export interface CharacterBuildRow {
  id: string;
  profile_id: string;
  character_id: string;
  status: string;
  account_weapon_id: string | null;
  planned_weapon_id?: string | null;
  weapon_target_level: number;
  character_target_level: number;
  normal_attack_level: number;
  normal_attack_target: number;
  elemental_skill_level: number;
  elemental_skill_target: number;
  elemental_burst_level: number;
  elemental_burst_target: number;
  farm_enabled: number;
  farm_priority?: number;
  farm_status?: string;
  character_target_ascension: number;
  weapon_target_ascension: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuildArtifactSlotRow {
  substats?: string;
  id: string;
  build_id: string;
  slot_key: string;
  set_id: string | null;
  main_stat: string | null;
  level: number;
  target_level: number;
  is_equipped: number;
  rarity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapArtifactSlotRow(row: BuildArtifactSlotRow): ArtifactSlot {
  return {
    id: row.id,
    buildId: row.build_id,
    slotKey: row.slot_key as ArtifactSlotKey,
    ...decodeSubstats(row.substats),
    setId: row.set_id,
    mainStat: row.main_stat,
    level: row.level,
    targetLevel: row.target_level,
    isEquipped: Boolean(row.is_equipped),
    rarity: row.rarity,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCharacterBuildRow(
  row: CharacterBuildRow,
  slots: ArtifactSlot[]
): CharacterBuild {
  const slotMap: Record<ArtifactSlotKey, ArtifactSlot> = {
    flower: createDefaultSlot(row.id, 'flower'),
    plume: createDefaultSlot(row.id, 'plume'),
    sands: createDefaultSlot(row.id, 'sands'),
    goblet: createDefaultSlot(row.id, 'goblet'),
    circlet: createDefaultSlot(row.id, 'circlet'),
  };

  for (const s of slots) {
    if (ARTIFACT_SLOT_KEYS.includes(s.slotKey)) {
      slotMap[s.slotKey] = s;
    }
  }

  return {
    id: row.id,
    profileId: row.profile_id,
    characterId: row.character_id,
    status: validateBuildStatus(row.status),
    farmEnabled: row.farm_enabled != null ? Boolean(row.farm_enabled) : true,
    farmPriority: row.farm_priority != null ? Number(row.farm_priority) : 0,
    farmStatus: (row.farm_status as 'active' | 'paused' | 'completed') || 'active',
    accountWeaponId: row.account_weapon_id,
    plannedWeaponId: row.planned_weapon_id ?? null,
    weaponTargetLevel: row.weapon_target_level,
    weaponTargetAscension: row.weapon_target_ascension != null ? Number(row.weapon_target_ascension) : 6,
    characterTargetLevel: row.character_target_level,
    characterTargetAscension: row.character_target_ascension != null ? Number(row.character_target_ascension) : 6,
    normalAttackLevel: row.normal_attack_level,
    normalAttackTarget: row.normal_attack_target,
    elementalSkillLevel: row.elemental_skill_level,
    elementalSkillTarget: row.elemental_skill_target,
    elementalBurstLevel: row.elemental_burst_level,
    elementalBurstTarget: row.elemental_burst_target,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    artifactSlots: slotMap,
  };
}

function createDefaultSlot(buildId: string, slotKey: ArtifactSlotKey): ArtifactSlot {
  const now = new Date().toISOString();
  return {
    id: `slot_${buildId}_${slotKey}`,
    buildId,
    slotKey,
    setId: null,
    mainStat: slotKey === 'flower' ? 'Vida (HP)' : slotKey === 'plume' ? 'Ataque (ATK)' : null,
    level: 0,
    targetLevel: 20,
    isEquipped: false,
    rarity: 5,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

export interface IBuildsRepository {
  getProfileBuilds(profileId: string): Promise<CharacterBuild[]>;
  getCharacterBuild(profileId: string, characterId: string): Promise<CharacterBuild | null>;
  upsertCharacterBuild(
    profileId: string,
    characterId: string,
    input: UpdateCharacterBuildInput
  ): Promise<CharacterBuild>;
  toggleFarmEnabled(profileId: string, characterId: string): Promise<CharacterBuild>;
  updateArtifactSlot(
    buildId: string,
    slotKey: ArtifactSlotKey,
    input: UpdateArtifactSlotInput
  ): Promise<ArtifactSlot>;
  saveFullBuild(
    profileId: string,
    characterId: string,
    buildInput: UpdateCharacterBuildInput,
    slotsInput: Record<ArtifactSlotKey, UpdateArtifactSlotInput>
  ): Promise<CharacterBuild>;
  deleteBuild(id: string): Promise<boolean>;
  updateFarmPriority(profileId: string, characterId: string, priority: number): Promise<void>;
  updateFarmStatus(profileId: string, characterId: string, status: 'active' | 'paused' | 'completed'): Promise<void>;
  reorderFarmPriorities(profileId: string, characterIdsInOrder: string[]): Promise<void>;
}

export class SqliteBuildsRepository implements IBuildsRepository {
  public async getProfileBuilds(profileId: string): Promise<CharacterBuild[]> {
    const db = await getDatabase();
    const buildRows = await db.select<CharacterBuildRow[]>(
      'SELECT * FROM character_builds WHERE profile_id = $1',
      [profileId]
    );

    if (!buildRows || buildRows.length === 0) {
      return [];
    }

    const builds: CharacterBuild[] = [];
    for (const row of buildRows) {
      const slotRows = await db.select<BuildArtifactSlotRow[]>(
        'SELECT * FROM build_artifact_slots WHERE build_id = $1',
        [row.id]
      );
      const slots = (slotRows || []).map(mapArtifactSlotRow);
      builds.push(mapCharacterBuildRow(row, slots));
    }

    return builds;
  }

  public async getCharacterBuild(
    profileId: string,
    characterId: string
  ): Promise<CharacterBuild | null> {
    const db = await getDatabase();
    const rows = await db.select<CharacterBuildRow[]>(
      'SELECT * FROM character_builds WHERE profile_id = $1 AND character_id = $2',
      [profileId, characterId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const buildRow = rows[0];
    const slotRows = await db.select<BuildArtifactSlotRow[]>(
      'SELECT * FROM build_artifact_slots WHERE build_id = $1',
      [buildRow.id]
    );
    const slots = (slotRows || []).map(mapArtifactSlotRow);
    return mapCharacterBuildRow(buildRow, slots);
  }

  public async upsertCharacterBuild(
    profileId: string,
    characterId: string,
    input: UpdateCharacterBuildInput
  ): Promise<CharacterBuild> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await requireProfileTraveler(profileId, characterId);
    if (input.plannedWeaponId) {
      const character = resolveCatalogEntry(BUNDLED_GAME_CATALOG.characters, characterId, 'character');
      const weapon = resolveCatalogEntry(BUNDLED_GAME_CATALOG.weapons, input.plannedWeaponId, 'weapon');
      if (!character || !weapon || character.weaponType !== weapon.weaponType) throw new Error('Arma planejada incompatível com o personagem.');
      input = { ...input, plannedWeaponId: weapon.id };
    }

    const existing = await this.getCharacterBuild(profileId, characterId);

    if (existing) {
      const status = input.status !== undefined ? validateBuildStatus(input.status) : existing.status;
      const accountWeaponId = input.accountWeaponId !== undefined ? input.accountWeaponId : existing.accountWeaponId;
      const weaponTargetLevel = input.weaponTargetLevel !== undefined ? input.weaponTargetLevel : existing.weaponTargetLevel;
      const characterTargetLevel = input.characterTargetLevel !== undefined ? input.characterTargetLevel : existing.characterTargetLevel;
      const normalAttackLevel = input.normalAttackLevel !== undefined ? validateTalentLevel(input.normalAttackLevel, 'Ataque Normal') : existing.normalAttackLevel;
      const normalAttackTarget = input.normalAttackTarget !== undefined ? validateTalentLevel(input.normalAttackTarget, 'Alvo Ataque Normal') : existing.normalAttackTarget;
      const elementalSkillLevel = input.elementalSkillLevel !== undefined ? validateTalentLevel(input.elementalSkillLevel, 'Habilidade Elemental') : existing.elementalSkillLevel;
      const elementalSkillTarget = input.elementalSkillTarget !== undefined ? validateTalentLevel(input.elementalSkillTarget, 'Alvo Habilidade Elemental') : existing.elementalSkillTarget;
      const elementalBurstLevel = input.elementalBurstLevel !== undefined ? validateTalentLevel(input.elementalBurstLevel, 'Supremo') : existing.elementalBurstLevel;
      const elementalBurstTarget = input.elementalBurstTarget !== undefined ? validateTalentLevel(input.elementalBurstTarget, 'Alvo Supremo') : existing.elementalBurstTarget;
      const farmEnabled = input.farmEnabled !== undefined ? (input.farmEnabled ? 1 : 0) : (existing.farmEnabled ? 1 : 0);
      const farmPriority = input.farmPriority !== undefined ? input.farmPriority : existing.farmPriority;
      const farmStatus = input.farmStatus !== undefined ? input.farmStatus : existing.farmStatus;
      const characterTargetAscension = input.characterTargetAscension !== undefined ? input.characterTargetAscension : existing.characterTargetAscension;
      const weaponTargetAscension = input.weaponTargetAscension !== undefined ? input.weaponTargetAscension : existing.weaponTargetAscension;
      const notes = input.notes !== undefined ? input.notes : existing.notes;

      await db.execute(
        `UPDATE character_builds SET 
          status = $1, 
          account_weapon_id = $2, 
          weapon_target_level = $3, 
          character_target_level = $4, 
          normal_attack_level = $5, 
          normal_attack_target = $6, 
          elemental_skill_level = $7, 
          elemental_skill_target = $8, 
          elemental_burst_level = $9, 
          elemental_burst_target = $10, 
          farm_enabled = $11,
          farm_priority = $12,
          farm_status = $13,
          character_target_ascension = $14,
          weapon_target_ascension = $15,
          notes = $16, 
          updated_at = $17,
          planned_weapon_id = $18
        WHERE id = $19`,
        [
          status,
          accountWeaponId,
          weaponTargetLevel,
          characterTargetLevel,
          normalAttackLevel,
          normalAttackTarget,
          elementalSkillLevel,
          elementalSkillTarget,
          elementalBurstLevel,
          elementalBurstTarget,
          farmEnabled,
          farmPriority,
          farmStatus,
          characterTargetAscension,
          weaponTargetAscension,
          notes,
          now,
          input.plannedWeaponId !== undefined ? input.plannedWeaponId : existing.plannedWeaponId ?? null,
          existing.id,
        ]
      );

      const updated = await this.getCharacterBuild(profileId, characterId);
      if (!updated) throw new Error('Falha ao recuperar build atualizada.');
      return updated;
    }

    // Criar nova build
    const buildId = `build_${profileId}_${characterId}`;
    const status = validateBuildStatus(input.status ?? 'sem_build');
    const farmEnabled = input.farmEnabled !== undefined ? (input.farmEnabled ? 1 : 0) : 1;
    const farmPriority = input.farmPriority !== undefined ? input.farmPriority : 0;
    const farmStatus = input.farmStatus !== undefined ? input.farmStatus : 'active';
    const accountWeaponId = input.accountWeaponId ?? null;
    const weaponTargetLevel = input.weaponTargetLevel ?? 90;
    const weaponTargetAscension = input.weaponTargetAscension ?? 6;
    const characterTargetLevel = input.characterTargetLevel ?? 90;
    const characterTargetAscension = input.characterTargetAscension ?? 6;
    const normalAttackLevel = validateTalentLevel(input.normalAttackLevel ?? 1, 'Ataque Normal');
    const normalAttackTarget = validateTalentLevel(input.normalAttackTarget ?? 8, 'Alvo Ataque Normal');
    const elementalSkillLevel = validateTalentLevel(input.elementalSkillLevel ?? 1, 'Habilidade Elemental');
    const elementalSkillTarget = validateTalentLevel(input.elementalSkillTarget ?? 8, 'Alvo Habilidade Elemental');
    const elementalBurstLevel = validateTalentLevel(input.elementalBurstLevel ?? 1, 'Supremo');
    const elementalBurstTarget = validateTalentLevel(input.elementalBurstTarget ?? 8, 'Alvo Supremo');
    const notes = input.notes ?? null;

    await db.execute(
      `INSERT INTO character_builds (
        id, profile_id, character_id, status, account_weapon_id,
        weapon_target_level, character_target_level,
        normal_attack_level, normal_attack_target,
        elemental_skill_level, elemental_skill_target,
        elemental_burst_level, elemental_burst_target,
        farm_enabled, farm_priority, farm_status,
        character_target_ascension, weapon_target_ascension,
        notes, created_at, updated_at, planned_weapon_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        buildId,
        profileId,
        characterId,
        status,
        accountWeaponId,
        weaponTargetLevel,
        characterTargetLevel,
        normalAttackLevel,
        normalAttackTarget,
        elementalSkillLevel,
        elementalSkillTarget,
        elementalBurstLevel,
        elementalBurstTarget,
        farmEnabled,
        farmPriority,
        farmStatus,
        characterTargetAscension,
        weaponTargetAscension,
        notes,
        now,
        now,
        input.plannedWeaponId ?? null,
      ]
    );

    // Inicializa os 5 slots de artefatos
    for (const key of ARTIFACT_SLOT_KEYS) {
      const slotId = `slot_${buildId}_${key}`;
      const defaultMainStat = key === 'flower' ? 'Vida (HP)' : key === 'plume' ? 'Ataque (ATK)' : null;
      await db.execute(
        `INSERT INTO build_artifact_slots (
          id, build_id, slot_key, set_id, main_stat, level, target_level, is_equipped, rarity, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          slotId,
          buildId,
          key,
          null,
          defaultMainStat,
          0,
          20,
          0,
          5,
          null,
          now,
          now,
        ]
      );
    }

    const created = await this.getCharacterBuild(profileId, characterId);
    if (!created) throw new Error('Falha ao criar build de personagem.');
    return created;
  }

  public async updateArtifactSlot(
    buildId: string,
    slotKey: ArtifactSlotKey,
    input: UpdateArtifactSlotInput
  ): Promise<ArtifactSlot> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const substats = input.substats === undefined ? undefined : validateArtifactSubstats(input.substats);
    const existingRows = await db.select<BuildArtifactSlotRow[]>(
      'SELECT * FROM build_artifact_slots WHERE build_id = $1 AND slot_key = $2',
      [buildId, slotKey]
    );

    if (!existingRows || existingRows.length === 0) {
      // Cria o slot se não existir
      const slotId = `slot_${buildId}_${slotKey}`;
      const setId = input.setId ?? null;
      const mainStat = input.mainStat ?? (slotKey === 'flower' ? 'Vida (HP)' : slotKey === 'plume' ? 'Ataque (ATK)' : null);
      const level = validateArtifactLevel(input.level ?? 0);
      const targetLevel = validateArtifactLevel(input.targetLevel ?? 20);
      const isEquipped = input.isEquipped ? 1 : 0;
      const rarity = input.rarity ?? 5;
      const notes = input.notes ?? null;

      await db.execute(
        `INSERT INTO build_artifact_slots (
          id, build_id, slot_key, set_id, main_stat, level, target_level, is_equipped, rarity, notes, created_at, updated_at, substats
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [slotId, buildId, slotKey, setId, mainStat, level, targetLevel, isEquipped, rarity, notes, now, now, encodeSubstats(substats, input.substatValues)]
      );

      return {
        id: slotId,
        buildId,
        slotKey,
        substats: substats ?? [],
        substatValues: validateSubstatValues(substats ?? [], input.substatValues),
        setId,
        mainStat,
        level,
        targetLevel,
        isEquipped: Boolean(isEquipped),
        rarity,
        notes,
        createdAt: now,
        updatedAt: now,
      };
    }

    const current = existingRows[0];
    const previous = decodeSubstats(current.substats);
    const savedSubstats = substats ?? previous.substats;
    const savedValues = validateSubstatValues(savedSubstats, input.substatValues ?? Object.fromEntries(Object.entries(previous.substatValues).filter(([key]) => savedSubstats.includes(key as import('../../domain/builds/substats').ArtifactSubstat))));
    const setId = input.setId !== undefined ? input.setId : current.set_id;
    const mainStat = input.mainStat !== undefined ? input.mainStat : current.main_stat;
    const level = input.level !== undefined ? validateArtifactLevel(input.level) : current.level;
    const targetLevel = input.targetLevel !== undefined ? validateArtifactLevel(input.targetLevel) : current.target_level;
    const isEquipped = input.isEquipped !== undefined ? (input.isEquipped ? 1 : 0) : current.is_equipped;
    const rarity = input.rarity !== undefined ? input.rarity : current.rarity;
    const notes = input.notes !== undefined ? input.notes : current.notes;

    await db.execute(
      `UPDATE build_artifact_slots SET
        set_id = $1,
        main_stat = $2,
        level = $3,
        target_level = $4,
        is_equipped = $5,
        rarity = $6,
        notes = $7,
        updated_at = $8,
        substats = $9
      WHERE build_id = $10 AND slot_key = $11`,
      [setId, mainStat, level, targetLevel, isEquipped, rarity, notes, now, encodeSubstats(savedSubstats, savedValues), buildId, slotKey]
    );

    return {
      id: current.id,
      substats: savedSubstats,
      substatValues: savedValues,
      buildId,
      slotKey,
      setId,
      mainStat,
      level,
      targetLevel,
      isEquipped: Boolean(isEquipped),
      rarity,
      notes,
      createdAt: current.created_at,
      updatedAt: now,
    };
  }

  public async toggleFarmEnabled(profileId: string, characterId: string): Promise<CharacterBuild> {
    const existing = await this.getCharacterBuild(profileId, characterId);
    const currentEnabled = existing ? existing.farmEnabled : true;
    return this.upsertCharacterBuild(profileId, characterId, {
      farmEnabled: !currentEnabled,
    });
  }

  public async saveFullBuild(
    profileId: string,
    characterId: string,
    buildInput: UpdateCharacterBuildInput,
    slotsInput: Record<ArtifactSlotKey, UpdateArtifactSlotInput>
  ): Promise<CharacterBuild> {
    for (const key of ARTIFACT_SLOT_KEYS) encodeSubstats(slotsInput[key]?.substats, slotsInput[key]?.substatValues);
    const build = await this.upsertCharacterBuild(profileId, characterId, buildInput);
    for (const key of ARTIFACT_SLOT_KEYS) {
      if (slotsInput[key]) {
        await this.updateArtifactSlot(build.id, key, slotsInput[key]);
      }
    }
    const full = await this.getCharacterBuild(profileId, characterId);
    if (!full) throw new Error('Falha ao recuperar build atualizada.');
    return full;
  }

  public async deleteBuild(id: string): Promise<boolean> {
    const db = await getDatabase();
    const res = await db.execute('DELETE FROM character_builds WHERE id = $1', [id]);
    return res.rowsAffected > 0;
  }

  public async updateFarmPriority(profileId: string, characterId: string, priority: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const res = await db.execute(
      'UPDATE character_builds SET farm_priority = $1, updated_at = $2 WHERE profile_id = $3 AND character_id = $4',
      [priority, now, profileId, characterId]
    );
    if (res.rowsAffected === 0) {
      await this.upsertCharacterBuild(profileId, characterId, {
        farmPriority: priority,
        farmEnabled: true,
      });
    }
  }

  public async updateFarmStatus(profileId: string, characterId: string, status: 'active' | 'paused' | 'completed'): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const res = await db.execute(
      'UPDATE character_builds SET farm_status = $1, updated_at = $2 WHERE profile_id = $3 AND character_id = $4',
      [status, now, profileId, characterId]
    );
    if (res.rowsAffected === 0) {
      await this.upsertCharacterBuild(profileId, characterId, {
        farmStatus: status,
        farmEnabled: status !== 'completed',
      });
    }
  }

  public async reorderFarmPriorities(profileId: string, characterIdsInOrder: string[]): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    for (let i = 0; i < characterIdsInOrder.length; i++) {
      const charId = characterIdsInOrder[i];
      const res = await db.execute(
        'UPDATE character_builds SET farm_priority = $1, updated_at = $2 WHERE profile_id = $3 AND character_id = $4',
        [i, now, profileId, charId]
      );
      if (res.rowsAffected === 0) {
        await this.upsertCharacterBuild(profileId, charId, {
          farmPriority: i,
          farmEnabled: true,
        });
      }
    }
  }
}

export const buildsRepository: IBuildsRepository = new SqliteBuildsRepository();
