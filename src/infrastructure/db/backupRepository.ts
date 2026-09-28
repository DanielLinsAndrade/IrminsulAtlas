import { validateBilletStock } from '../../domain/weapons/collection';
import { sanitizeTravelerBackup } from '../../domain/backup/travelerBackup';
import { encodeSubstats } from '../../domain/builds/substats';
import {
  createWishLogBackup,
  type ProfileAchievementBackup,
  type ProfileBackupData,
  type RestoreBackupResult,
  type RestoreConflictStrategy,
  type RestoreProfileResult,
  type WishLogBackup,
} from '../../domain/backup';
import type { BannerType } from '../../domain/wishes/types';
import { CATALOG_IDS } from '../../domain/achievements/seedData';
import { buildsRepository } from './buildsRepository';
import { charactersRepository } from './charactersRepository';
import { getDatabaseInstance } from './client';
import { inventoryRepository } from './inventoryRepository';
import { profilesRepository } from './profilesRepository';
import { weaponsRepository } from './weaponsRepository';
import { wishGoalsRepository } from './wishGoalsRepository';
import { wishesRepository } from './wishesRepository';
import { validateWeaponFate, validateWeaponPath } from '../../domain/wishes/weaponFate';
import { appSettingsRepository } from './appSettingsRepository';
import { mergeInventoryAliases } from './materialIdentity';
import { BUNDLED_GAME_CATALOG } from '../importers/bundledCatalog';
import { validateCombatStats } from '../../domain/characters/combatStats';
import { validateCollectionTargets } from '../../domain/weapons/collection';
import { weaponCollectionRepository } from './weaponCollectionRepository';
import type { SqlStatement } from './types';

export class BackupRepository {
  public async exportProfileData(profileId: string): Promise<ProfileBackupData> {
    const profile = await profilesRepository.getProfileById(profileId);
    if (!profile) {
      throw new Error(`Perfil com ID "${profileId}" não encontrado.`);
    }

    const [
      resources,
      inventory,
      characters,
      weapons,
      builds,
      wishes,
      bannerCurrentPity,
      goals,
    ] = await Promise.all([
      inventoryRepository.getResources(profileId),
      inventoryRepository.getInventory(profileId),
      charactersRepository.getAccountCharacters(profileId),
      weaponsRepository.getAccountWeapons(profileId),
      buildsRepository.getProfileBuilds(profileId),
      wishesRepository.getWishesByProfile(profileId),
      wishesRepository.getBannerCurrentPity(profileId),
      wishGoalsRepository.getGoalsByProfile(profileId),
    ]);

    const db = await getDatabaseInstance();
    const achRows = await db.select<
      Array<{
        achievement_id: string;
        completed: number;
        completed_at: string | null;
        notes: string | null;
      }>
    >(
      'SELECT achievement_id, completed, completed_at, notes FROM profile_achievements WHERE profile_id = $1',
      [profileId]
    );

    const achievements: ProfileAchievementBackup[] = (achRows || []).filter(r => CATALOG_IDS.has(r.achievement_id)).map((r) => ({
      achievementId: r.achievement_id,
      completed: Boolean(r.completed),
      completedAt: r.completed_at,
      notes: r.notes,
    }));

    return {
      capturingRadianceOverride: await appSettingsRepository.getSetting(`capturing_radiance:${profileId}`).then(value => value === null ? null : Number(value)),
      travelerArchive: JSON.parse(await appSettingsRepository.getSetting(`traveler_archive:${profileId}`) ?? '[]'),
      weaponBilletStock: await weaponCollectionRepository.getStock(profileId),
      weaponCollectionTargets: await weaponCollectionRepository.getTargets(profileId),
      profile,
      resources,
      inventory,
      characters,
      weapons,
      builds,
      wishes,
      bannerCurrentPity,
      goals,
      achievements,
    };
  }

  public async exportFullBackup(profileIds?: string[]): Promise<WishLogBackup> {
    let targetIds = profileIds;
    if (!targetIds || targetIds.length === 0) {
      const all = await profilesRepository.getAllProfiles();
      targetIds = all.map((p) => p.id);
    }

    const profilesData: ProfileBackupData[] = [];
    for (const pid of targetIds) {
      const data = await this.exportProfileData(pid);
      profilesData.push(data);
    }

    return createWishLogBackup(profilesData);
  }

  public async restoreProfile(
    pData: ProfileBackupData,
    strategy: RestoreConflictStrategy
  ): Promise<RestoreProfileResult> {
    const database = await getDatabaseInstance();
    const statements: SqlStatement[] = [];
    // Stage all writes before committing on one connection, including profile settings.
    const db = { execute: async (query: string, bindValues?: unknown[]) => {
      statements.push({ query, bindValues });
    } };
    const setSetting = (key: string, value: string) => db.execute(
      'INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [key, value]
    );
    const existing = await profilesRepository.getProfileById(pData.profile.id);

    if (existing && strategy === 'skip') {
      return {
        originalProfileId: pData.profile.id,
        finalProfileId: pData.profile.id,
        profileName: pData.profile.name,
        action: 'skipped',
        counts: {
          wishes: 0,
          characters: 0,
          weapons: 0,
          builds: 0,
          goals: 0,
          achievements: 0,
        },
      };
    }

    pData = sanitizeTravelerBackup(pData);
    // Validate additive fields before any destructive overwrite of a profile.
    const billetStock = validateBilletStock(pData.weaponBilletStock);
    const collectionTargets = validateCollectionTargets(pData.weaponCollectionTargets);
    const ownedWeaponIds = new Set((pData.weapons ?? []).map(weapon => weapon.id));
    for (const character of pData.characters ?? []) validateCombatStats(character.combatStats);
    for (const build of pData.builds ?? []) {
      if (build.accountWeaponId && !ownedWeaponIds.has(build.accountWeaponId)) {
        throw new Error('Arma da build ausente nas armas deste perfil no backup. Nenhum dado foi alterado.');
      }
      for (const slot of Object.values(build.artifactSlots ?? {})) encodeSubstats(slot.substats, slot.substatValues);
      if (build.plannedWeaponId == null) continue;
      const weapon = BUNDLED_GAME_CATALOG.weapons.find(w => w.id === build.plannedWeaponId);
      const character = BUNDLED_GAME_CATALOG.characters.find(c => c.id === build.characterId);
      if (!weapon || !character || weapon.weaponType !== character.weaponType) throw new Error('Arma planejada inválida ou incompatível no backup.');
    }
    const captureOverride = pData.capturingRadianceOverride ?? null;
    if (captureOverride !== null && (!Number.isInteger(captureOverride) || captureOverride < 0 || captureOverride > 4)) throw new Error('Pontos de Captura de Esplendor inválidos no backup.');
    for (const wish of pData.wishes ?? []) { validateWeaponFate(wish.bannerType, wish.weaponFateState); validateWeaponPath(wish.bannerType, wish.weaponPathResult); }
    const isCopy = Boolean(existing && strategy === 'create_copy');
    const targetProfileId = isCopy
      ? `prof_copy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      : pData.profile.id;

    const targetProfileName = isCopy ? `${pData.profile.name} (Cópia)` : pData.profile.name;
    const targetUid = isCopy ? null : pData.profile.uid;

    if (!isCopy) {
      // Limpa dados anteriores do perfil antes de sobrescrever
      await db.execute(
        'DELETE FROM build_artifact_slots WHERE build_id IN (SELECT id FROM character_builds WHERE profile_id = $1)',
        [targetProfileId]
      );
      await db.execute('DELETE FROM character_builds WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM profile_resources WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM inventory_items WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM account_characters WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM account_weapons WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM wish_entries WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM wish_goals WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM banner_pity_states WHERE profile_id = $1', [targetProfileId]);
      await db.execute('DELETE FROM profile_achievements WHERE profile_id = $1', [targetProfileId]);
    }

    // 1. Inserir ou atualizar perfil
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO profiles (
        id, name, uid, server, adventure_rank, world_level,
        traveler_gender, avatar_character_id, notes, created_at, updated_at, last_opened_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        uid = excluded.uid,
        server = excluded.server,
        adventure_rank = excluded.adventure_rank,
        world_level = excluded.world_level,
        traveler_gender = excluded.traveler_gender,
        avatar_character_id = excluded.avatar_character_id,
        notes = excluded.notes,
        updated_at = excluded.updated_at`,
      [
        targetProfileId,
        targetProfileName,
        targetUid,
        pData.profile.server ?? 'América',
        pData.profile.adventureRank ?? null,
        pData.profile.worldLevel ?? null,
        pData.profile.travelerGender ?? null,
        pData.profile.avatarCharacterId ?? null,
        pData.profile.notes ?? null,
        pData.profile.createdAt ?? now,
        now,
        pData.profile.lastOpenedAt ?? now,
      ]
    );

    // 2. Recursos
    await setSetting(`weapon_collection_targets:${targetProfileId}`, JSON.stringify(collectionTargets));
    await setSetting(`weapon_billet_stock:${targetProfileId}`, JSON.stringify(billetStock));
    if (captureOverride === null) await db.execute('DELETE FROM app_settings WHERE key = $1', [`capturing_radiance:${targetProfileId}`]);
    else await setSetting(`capturing_radiance:${targetProfileId}`, String(captureOverride));

    if (pData.resources) {
      await db.execute(
        `INSERT OR REPLACE INTO profile_resources (
          profile_id, primogems, intertwined_fates, acquaint_fates, starglitter, stardust, genesis_crystals, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          targetProfileId,
          pData.resources.primogems ?? 0,
          pData.resources.intertwinedFates ?? 0,
          pData.resources.acquaintFates ?? 0,
          pData.resources.starglitter ?? 0,
          pData.resources.stardust ?? 0,
          pData.resources.genesisCrystals ?? 0,
          pData.resources.updatedAt ?? now,
        ]
      );
    }

    // 3. Itens do Inventário
    if (pData.inventory && pData.inventory.length > 0) {
      for (const item of mergeInventoryAliases(pData.inventory)) {
        await db.execute(
          `INSERT OR REPLACE INTO inventory_items (profile_id, material_id, quantity, updated_at)
           VALUES ($1, $2, $3, $4)`,
          [targetProfileId, item.materialId, item.quantity, item.updatedAt ?? now]
        );
      }
    }

    // 4. Personagens da Conta
    if (pData.characters && pData.characters.length > 0) {
      for (const char of pData.characters) {
        const charRowId = isCopy ? `char_${targetProfileId}_${char.characterId}` : char.id;
        await db.execute(
          `INSERT INTO account_characters (
            id, profile_id, character_id, owned, constellation, level, ascension, friendship, notes, created_at, updated_at, combat_stats
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            charRowId,
            targetProfileId,
            char.characterId,
            char.owned ? 1 : 0,
            char.constellation ?? 0,
            char.level ?? 1,
            char.ascension ?? 0,
            char.friendship ?? null,
            char.notes ?? null,
            char.createdAt ?? now,
            char.updatedAt ?? now,
            char.combatStats ? JSON.stringify(validateCombatStats(char.combatStats)) : null,
          ]
        );
      }
    }

    // 5. Armas da Conta
    const weaponIdMap = new Map<string, string>();
    if (pData.weapons && pData.weapons.length > 0) {
      for (const weap of pData.weapons) {
        const newWeapId = isCopy
          ? `weap_${targetProfileId}_${weap.instanceNo}_${weap.weaponId}`
          : weap.id;
        weaponIdMap.set(weap.id, newWeapId);

        await db.execute(
          `INSERT INTO account_weapons (
            id, profile_id, weapon_id, instance_no, level, ascension, refinement,
            equipped_character_id, favorite, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            newWeapId,
            targetProfileId,
            weap.weaponId,
            weap.instanceNo ?? 1,
            weap.level ?? 1,
            weap.ascension ?? 0,
            weap.refinement ?? 1,
            weap.equippedCharacterId ?? null,
            weap.favorite ? 1 : 0,
            weap.notes ?? null,
            weap.createdAt ?? now,
            weap.updatedAt ?? now,
          ]
        );
      }
    }

    // 6. Builds de Personagens e Slots de Artefatos
    if (pData.builds && pData.builds.length > 0) {
      for (const build of pData.builds) {
        const newBuildId = isCopy
          ? `build_${targetProfileId}_${build.characterId}`
          : build.id;
        const mappedWeaponId = build.accountWeaponId
          ? weaponIdMap.get(build.accountWeaponId) ?? build.accountWeaponId
          : null;

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
            newBuildId,
            targetProfileId,
            build.characterId,
            build.status ?? 'sem_build',
            mappedWeaponId,
            build.weaponTargetLevel ?? 90,
            build.characterTargetLevel ?? 90,
            build.normalAttackLevel ?? 1,
            build.normalAttackTarget ?? 8,
            build.elementalSkillLevel ?? 1,
            build.elementalSkillTarget ?? 8,
            build.elementalBurstLevel ?? 1,
            build.elementalBurstTarget ?? 8,
            build.farmEnabled ? 1 : 0,
            build.farmPriority ?? 0,
            build.farmStatus ?? 'active',
            build.characterTargetAscension ?? 6,
            build.weaponTargetAscension ?? 6,
            build.notes ?? null,
            build.createdAt ?? now,
            build.updatedAt ?? now,
            build.plannedWeaponId ?? null,
          ]
        );

        // Slots de artefatos da build
        if (build.artifactSlots) {
          const slots = Object.values(build.artifactSlots);
          for (const slot of slots) {
            const slotId = `slot_${newBuildId}_${slot.slotKey}`;
            await db.execute(
              `INSERT INTO build_artifact_slots (
                id, build_id, slot_key, set_id, main_stat, level, target_level, is_equipped, rarity, notes, created_at, updated_at, substats
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                slotId,
                newBuildId,
                slot.slotKey,
                slot.setId ?? null,
                slot.mainStat ?? null,
                slot.level ?? 0,
                slot.targetLevel ?? 20,
                slot.isEquipped ? 1 : 0,
                slot.rarity ?? 5,
                slot.notes ?? null,
                slot.createdAt ?? now,
                slot.updatedAt ?? now,
                encodeSubstats(slot.substats, slot.substatValues),
              ]
            );
          }
        }
      }
    }

    // 7. Tiros (Wishes)
    if (pData.wishes && pData.wishes.length > 0) {
      for (const wish of pData.wishes) {
        const wishId = isCopy
          ? `wish_${targetProfileId}_${wish.sequenceNo}_${Math.random().toString(36).substring(2, 6)}`
          : wish.id;

        await db.execute(
          `INSERT INTO wish_entries (
            id, profile_id, occurred_at, game_version_id, banner_type, banner_name,
            item_type, item_id, item_name, rarity, pity_index, sequence_no,
            is_featured, won_pity_rate, rule_set_id, notes, created_at, updated_at, weapon_fate_state, weapon_path_result
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            wishId,
            targetProfileId,
            wish.occurredAt,
            wish.gameVersionId ?? null,
            wish.bannerType,
            wish.bannerName ?? null,
            wish.itemType,
            wish.itemId,
            wish.itemName,
            wish.rarity,
            wish.pityIndex ?? 1,
            wish.sequenceNo ?? 0,
            wish.isFeatured ? 1 : 0,
            wish.wonPityRate ? 1 : 0,
            wish.ruleSetId ?? null,
            wish.notes ?? null,
            wish.createdAt ?? now,
            wish.updatedAt ?? now,
            wish.weaponFateState ?? null,
            wish.weaponPathResult ?? null,
          ]
        );
      }
    }

    // 8. Pity Atual Independente dos Banners
    if (pData.bannerCurrentPity) {
      const bannerTypes: BannerType[] = ['character', 'weapon', 'standard', 'chronicled'];
      for (const bType of bannerTypes) {
        const pityObj = pData.bannerCurrentPity[bType];
        if (pityObj) {
          await db.execute(
            `INSERT INTO banner_pity_states (
              id, profile_id, banner_type, current_5star_pity, current_4star_pity, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT(profile_id, banner_type) DO UPDATE SET
              current_5star_pity = excluded.current_5star_pity,
              current_4star_pity = excluded.current_4star_pity,
              updated_at = excluded.updated_at`,
            [
              `pity_${targetProfileId}_${bType}`,
              targetProfileId,
              bType,
              pityObj.current5StarPity ?? 0,
              pityObj.current4StarPity ?? 0,
              pityObj.updatedAt ?? now,
            ]
          );
        }
      }
    }

    // 9. Metas de Desejos
    if (pData.goals && pData.goals.length > 0) {
      for (const goal of pData.goals) {
        const goalId = isCopy
          ? `goal_${targetProfileId}_${Math.random().toString(36).substring(2, 8)}`
          : goal.id;

        await db.execute(
          `INSERT INTO wish_goals (
            id, profile_id, target_type, target_id, target_name, target_rank,
            priority, status, expected_version_id, reserved_wishes, notes, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            goalId,
            targetProfileId,
            goal.targetType,
            goal.targetId,
            goal.targetName,
            goal.targetRank ?? 0,
            goal.priority ?? 1,
            goal.status ?? 'planning',
            goal.expectedVersionId ?? null,
            goal.reservedWishes ?? 0,
            goal.notes ?? null,
            goal.sortOrder ?? 0,
            goal.createdAt ?? now,
            goal.updatedAt ?? now,
          ]
        );
      }
    }

    await setSetting(`traveler_archive:${targetProfileId}`, JSON.stringify(pData.travelerArchive ?? []));

    // 10. Conquistas Concluídas
    if (pData.achievements && pData.achievements.length > 0) {
      for (const ach of pData.achievements) {
        if (!CATALOG_IDS.has(ach.achievementId)) continue;
        await db.execute(
          `INSERT INTO profile_achievements (
            profile_id, achievement_id, completed, completed_at, notes
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT(profile_id, achievement_id) DO UPDATE SET
            completed = excluded.completed,
            completed_at = excluded.completed_at,
            notes = excluded.notes`,
          [
            targetProfileId,
            ach.achievementId,
            ach.completed ? 1 : 0,
            ach.completedAt ?? (ach.completed ? now : null),
            ach.notes ?? null,
          ]
        );
      }
    }

    if (!database.executeBatch) throw new Error('Banco sem suporte a restauração atômica. Nenhum dado foi alterado.');
    await database.executeBatch(statements);

    return {
      originalProfileId: pData.profile.id,
      finalProfileId: targetProfileId,
      profileName: targetProfileName,
      action: isCopy ? 'created' : existing ? 'overwritten' : 'created',
      counts: {
        wishes: pData.wishes?.length ?? 0,
        characters: pData.characters?.length ?? 0,
        weapons: pData.weapons?.length ?? 0,
        builds: pData.builds?.length ?? 0,
        goals: pData.goals?.length ?? 0,
        achievements: pData.achievements?.filter(ach => CATALOG_IDS.has(ach.achievementId)).length ?? 0,
      },
    };
  }

  public async restoreBackup(
    backup: WishLogBackup,
    strategy: RestoreConflictStrategy
  ): Promise<RestoreBackupResult> {
    const results: RestoreProfileResult[] = [];
    const errors: string[] = [];

    for (const pData of backup.profiles) {
      try {
        const res = await this.restoreProfile(pData, strategy);
        results.push(res);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Falha ao restaurar perfil "${pData.profile?.name ?? 'desconhecido'}": ${msg}`);
      }
    }

    return {
      success: errors.length === 0,
      strategyUsed: strategy,
      restoredAt: new Date().toISOString(),
      profiles: results,
      errors,
    };
  }
}

export const backupRepository = new BackupRepository();
