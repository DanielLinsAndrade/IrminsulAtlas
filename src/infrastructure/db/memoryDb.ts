import { travelerIdentity } from '../../domain/profiles/traveler';
import type { AppSettingRow, IDatabase, ProfileRow, QueryResult, SchemaMetadataRow, SqlStatement } from './types';

/**
 * Emulador em memória do SQLite compatível com a interface IDatabase.
 * Utilizado para testes unitários automatizados e execução em modo navegador (sem backend Tauri).
 */
export class InMemoryDatabase implements IDatabase {
  async executeBatch(statements: SqlStatement[]): Promise<void> {
    const snapshots = Object.values(this).filter(value => value instanceof Map)
      .map(map => ({ map, entries: structuredClone([...map.entries()]) }));
    try {
      for (const statement of statements) await this.execute(statement.query, statement.bindValues);
    } catch (error) {
      for (const { map, entries } of snapshots) {
        map.clear();
        for (const [key, value] of entries) map.set(key, value);
      }
      throw error;
    }
  }
  private schemaMetadata = new Map<string, SchemaMetadataRow>();
  private appSettings = new Map<string, AppSettingRow>();
  private profiles = new Map<string, ProfileRow>();
  private assetCache = new Map<string, Record<string, unknown>>();
  private characters = new Map<string, Record<string, unknown>>();
  private weapons = new Map<string, Record<string, unknown>>();
  private materials = new Map<string, Record<string, unknown>>();
  private artifactSets = new Map<string, Record<string, unknown>>();
  private catalogMetadata = new Map<string, { key: string; value: string; updated_at: string }>();
  private profileResources = new Map<
    string,
    {
      profile_id: string;
      primogems: number;
      intertwined_fates: number;
      acquaint_fates: number;
      starglitter: number;
      stardust: number;
      genesis_crystals: number;
      updated_at: string;
    }
  >();
  private inventoryItems = new Map<
    string,
    {
      profile_id: string;
      material_id: string;
      quantity: number;
      updated_at: string;
    }
  >();
  private accountCharacters = new Map<
    string,
    {
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
  >();
  private accountWeapons = new Map<
    string,
    {
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
  >();
  private characterBuilds = new Map<
    string,
    {
      id: string;
      profile_id: string;
      character_id: string;
      status: string;
      farm_enabled: number;
      farm_priority: number;
      farm_status: string;
      account_weapon_id: string | null;
      planned_weapon_id: string | null;
      weapon_target_level: number;
      weapon_target_ascension: number;
      character_target_level: number;
      character_target_ascension: number;
      normal_attack_level: number;
      normal_attack_target: number;
      elemental_skill_level: number;
      elemental_skill_target: number;
      elemental_burst_level: number;
      elemental_burst_target: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }
  >();
  private buildArtifactSlots = new Map<
    string,
    {
      id: string;
      build_id: string;
      slot_key: string;
      set_id: string | null;
      main_stat: string | null;
      substats?: string;
      level: number;
      target_level: number;
      is_equipped: number;
      rarity: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }
  >();
  private wishRuleSets = new Map<string, Record<string, unknown>>();
  private wishEntries = new Map<string, Record<string, unknown>>();
  private wishGoals = new Map<string, Record<string, unknown>>();
  private achievements = new Map<string, Record<string, unknown>>();
  private profileAchievements = new Map<string, Record<string, unknown>>();
  private bannerPityStates = new Map<
    string,
    {
      id: string;
      profile_id: string;
      banner_type: string;
      current_5star_pity: number;
      current_4star_pity: number;
      updated_at: string;
    }
  >();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults(): void {
    const now = new Date().toISOString();
    this.schemaMetadata.set('schema_version', {
      key: 'schema_version',
      value: '12',
      updated_at: now,
    });
    this.schemaMetadata.set('spec_version', {
      key: 'spec_version',
      value: '1.0',
      updated_at: now,
    });

    this.wishRuleSets.set('rule_character', {
      id: 'rule_character',
      game_key: 'character_event',
      name: 'Oração de Evento de Personagem',
      banner_type: 'character',
      hard_pity_5star: 90,
      soft_pity_5star: 74,
      hard_pity_4star: 10,
      soft_pity_4star: 8,
      base_rate_5star: 0.006,
      base_rate_4star: 0.051,
      featured_guarantee_system: '50_50',
      created_at: now,
    });
    this.wishRuleSets.set('rule_weapon', {
      id: 'rule_weapon',
      game_key: 'weapon_event',
      name: 'Oração de Evento de Arma',
      banner_type: 'weapon',
      hard_pity_5star: 80,
      soft_pity_5star: 63,
      hard_pity_4star: 10,
      soft_pity_4star: 7,
      base_rate_5star: 0.007,
      base_rate_4star: 0.060,
      featured_guarantee_system: 'epitomized_path',
      created_at: now,
    });
    this.wishRuleSets.set('rule_standard', {
      id: 'rule_standard',
      game_key: 'standard_wish',
      name: 'Oração Comum (Invocação do Mochileiro)',
      banner_type: 'standard',
      hard_pity_5star: 90,
      soft_pity_5star: 74,
      hard_pity_4star: 10,
      soft_pity_4star: 8,
      base_rate_5star: 0.006,
      base_rate_4star: 0.051,
      featured_guarantee_system: 'none',
      created_at: now,
    });
    this.wishRuleSets.set('rule_chronicled', {
      id: 'rule_chronicled',
      game_key: 'chronicled_wish',
      name: 'Oração de Registro',
      banner_type: 'chronicled',
      hard_pity_5star: 90,
      soft_pity_5star: 74,
      hard_pity_4star: 10,
      soft_pity_4star: 8,
      base_rate_5star: 0.006,
      base_rate_4star: 0.051,
      featured_guarantee_system: 'chronicled_fate',
      created_at: now,
    });
  }

  public reset(): void {
    this.schemaMetadata.clear();
    this.appSettings.clear();
    this.profiles.clear();
    this.assetCache.clear();
    this.characters.clear();
    this.weapons.clear();
    this.materials.clear();
    this.artifactSets.clear();
    this.catalogMetadata.clear();
    this.profileResources.clear();
    this.inventoryItems.clear();
    this.accountCharacters.clear();
    this.accountWeapons.clear();
    this.characterBuilds.clear();
    this.buildArtifactSlots.clear();
    this.wishRuleSets.clear();
    this.wishEntries.clear();
    this.wishGoals.clear();
    this.achievements.clear();
    this.profileAchievements.clear();
    this.bannerPityStates.clear();
    this.seedDefaults();
  }

  private selectTraveler(profileId: string, characterId: string): void {
    const gender = travelerIdentity(characterId);
    if (!gender) return;
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error('Perfil não encontrado.');
    if (profile.traveler_gender && profile.traveler_gender !== gender) throw new Error('Protagonista incompatível com o perfil.');
    profile.traveler_gender = gender;
  }

  private archiveTraveler(profile: ProfileRow): void {
    const wrong = (id: string | null) => id && travelerIdentity(id) && travelerIdentity(id) !== profile.traveler_gender;
    const characters = [...this.accountCharacters.values()].filter(row => row.profile_id === profile.id && wrong(row.character_id));
    const builds = [...this.characterBuilds.values()].filter(row => row.profile_id === profile.id && wrong(row.character_id));
    const ids = new Set(builds.map(row => row.id));
    const slots = [...this.buildArtifactSlots.values()].filter(row => ids.has(row.build_id));
    const weapons = [...this.accountWeapons.values()].filter(row => row.profile_id === profile.id && wrong(row.equipped_character_id));
    if (characters.length || builds.length || weapons.length) {
      const key = 'traveler_archive:' + profile.id;
      const entries = JSON.parse(this.appSettings.get(key)?.value ?? '[]');
      const now = new Date().toISOString();
      entries.push({ archivedAt: now, characters, builds, slots, weapons });
      this.appSettings.set(key, { key, value: JSON.stringify(entries), updated_at: now });
      for (const [key, row] of this.accountCharacters) if (characters.includes(row)) this.accountCharacters.delete(key);
      for (const [key, row] of this.characterBuilds) if (ids.has(row.id)) this.characterBuilds.delete(key);
      for (const [key, row] of this.buildArtifactSlots) if (ids.has(row.build_id)) this.buildArtifactSlots.delete(key);
      for (const row of weapons) row.equipped_character_id = null;
    }
    if (wrong(profile.avatar_character_id)) profile.avatar_character_id = profile.traveler_gender ? 'character_' + profile.traveler_gender : null;
  }

  public async execute(query: string, bindValues?: unknown[]): Promise<QueryResult> {
    const normalized = query.trim().replace(/\s+/g, ' ');
    const params = bindValues ?? [];

    // 0. DDL de inicialização de tabelas e índices
    if (/^CREATE TABLE/i.test(normalized) || /^CREATE INDEX/i.test(normalized)) {
      return { rowsAffected: 0 };
    }

    // 1. schema_metadata
    if (/^INSERT (OR REPLACE |OR IGNORE )?INTO schema_metadata/i.test(normalized)) {
      let key = params[0] !== undefined ? String(params[0]) : '';
      let value = params[1] !== undefined ? String(params[1]) : '';
      if (!key) {
        const match = normalized.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i);
        if (match) {
          key = match[1];
          value = match[2];
        }
      }
      if (key) {
        const now = new Date().toISOString();
        if (/OR IGNORE/i.test(normalized) && this.schemaMetadata.has(key)) {
          return { rowsAffected: 0 };
        }
        this.schemaMetadata.set(key, { key, value, updated_at: now });
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 2. app_settings INSERT OR REPLACE
    if (/^INSERT OR REPLACE INTO app_settings/i.test(normalized)) {
      const key = String(params[0]);
      const value = String(params[1]);
      const now = new Date().toISOString();
      this.appSettings.set(key, { key, value, updated_at: now });
      return { rowsAffected: 1 };
    }

    // 3. app_settings DELETE
    if (/^DELETE FROM app_settings WHERE key = \$1/i.test(normalized)) {
      const key = String(params[0]);
      const deleted = this.appSettings.delete(key);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 4. profiles INSERT
    if (/^INSERT INTO profiles/i.test(normalized)) {
      const profile: ProfileRow = {
        id: String(params[0]),
        name: String(params[1]),
        uid: params[2] !== undefined && params[2] !== null ? String(params[2]) : null,
        server: params[3] !== undefined && params[3] !== null ? String(params[3]) : null,
        adventure_rank: params[4] !== undefined && params[4] !== null ? Number(params[4]) : null,
        world_level: params[5] !== undefined && params[5] !== null ? Number(params[5]) : null,
        traveler_gender: params[6] !== undefined && params[6] !== null ? String(params[6]) : null,
        avatar_character_id: params[7] !== undefined && params[7] !== null ? String(params[7]) : null,
        notes: params[8] !== undefined && params[8] !== null ? String(params[8]) : null,
        created_at: String(params[9] ?? new Date().toISOString()),
        updated_at: String(params[10] ?? new Date().toISOString()),
        last_opened_at: params[11] !== undefined && params[11] !== null ? String(params[11]) : null,
      };
      this.profiles.set(profile.id, profile);
      return { rowsAffected: 1 };
    }

    // 5. profiles UPDATE (full)
    if (/^UPDATE profiles SET name = \$1/i.test(normalized)) {
      const id = String(params[9]);
      const existing = this.profiles.get(id);
      if (!existing) {
        return { rowsAffected: 0 };
      }
      const updated: ProfileRow = {
        ...existing,
        name: String(params[0]),
        uid: params[1] !== undefined && params[1] !== null ? String(params[1]) : null,
        server: params[2] !== undefined && params[2] !== null ? String(params[2]) : null,
        adventure_rank: params[3] !== undefined && params[3] !== null ? Number(params[3]) : null,
        world_level: params[4] !== undefined && params[4] !== null ? Number(params[4]) : null,
        traveler_gender: params[5] !== undefined && params[5] !== null ? String(params[5]) : null,
        avatar_character_id: params[6] !== undefined && params[6] !== null ? String(params[6]) : null,
        notes: params[7] !== undefined && params[7] !== null ? String(params[7]) : null,
        updated_at: String(params[8] ?? new Date().toISOString()),
      };
      this.archiveTraveler(updated);
      this.profiles.set(id, updated);
      return { rowsAffected: 1 };
    }

    // 6. profiles UPDATE last_opened_at
    if (/^UPDATE profiles SET last_opened_at = \$1/i.test(normalized)) {
      const lastOpened = String(params[0]);
      const id = String(params[1]);
      const existing = this.profiles.get(id);
      if (!existing) {
        return { rowsAffected: 0 };
      }
      this.profiles.set(id, {
        ...existing,
        last_opened_at: lastOpened,
      });
      return { rowsAffected: 1 };
    }

    // 7. profiles DELETE
    if (/^DELETE FROM profiles WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const deleted = this.profiles.delete(id);
      this.profileResources.delete(id);
      for (const [k, item] of this.inventoryItems.entries()) {
        if (item.profile_id === id) {
          this.inventoryItems.delete(k);
        }
      }
      for (const [k, item] of this.accountCharacters.entries()) {
        if (item.profile_id === id) {
          this.accountCharacters.delete(k);
        }
      }
      for (const [k, item] of this.accountWeapons.entries()) {
        if (item.profile_id === id) {
          this.accountWeapons.delete(k);
        }
      }
      for (const [k, build] of this.characterBuilds.entries()) {
        if (build.profile_id === id) {
          for (const [slotK, slot] of this.buildArtifactSlots.entries()) {
            if (slot.build_id === build.id) {
              this.buildArtifactSlots.delete(slotK);
            }
          }
          this.characterBuilds.delete(k);
        }
      }
      for (const [k, state] of this.bannerPityStates.entries()) {
        if (state.profile_id === id) {
          this.bannerPityStates.delete(k);
        }
      }
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 8. asset_cache_metadata INSERT OR REPLACE
    if (/^INSERT OR REPLACE INTO asset_cache_metadata/i.test(normalized)) {
      const id = String(params[0]);
      const entityType = String(params[1]);
      const entityKey = String(params[2]);
      const variant = String(params[3]);
      const key = `${entityType}:${entityKey}:${variant}`;

      const row = {
        id,
        entity_type: entityType,
        entity_key: entityKey,
        variant,
        source_url: String(params[4]),
        local_path: params[5] !== undefined && params[5] !== null ? String(params[5]) : null,
        data_uri: null,
        etag: params[6] !== undefined && params[6] !== null ? String(params[6]) : null,
        last_modified: params[7] !== undefined && params[7] !== null ? String(params[7]) : null,
        downloaded_at: String(params[8] ?? new Date().toISOString()),
        last_checked_at: params[9] !== undefined && params[9] !== null ? String(params[9]) : null,
      };
      this.assetCache.set(key, row);
      return { rowsAffected: 1 };
    }

    // 9. asset_cache_metadata DELETE by key
    if (/^DELETE FROM asset_cache_metadata WHERE entity_type = \$1/i.test(normalized)) {
      const key = `${String(params[0])}:${String(params[1])}:${String(params[2])}`;
      const deleted = this.assetCache.delete(key);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 10. asset_cache_metadata DELETE all
    if (/^DELETE FROM asset_cache_metadata/i.test(normalized)) {
      const count = this.assetCache.size;
      this.assetCache.clear();
      return { rowsAffected: count };
    }

    // 11. characters INSERT (OR REPLACE / ON CONFLICT)
    if (/^INSERT (OR REPLACE )?INTO characters/i.test(normalized)) {
      const id = String(params[0]);
      const row = {
        id,
        game_key: String(params[1]),
        name_pt_br: String(params[2]),
        rarity: Number(params[3]),
        element: String(params[4]),
        weapon_type: String(params[5]),
        release_version_id: params[6] != null ? String(params[6]) : null,
        source_provider: String(params[7]),
        source_entry_id: params[8] != null ? String(params[8]) : null,
        icon_url: params[9] != null ? String(params[9]) : null,
        splash_url: params[10] != null ? String(params[10]) : null,
        region: params[11] != null ? String(params[11]) : null,
        max_constellation: params[12] != null ? Number(params[12]) : 6,
        supports_friendship: params[13] != null ? (params[13] ? 1 : 0) : 1,
        created_at: new Date().toISOString(),
      };
      this.characters.set(id, row);
      return { rowsAffected: 1 };
    }

    // 12. weapons INSERT (OR REPLACE / ON CONFLICT)
    if (/^INSERT (OR REPLACE )?INTO weapons/i.test(normalized)) {
      const id = String(params[0]);
      const row = {
        id,
        game_key: String(params[1]),
        name_pt_br: String(params[2]),
        rarity: Number(params[3]),
        weapon_type: String(params[4]),
        release_version_id: params[5] != null ? String(params[5]) : null,
        source_provider: String(params[6]),
        source_entry_id: params[7] != null ? String(params[7]) : null,
        icon_url: params[8] != null ? String(params[8]) : null,
        created_at: new Date().toISOString(),
      };
      this.weapons.set(id, row);
      return { rowsAffected: 1 };
    }

    // 13. materials INSERT (OR REPLACE / ON CONFLICT)
    if (/^INSERT (OR REPLACE )?INTO materials/i.test(normalized)) {
      const id = String(params[0]);
      const row = {
        id,
        game_key: String(params[1]),
        name_pt_br: String(params[2]),
        category: String(params[3]),
        rarity: params[4] != null ? Number(params[4]) : null,
        region: params[5] != null ? String(params[5]) : null,
        source_provider: String(params[6]),
        source_entry_id: params[7] != null ? String(params[7]) : null,
        icon_url: params[8] != null ? String(params[8]) : null,
        created_at: new Date().toISOString(),
      };
      this.materials.set(id, row);
      return { rowsAffected: 1 };
    }

    // 14. artifact_sets INSERT (OR REPLACE / ON CONFLICT)
    if (/^INSERT (OR REPLACE )?INTO artifact_sets/i.test(normalized)) {
      const id = String(params[0]);
      const row = {
        id,
        game_key: String(params[1]),
        name_pt_br: String(params[2]),
        rarities: String(params[3]),
        source_provider: String(params[4]),
        source_entry_id: params[5] != null ? String(params[5]) : null,
        icon_url: params[6] != null ? String(params[6]) : null,
        created_at: new Date().toISOString(),
      };
      this.artifactSets.set(id, row);
      return { rowsAffected: 1 };
    }

    // 15. catalog_metadata INSERT OR REPLACE
    if (/^INSERT OR REPLACE INTO catalog_metadata/i.test(normalized)) {
      const key = String(params[0]);
      const value = String(params[1]);
      this.catalogMetadata.set(key, {
        key,
        value,
        updated_at: new Date().toISOString(),
      });
      return { rowsAffected: 1 };
    }

    // 16. Catalog DELETE queries
    if (/^DELETE FROM characters/i.test(normalized)) {
      const count = this.characters.size;
      this.characters.clear();
      return { rowsAffected: count };
    }
    if (/^DELETE FROM weapons/i.test(normalized)) {
      const count = this.weapons.size;
      this.weapons.clear();
      return { rowsAffected: count };
    }
    if (/^DELETE FROM materials/i.test(normalized)) {
      const count = this.materials.size;
      this.materials.clear();
      return { rowsAffected: count };
    }
    if (/^DELETE FROM artifact_sets/i.test(normalized)) {
      const count = this.artifactSets.size;
      this.artifactSets.clear();
      return { rowsAffected: count };
    }
    if (/^DELETE FROM catalog_metadata/i.test(normalized)) {
      const count = this.catalogMetadata.size;
      this.catalogMetadata.clear();
      return { rowsAffected: count };
    }

    // 17. profile_resources INSERT OR REPLACE
    if (/^INSERT OR REPLACE INTO profile_resources/i.test(normalized)) {
      const profileId = String(params[0]);
      const row = {
        profile_id: profileId,
        primogems: Number(params[1]) || 0,
        intertwined_fates: Number(params[2]) || 0,
        acquaint_fates: Number(params[3]) || 0,
        starglitter: Number(params[4]) || 0,
        stardust: Number(params[5]) || 0,
        genesis_crystals: Number(params[6]) || 0,
        updated_at: String(params[7] ?? new Date().toISOString()),
      };
      this.profileResources.set(profileId, row);
      return { rowsAffected: 1 };
    }

    // 18. profile_resources DELETE
    if (/^DELETE FROM profile_resources WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const deleted = this.profileResources.delete(profileId);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 19. inventory_items INSERT OR REPLACE
    if (/^INSERT OR REPLACE INTO inventory_items/i.test(normalized)) {
      const profileId = String(params[0]);
      const materialId = String(params[1]);
      const quantity = Number(params[2]) || 0;
      const key = `${profileId}:${materialId}`;
      const row = {
        profile_id: profileId,
        material_id: materialId,
        quantity,
        updated_at: String(params[3] ?? new Date().toISOString()),
      };
      this.inventoryItems.set(key, row);
      return { rowsAffected: 1 };
    }

    // 20. inventory_items DELETE by profile and material
    if (/^DELETE FROM inventory_items WHERE profile_id = \$1 AND material_id = \$2/i.test(normalized)) {
      const key = `${String(params[0])}:${String(params[1])}`;
      const deleted = this.inventoryItems.delete(key);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 21. inventory_items DELETE by profile
    if (/^DELETE FROM inventory_items WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      let count = 0;
      for (const [k, item] of this.inventoryItems.entries()) {
        if (item.profile_id === profileId) {
          this.inventoryItems.delete(k);
          count++;
        }
      }
      return { rowsAffected: count };
    }

    // 22. account_characters INSERT OR REPLACE
    if (/^INSERT(?: OR REPLACE)? INTO account_characters/i.test(normalized)) {
      const id = String(params[0]);
      const profileId = String(params[1]);
      const characterId = String(params[2]);
      if (/^INSERT INTO/i.test(normalized) && [...this.accountCharacters.values()].some(row => row.id === id || (row.profile_id === profileId && row.character_id === characterId))) {
        throw new Error('UNIQUE constraint failed: account_characters');
      }
      this.selectTraveler(profileId, characterId);
      const key = `${profileId}:${characterId}`;
      const row = {
        id,
        profile_id: profileId,
        character_id: characterId,
        owned: params[3] ? 1 : 0,
        combat_stats: params[11] == null ? null : String(params[11]),
        constellation: Number(params[4]) || 0,
        level: Number(params[5]) || 1,
        ascension: Number(params[6]) || 0,
        friendship: params[7] !== null && params[7] !== undefined ? Number(params[7]) : null,
        notes: params[8] !== null && params[8] !== undefined ? String(params[8]) : null,
        created_at: String(params[9] ?? new Date().toISOString()),
        updated_at: String(params[10] ?? new Date().toISOString()),
      };
      this.accountCharacters.set(key, row);
      return { rowsAffected: 1 };
    }

    // 23. account_characters DELETE by profile and character
    if (/^DELETE FROM account_characters WHERE profile_id = \$1 AND character_id = \$2/i.test(normalized)) {
      const key = `${String(params[0])}:${String(params[1])}`;
      const deleted = this.accountCharacters.delete(key);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 24. account_characters DELETE by profile
    if (/^DELETE FROM account_characters WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      let count = 0;
      for (const [k, item] of this.accountCharacters.entries()) {
        if (item.profile_id === profileId) {
          this.accountCharacters.delete(k);
          count++;
        }
      }
      return { rowsAffected: count };
    }

    // 25. account_weapons INSERT OR REPLACE
    if (/^INSERT (OR REPLACE )?INTO account_weapons/i.test(normalized)) {
      const id = String(params[0]);
      const row = {
        id,
        profile_id: String(params[1]),
        weapon_id: String(params[2]),
        instance_no: Number(params[3]) || 1,
        level: Number(params[4]) || 1,
        ascension: Number(params[5]) || 0,
        refinement: Number(params[6]) || 1,
        equipped_character_id: params[7] != null ? String(params[7]) : null,
        favorite: params[8] ? 1 : 0,
        notes: params[9] != null ? String(params[9]) : null,
        created_at: String(params[10] ?? new Date().toISOString()),
        updated_at: String(params[11] ?? new Date().toISOString()),
      };
      this.accountWeapons.set(id, row);
      return { rowsAffected: 1 };
    }

    // 26. account_weapons UPDATE
    if (/^UPDATE account_weapons SET/i.test(normalized)) {
      const id = String(params[params.length - 1]);
      const existing = this.accountWeapons.get(id);
      if (existing) {
        if (/level = \$1/i.test(normalized)) {
          existing.level = Number(params[0]);
          existing.ascension = Number(params[1]);
          existing.refinement = Number(params[2]);
          existing.equipped_character_id = params[3] != null ? String(params[3]) : null;
          existing.favorite = params[4] ? 1 : 0;
          existing.notes = params[5] != null ? String(params[5]) : null;
          existing.updated_at = String(params[6]);
        } else if (/favorite = \$1/i.test(normalized)) {
          existing.favorite = params[0] ? 1 : 0;
          existing.updated_at = String(params[1]);
        } else if (/equipped_character_id = \$1/i.test(normalized)) {
          existing.equipped_character_id = params[0] != null ? String(params[0]) : null;
          existing.updated_at = String(params[1]);
        }
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 27. account_weapons DELETE by id
    if (/^DELETE FROM account_weapons WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const deleted = this.accountWeapons.delete(id);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 28. account_weapons DELETE by profile
    if (/^DELETE FROM account_weapons WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      let count = 0;
      for (const [k, item] of this.accountWeapons.entries()) {
        if (item.profile_id === profileId) {
          this.accountWeapons.delete(k);
          count++;
        }
      }
      return { rowsAffected: count };
    }

    // 29. character_builds INSERT OR REPLACE
    if (/^INSERT (OR REPLACE )?INTO character_builds/i.test(normalized)) {
      const id = String(params[0]);
      const profileId = String(params[1]);
      const characterId = String(params[2]);
      this.selectTraveler(profileId, characterId);
      const has21Params = params.length >= 21;
      const hasNewColumns = params.length >= 19;
      const row = {
        id,
        profile_id: profileId,
        character_id: characterId,
        status: String(params[3] ?? 'sem_build'),
        account_weapon_id: params[4] != null ? String(params[4]) : null,
        planned_weapon_id: params[21] != null ? String(params[21]) : null,
        weapon_target_level: Number(params[5]) || 90,
        character_target_level: Number(params[6]) || 90,
        normal_attack_level: Number(params[7]) || 1,
        normal_attack_target: Number(params[8]) || 8,
        elemental_skill_level: Number(params[9]) || 1,
        elemental_skill_target: Number(params[10]) || 8,
        elemental_burst_level: Number(params[11]) || 1,
        elemental_burst_target: Number(params[12]) || 8,
        farm_enabled: hasNewColumns ? (params[13] ? 1 : 0) : 1,
        farm_priority: has21Params ? Number(params[14]) || 0 : 0,
        farm_status: has21Params ? String(params[15] || 'active') : 'active',
        character_target_ascension: has21Params ? (Number(params[16]) || 6) : (hasNewColumns ? (Number(params[14]) || 6) : 6),
        weapon_target_ascension: has21Params ? (Number(params[17]) || 6) : (hasNewColumns ? (Number(params[15]) || 6) : 6),
        notes: has21Params
          ? (params[18] != null ? String(params[18]) : null)
          : (hasNewColumns
            ? (params[16] != null ? String(params[16]) : null)
            : (params[13] != null ? String(params[13]) : null)),
        created_at: String((has21Params ? params[19] : (hasNewColumns ? params[17] : params[14])) ?? new Date().toISOString()),
        updated_at: String((has21Params ? params[20] : (hasNewColumns ? params[18] : params[15])) ?? new Date().toISOString()),
      };
      this.characterBuilds.set(id, row);
      return { rowsAffected: 1 };
    }

    // 30a. character_builds UPDATE farm_priority
    if (/^UPDATE character_builds SET farm_priority = \$1/i.test(normalized)) {
      const priority = Number(params[0]) || 0;
      const updatedAt = String(params[1] ?? new Date().toISOString());
      const profileId = String(params[2]);
      const characterId = String(params[3]);
      for (const row of this.characterBuilds.values()) {
        if (row.profile_id === profileId && row.character_id === characterId) {
          row.farm_priority = priority;
          row.updated_at = updatedAt;
          return { rowsAffected: 1 };
        }
      }
      return { rowsAffected: 0 };
    }

    // 30b. character_builds UPDATE farm_status
    if (/^UPDATE character_builds SET farm_status = \$1/i.test(normalized)) {
      const status = String(params[0] ?? 'active');
      const updatedAt = String(params[1] ?? new Date().toISOString());
      const profileId = String(params[2]);
      const characterId = String(params[3]);
      for (const row of this.characterBuilds.values()) {
        if (row.profile_id === profileId && row.character_id === characterId) {
          row.farm_status = status;
          row.updated_at = updatedAt;
          return { rowsAffected: 1 };
        }
      }
      return { rowsAffected: 0 };
    }

    // 30c. character_builds UPDATE full
    if (/^UPDATE character_builds SET/i.test(normalized)) {
      const id = String(params[params.length - 1]);
      const existing = this.characterBuilds.get(id);
      if (existing) {
        const hasFarmCols = /farm_priority/i.test(normalized);
        const hasNewColumns = /farm_enabled/i.test(normalized);
        if (hasFarmCols) {
          existing.status = String(params[0]);
          existing.account_weapon_id = params[1] != null ? String(params[1]) : null;
          existing.weapon_target_level = Number(params[2]);
          existing.character_target_level = Number(params[3]);
          existing.normal_attack_level = Number(params[4]);
          existing.normal_attack_target = Number(params[5]);
          existing.elemental_skill_level = Number(params[6]);
          existing.elemental_skill_target = Number(params[7]);
          existing.elemental_burst_level = Number(params[8]);
          existing.elemental_burst_target = Number(params[9]);
          existing.farm_enabled = params[10] ? 1 : 0;
          existing.farm_priority = Number(params[11]) || 0;
          existing.farm_status = String(params[12] || 'active');
          existing.character_target_ascension = Number(params[13]) || 6;
          existing.weapon_target_ascension = Number(params[14]) || 6;
          existing.notes = params[15] != null ? String(params[15]) : null;
          existing.updated_at = String(params[16]);
          if (/planned_weapon_id/i.test(normalized)) existing.planned_weapon_id = params[17] != null ? String(params[17]) : null;
        } else if (hasNewColumns) {
          existing.status = String(params[0]);
          existing.account_weapon_id = params[1] != null ? String(params[1]) : null;
          existing.weapon_target_level = Number(params[2]);
          existing.character_target_level = Number(params[3]);
          existing.normal_attack_level = Number(params[4]);
          existing.normal_attack_target = Number(params[5]);
          existing.elemental_skill_level = Number(params[6]);
          existing.elemental_skill_target = Number(params[7]);
          existing.elemental_burst_level = Number(params[8]);
          existing.elemental_burst_target = Number(params[9]);
          existing.farm_enabled = params[10] ? 1 : 0;
          existing.character_target_ascension = Number(params[11]) || 6;
          existing.weapon_target_ascension = Number(params[12]) || 6;
          existing.notes = params[13] != null ? String(params[13]) : null;
          existing.updated_at = String(params[14]);
        } else {
          existing.status = String(params[0]);
          existing.account_weapon_id = params[1] != null ? String(params[1]) : null;
          existing.weapon_target_level = Number(params[2]);
          existing.character_target_level = Number(params[3]);
          existing.normal_attack_level = Number(params[4]);
          existing.normal_attack_target = Number(params[5]);
          existing.elemental_skill_level = Number(params[6]);
          existing.elemental_skill_target = Number(params[7]);
          existing.elemental_burst_level = Number(params[8]);
          existing.elemental_burst_target = Number(params[9]);
          existing.notes = params[10] != null ? String(params[10]) : null;
          existing.updated_at = String(params[11]);
        }
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 31. character_builds DELETE by id
    if (/^DELETE FROM character_builds WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      for (const [k, slot] of this.buildArtifactSlots.entries()) {
        if (slot.build_id === id) {
          this.buildArtifactSlots.delete(k);
        }
      }
      const deleted = this.characterBuilds.delete(id);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 32. build_artifact_slots INSERT OR REPLACE
    if (/^INSERT (OR REPLACE )?INTO build_artifact_slots/i.test(normalized)) {
      const id = String(params[0]);
      const row = {
        id,
        build_id: String(params[1]),
        slot_key: String(params[2]),
        set_id: params[3] != null ? String(params[3]) : null,
        main_stat: params[4] != null ? String(params[4]) : null,
        substats: params[12] == null ? '[]' : String(params[12]),
        level: Number(params[5]) || 0,
        target_level: Number(params[6]) || 20,
        is_equipped: params[7] ? 1 : 0,
        rarity: Number(params[8]) || 5,
        notes: params[9] != null ? String(params[9]) : null,
        created_at: String(params[10] ?? new Date().toISOString()),
        updated_at: String(params[11] ?? new Date().toISOString()),
      };
      this.buildArtifactSlots.set(id, row);
      return { rowsAffected: 1 };
    }

    // 33. build_artifact_slots UPDATE
    if (/^UPDATE build_artifact_slots SET/i.test(normalized)) {
      const buildId = String(params[params.length - 2]);
      const slotKey = String(params[params.length - 1]);
      for (const slot of this.buildArtifactSlots.values()) {
        if (slot.build_id === buildId && slot.slot_key === slotKey) {
          slot.set_id = params[0] != null ? String(params[0]) : null;
          slot.main_stat = params[1] != null ? String(params[1]) : null;
          slot.level = Number(params[2]);
          slot.target_level = Number(params[3]);
          slot.is_equipped = params[4] ? 1 : 0;
          slot.rarity = Number(params[5]);
          slot.notes = params[6] != null ? String(params[6]) : null;
          slot.updated_at = String(params[7]);
          if (params.length === 11) slot.substats = String(params[8]);
          return { rowsAffected: 1 };
        }
      }
      return { rowsAffected: 0 };
    }

    // 34. wish_rule_sets INSERT OR IGNORE
    if (/^INSERT OR IGNORE INTO wish_rule_sets/i.test(normalized)) {
      if (params.length >= 11) {
        const id = String(params[0]);
        this.wishRuleSets.set(id, {
          id,
          game_key: String(params[1]),
          name: String(params[2]),
          banner_type: String(params[3]),
          hard_pity_5star: Number(params[4]),
          soft_pity_5star: Number(params[5]),
          hard_pity_4star: Number(params[6]),
          soft_pity_4star: Number(params[7]),
          base_rate_5star: Number(params[8]),
          base_rate_4star: Number(params[9]),
          featured_guarantee_system: String(params[10]),
          created_at: new Date().toISOString(),
        });
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 35. wish_entries INSERT
    if (/^INSERT INTO wish_entries/i.test(normalized)) {
      if (/FROM json_each\(\$1\)/i.test(normalized)) {
        const values = JSON.parse(String(params[0])) as unknown[][];
        let count = 0;
        for (const valuesRow of values) {
          if (this.wishEntries.has(String(valuesRow[0]))) continue;
          await this.execute('INSERT INTO wish_entries VALUES', valuesRow);
          count++;
        }
        return { rowsAffected: count };
      }
      const id = String(params[0]);
      const hasSequence = params.length >= 18;
      const row = {
        id,
        profile_id: String(params[1]),
        occurred_at: String(params[2]),
        game_version_id: params[3] != null ? String(params[3]) : null,
        banner_type: String(params[4]),
        banner_name: params[5] != null ? String(params[5]) : null,
        item_type: String(params[6]),
        item_id: String(params[7]),
        item_name: String(params[8]),
        rarity: Number(params[9]),
        pity_index: Number(params[10]) || 1,
        sequence_no: hasSequence ? Number(params[11]) || 0 : 0,
        is_featured: (hasSequence ? params[12] : params[11]) ? 1 : 0,
        won_pity_rate: (hasSequence ? params[13] : params[12]) ? 1 : 0,
        rule_set_id: (hasSequence ? params[14] : params[13]) != null ? String(hasSequence ? params[14] : params[13]) : null,
        notes: (hasSequence ? params[15] : params[14]) != null ? String(hasSequence ? params[15] : params[14]) : null,
        created_at: String((hasSequence ? params[16] : params[15]) ?? new Date().toISOString()),
        updated_at: String((hasSequence ? params[17] : params[16]) ?? new Date().toISOString()),
        weapon_fate_state: params[18] ?? null,
        weapon_path_result: params[19] ?? null,
      };
      this.wishEntries.set(id, row);
      return { rowsAffected: 1 };
    }

    // 36. wish_entries UPDATE
    if (/^UPDATE wish_entries SET/i.test(normalized)) {
      if (/sequence_no = \$1/i.test(normalized)) {
        const seq = Number(params[0]) || 0;
        const id = String(params[1]);
        const existing = this.wishEntries.get(id);
        if (existing) {
          existing.sequence_no = seq;
          return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
      }

      if (/won_pity_rate = \$1 WHERE id = \$2/i.test(normalized)) {
        const won = params[0] ? 1 : 0;
        const id = String(params[1]);
        const existing = this.wishEntries.get(id);
        if (existing) {
          existing.won_pity_rate = won;
          return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
      }

      if (/pity_index = \$1/i.test(normalized)) {
        const id = String(params[2]);
        const existing = this.wishEntries.get(id);
        if (existing) {
          existing.pity_index = Number(params[0]);
          existing.won_pity_rate = params[1] ? 1 : 0;
          return { rowsAffected: 1 };
        }
        return { rowsAffected: 0 };
      }

      const id = String(params[params.length - 1]);
      const existing = this.wishEntries.get(id);
      if (existing) {
        existing.occurred_at = String(params[0]);
        existing.game_version_id = params[1] != null ? String(params[1]) : null;
        existing.banner_type = String(params[2]);
        existing.banner_name = params[3] != null ? String(params[3]) : null;
        existing.item_type = String(params[4]);
        existing.item_id = String(params[5]);
        existing.item_name = String(params[6]);
        existing.rarity = Number(params[7]);
        existing.pity_index = Number(params[8]);
        existing.is_featured = params[9] ? 1 : 0;
        existing.won_pity_rate = params[10] ? 1 : 0;
        existing.rule_set_id = params[11] != null ? String(params[11]) : null;
        existing.notes = params[12] != null ? String(params[12]) : null;
        existing.updated_at = String(params[13]);
        if (params.length >= 16) existing.weapon_fate_state = params[14] ?? null;
        if (params.length === 17) existing.weapon_path_result = params[15] ?? null;
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 37. wish_entries DELETE by id
    if (/^DELETE FROM wish_entries WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const deleted = this.wishEntries.delete(id);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 38. wish_entries DELETE by profile_id
    if (/^DELETE FROM wish_entries WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      let count = 0;
      for (const [k, v] of this.wishEntries.entries()) {
        if (v.profile_id === profileId) {
          this.wishEntries.delete(k);
          count++;
        }
      }
      return { rowsAffected: count };
    }

    // 39. wish_goals INSERT
    if (/^INSERT INTO wish_goals/i.test(normalized)) {
      const id = String(params[0]);
      const row = {
        id,
        profile_id: String(params[1]),
        target_type: String(params[2]),
        target_id: String(params[3]),
        target_name: String(params[4]),
        target_rank: Number(params[5]) || 0,
        priority: Number(params[6]) || 1,
        status: String(params[7] || 'planning'),
        expected_version_id: params[8] != null ? String(params[8]) : null,
        reserved_wishes: Number(params[9]) || 0,
        notes: params[10] != null ? String(params[10]) : null,
        sort_order: Number(params[11]) || 0,
        created_at: String(params[12] ?? new Date().toISOString()),
        updated_at: String(params[13] ?? new Date().toISOString()),
      };
      this.wishGoals.set(id, row);
      return { rowsAffected: 1 };
    }

    // 40. wish_goals UPDATE sort_order
    if (/^UPDATE wish_goals SET sort_order = \$1/i.test(normalized)) {
      const sortOrder = Number(params[0]);
      const id = String(params[1]);
      const goal = this.wishGoals.get(id);
      if (goal) {
        goal.sort_order = sortOrder;
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 41. wish_goals UPDATE full
    if (/^UPDATE wish_goals SET/i.test(normalized)) {
      const id = String(params[params.length - 1]);
      const goal = this.wishGoals.get(id);
      if (goal) {
        goal.target_type = String(params[0]);
        goal.target_id = String(params[1]);
        goal.target_name = String(params[2]);
        goal.target_rank = Number(params[3]);
        goal.priority = Number(params[4]);
        goal.status = String(params[5]);
        goal.expected_version_id = params[6] != null ? String(params[6]) : null;
        goal.reserved_wishes = Number(params[7]);
        goal.notes = params[8] != null ? String(params[8]) : null;
        goal.sort_order = Number(params[9]);
        goal.updated_at = String(params[10]);
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 42. wish_goals DELETE by id
    if (/^DELETE FROM wish_goals WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const deleted = this.wishGoals.delete(id);
      return { rowsAffected: deleted ? 1 : 0 };
    }

    // 43. achievements INSERT OR IGNORE
    if (/^INSERT OR IGNORE INTO achievements/i.test(normalized)) {
      const id = String(params[0]);
      if (!this.achievements.has(id)) {
        this.achievements.set(id, {
          id,
          category: String(params[1]),
          name_pt_br: String(params[2]),
          description_pt_br: String(params[3]),
          reward_primogems: Number(params[4]) || 5,
          version_id: params[5] != null ? String(params[5]) : null,
          order_index: Number(params[6]) || 0,
          created_at: String(params[7] ?? new Date().toISOString()),
        });
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }

    // 44. profile_achievements INSERT / ON CONFLICT
    if (/^INSERT INTO profile_achievements/i.test(normalized)) {
      if (/FROM json_each\(\$1\)/i.test(normalized)) {
        const entries = JSON.parse(String(params[0])) as unknown[][];
        for (const entry of entries) await this.execute('INSERT INTO profile_achievements (profile_id, achievement_id, completed, completed_at) VALUES ($1, $2, $3, $4)', entry);
        return { rowsAffected: entries.length };
      }
      const profileId = String(params[0]);
      const achievementId = String(params[1]);
      const completed = params[2] ? 1 : 0;
      const completedAt = params[3] != null ? String(params[3]) : null;
      const key = `${profileId}_${achievementId}`;
      this.profileAchievements.set(key, {
        profile_id: profileId,
        achievement_id: achievementId,
        completed,
        completed_at: completedAt,
        notes: this.profileAchievements.get(key)?.notes ?? null,
      });
      return { rowsAffected: 1 };
    }

    // 45. banner_pity_states INSERT / ON CONFLICT
    if (/^INSERT INTO banner_pity_states/i.test(normalized)) {
      const id = String(params[0]);
      const profileId = String(params[1]);
      const bannerType = String(params[2]);
      const current5Star = Number(params[3]) || 0;
      const current4Star = Number(params[4]) || 0;
      const updatedAt = String(params[5] ?? new Date().toISOString());
      const key = `${profileId}_${bannerType}`;
      this.bannerPityStates.set(key, {
        id,
        profile_id: profileId,
        banner_type: bannerType,
        current_5star_pity: current5Star,
        current_4star_pity: current4Star,
        updated_at: updatedAt,
      });
      return { rowsAffected: 1 };
    }

    // Fallback genérico
    return { rowsAffected: 0 };
  }

  public async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
    const normalized = query.trim().replace(/\s+/g, ' ');
    const params = bindValues ?? [];

    // 0. sqlite_master
    if (/^SELECT name FROM sqlite_master/i.test(normalized)) {
      return [
        { name: 'profiles' },
        { name: 'app_settings' },
        { name: 'schema_metadata' },
        { name: 'characters' },
        { name: 'weapons' },
        { name: 'materials' },
        { name: 'asset_cache_metadata' },
        { name: 'artifact_sets' },
        { name: 'catalog_metadata' },
        { name: 'profile_resources' },
        { name: 'inventory_items' },
        { name: 'account_characters' },
        { name: 'account_weapons' },
        { name: 'character_builds' },
        { name: 'build_artifact_slots' },
        { name: 'wish_rule_sets' },
        { name: 'wish_entries' },
        { name: 'wish_goals' },
        { name: 'achievements' },
        { name: 'profile_achievements' },
        { name: 'banner_pity_states' },
      ] as unknown as T;
    }

    // 0b. PRAGMA table_info
    if (/^PRAGMA table_info\((.*?)\)/i.test(normalized)) {
      const match = normalized.match(/^PRAGMA table_info\((.*?)\)/i);
      const tableName = match ? match[1].toLowerCase().replace(/['"`]/g, '') : '';
      if (tableName === 'characters') {
        return [
          { name: 'id' },
          { name: 'game_key' },
          { name: 'name_pt_br' },
          { name: 'rarity' },
          { name: 'element' },
          { name: 'weapon_type' },
          { name: 'release_version_id' },
          { name: 'source_provider' },
          { name: 'source_entry_id' },
          { name: 'created_at' },
          { name: 'icon_url' },
          { name: 'splash_url' },
          { name: 'region' },
          { name: 'max_constellation' },
          { name: 'supports_friendship' },
        ] as unknown as T;
      }
      if (tableName === 'weapons') {
        return [
          { name: 'id' },
          { name: 'game_key' },
          { name: 'name_pt_br' },
          { name: 'rarity' },
          { name: 'weapon_type' },
          { name: 'release_version_id' },
          { name: 'source_provider' },
          { name: 'source_entry_id' },
          { name: 'created_at' },
          { name: 'icon_url' },
        ] as unknown as T;
      }
      if (tableName === 'materials') {
        return [
          { name: 'id' },
          { name: 'game_key' },
          { name: 'name_pt_br' },
          { name: 'category' },
          { name: 'rarity' },
          { name: 'region' },
          { name: 'source_provider' },
          { name: 'source_entry_id' },
          { name: 'created_at' },
          { name: 'icon_url' },
        ] as unknown as T;
      }
      if (tableName === 'character_builds') {
        return [
          { name: 'id' },
          { name: 'profile_id' },
          { name: 'character_id' },
          { name: 'status' },
          { name: 'account_weapon_id' },
          { name: 'preferred_artifact_set_1_id' },
          { name: 'preferred_artifact_set_2_id' },
          { name: 'sands_primary_stat' },
          { name: 'goblet_primary_stat' },
          { name: 'circlet_primary_stat' },
          { name: 'sub_stats_priority_json' },
          { name: 'weapon_target_level' },
          { name: 'weapon_current_level' },
          { name: 'character_target_level' },
          { name: 'character_current_level' },
          { name: 'normal_attack_level' },
          { name: 'normal_attack_target' },
          { name: 'elemental_skill_level' },
          { name: 'elemental_skill_target' },
          { name: 'elemental_burst_level' },
          { name: 'elemental_burst_target' },
          { name: 'farm_enabled' },
          { name: 'farm_priority' },
          { name: 'farm_status' },
          { name: 'character_target_ascension' },
          { name: 'weapon_target_ascension' },
          { name: 'notes' },
          { name: 'is_favorite' },
          { name: 'created_at' },
          { name: 'updated_at' },
        ] as unknown as T;
      }
      return [] as unknown as T;
    }

    // 1. schema_metadata SELECT key
    if (/^SELECT value FROM schema_metadata WHERE key =/i.test(normalized)) {
      let key = params[0] !== undefined ? String(params[0]) : '';
      if (!key) {
        const match = normalized.match(/WHERE key = '([^']+)'/i);
        if (match) {
          key = match[1];
        }
      }
      const row = this.schemaMetadata.get(key);
      return (row ? [{ value: row.value }] : []) as unknown as T;
    }

    // 2. schema_metadata SELECT all
    if (/^SELECT key, value, updated_at FROM schema_metadata/i.test(normalized)) {
      return Array.from(this.schemaMetadata.values()) as unknown as T;
    }

    // 3. app_settings SELECT key
    if (/^SELECT value FROM app_settings WHERE key = \$1/i.test(normalized)) {
      const key = String(params[0]);
      const row = this.appSettings.get(key);
      return (row ? [{ value: row.value }] : []) as unknown as T;
    }

    // 4. app_settings SELECT all
    if (/^SELECT key, value FROM app_settings/i.test(normalized)) {
      return Array.from(this.appSettings.values()).map((r) => ({
        key: r.key,
        value: r.value,
      })) as unknown as T;
    }

    // 5. profiles SELECT by id
    if (/^SELECT \* FROM profiles WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const row = this.profiles.get(id);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 6. profiles SELECT all
    if (/^SELECT \* FROM profiles/i.test(normalized)) {
      const list = Array.from(this.profiles.values()).map((r) => ({ ...r }));
      list.sort((a, b) => {
        const timeA = a.last_opened_at || a.updated_at || a.created_at;
        const timeB = b.last_opened_at || b.updated_at || b.created_at;
        return timeB.localeCompare(timeA);
      });
      return list as unknown as T;
    }

    // 7. asset_cache_metadata SELECT single
    if (/^SELECT \* FROM asset_cache_metadata WHERE entity_type = \$1/i.test(normalized)) {
      const key = `${String(params[0])}:${String(params[1])}:${String(params[2])}`;
      const row = this.assetCache.get(key);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 8. asset_cache_metadata SELECT all
    if (/^SELECT \* FROM asset_cache_metadata/i.test(normalized)) {
      const list = Array.from(this.assetCache.values()).map((r) => ({ ...r }));
      return list as unknown as T;
    }

    // 9. characters SELECT
    if (/^SELECT \* FROM characters WHERE/i.test(normalized)) {
      const idOrKey = String(params[0]).toLowerCase();
      const match = Array.from(this.characters.values()).find(
        (c) => String(c.id).toLowerCase() === idOrKey || String(c.game_key).toLowerCase() === idOrKey
      );
      return (match ? [{ ...match }] : []) as unknown as T;
    }
    if (/^SELECT \* FROM characters/i.test(normalized)) {
      return Array.from(this.characters.values()).map((c) => ({ ...c })) as unknown as T;
    }
    if (/^SELECT COUNT\(\*\) as count FROM characters/i.test(normalized)) {
      return [{ count: this.characters.size }] as unknown as T;
    }

    // 10. weapons SELECT
    if (/^SELECT \* FROM weapons WHERE/i.test(normalized)) {
      const idOrKey = String(params[0]).toLowerCase();
      const match = Array.from(this.weapons.values()).find(
        (w) => String(w.id).toLowerCase() === idOrKey || String(w.game_key).toLowerCase() === idOrKey
      );
      return (match ? [{ ...match }] : []) as unknown as T;
    }
    if (/^SELECT \* FROM weapons/i.test(normalized)) {
      return Array.from(this.weapons.values()).map((w) => ({ ...w })) as unknown as T;
    }
    if (/^SELECT COUNT\(\*\) as count FROM weapons/i.test(normalized)) {
      return [{ count: this.weapons.size }] as unknown as T;
    }

    // 11. materials SELECT
    if (/^SELECT \* FROM materials WHERE/i.test(normalized)) {
      const idOrKey = String(params[0]).toLowerCase();
      const match = Array.from(this.materials.values()).find(
        (m) => String(m.id).toLowerCase() === idOrKey || String(m.game_key).toLowerCase() === idOrKey
      );
      return (match ? [{ ...match }] : []) as unknown as T;
    }
    if (/^SELECT \* FROM materials/i.test(normalized)) {
      return Array.from(this.materials.values()).map((m) => ({ ...m })) as unknown as T;
    }
    if (/^SELECT COUNT\(\*\) as count FROM materials/i.test(normalized)) {
      return [{ count: this.materials.size }] as unknown as T;
    }

    // 12. artifact_sets SELECT
    if (/^SELECT \* FROM artifact_sets WHERE/i.test(normalized)) {
      const idOrKey = String(params[0]).toLowerCase();
      const match = Array.from(this.artifactSets.values()).find(
        (a) => String(a.id).toLowerCase() === idOrKey || String(a.game_key).toLowerCase() === idOrKey
      );
      return (match ? [{ ...match }] : []) as unknown as T;
    }
    if (/^SELECT \* FROM artifact_sets/i.test(normalized)) {
      return Array.from(this.artifactSets.values()).map((a) => ({ ...a })) as unknown as T;
    }
    if (/^SELECT COUNT\(\*\) as count FROM artifact_sets/i.test(normalized)) {
      return [{ count: this.artifactSets.size }] as unknown as T;
    }

    // 13. catalog_metadata SELECT
    if (/^SELECT value FROM catalog_metadata WHERE key = \$1/i.test(normalized)) {
      const key = String(params[0]);
      const item = this.catalogMetadata.get(key);
      return (item ? [{ value: item.value }] : []) as unknown as T;
    }
    if (/^SELECT \* FROM catalog_metadata/i.test(normalized)) {
      return Array.from(this.catalogMetadata.values()).map((m) => ({ ...m })) as unknown as T;
    }

    // 14. profile_resources SELECT
    if (/^SELECT \* FROM profile_resources WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const row = this.profileResources.get(profileId);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 15. inventory_items SELECT by profile and material
    if (/^SELECT \* FROM inventory_items WHERE profile_id = \$1 AND material_id = \$2/i.test(normalized)) {
      const key = `${String(params[0])}:${String(params[1])}`;
      const row = this.inventoryItems.get(key);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 16. inventory_items SELECT by profile
    if (/^SELECT \* FROM inventory_items WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const items = Array.from(this.inventoryItems.values()).filter((i) => i.profile_id === profileId);
      return items.map((i) => ({ ...i })) as unknown as T;
    }

    // 17. account_characters SELECT by profile and character
    if (/^SELECT \* FROM account_characters WHERE profile_id = \$1 AND character_id = \$2/i.test(normalized)) {
      const key = `${String(params[0])}:${String(params[1])}`;
      const row = this.accountCharacters.get(key);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 18. account_characters SELECT by profile
    if (/^SELECT \* FROM account_characters WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const items = Array.from(this.accountCharacters.values()).filter((i) => i.profile_id === profileId);
      items.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
      return items.map((i) => ({ ...i })) as unknown as T;
    }

    // 19. account_weapons SELECT MAX instance_no
    if (/^SELECT MAX\(instance_no\) as max_instance FROM account_weapons/i.test(normalized)) {
      const profileId = String(params[0]);
      const weaponId = String(params[1]);
      let maxInst = 0;
      for (const item of this.accountWeapons.values()) {
        if (item.profile_id === profileId && item.weapon_id === weaponId) {
          if (item.instance_no > maxInst) maxInst = item.instance_no;
        }
      }
      return [{ max_instance: maxInst }] as unknown as T;
    }

    // 20. account_weapons SELECT by id
    if (/^SELECT \* FROM account_weapons WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const row = this.accountWeapons.get(id);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 21. account_weapons SELECT by profile and weapon_id
    if (/^SELECT \* FROM account_weapons WHERE profile_id = \$1 AND weapon_id = \$2/i.test(normalized)) {
      const profileId = String(params[0]);
      const weaponId = String(params[1]);
      const items = Array.from(this.accountWeapons.values())
        .filter((i) => i.profile_id === profileId && i.weapon_id === weaponId)
        .sort((a, b) => a.instance_no - b.instance_no);
      return items.map((i) => ({ ...i })) as unknown as T;
    }

    // 22. account_weapons SELECT by profile
    if (/^SELECT \* FROM account_weapons WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const items = Array.from(this.accountWeapons.values()).filter((i) => i.profile_id === profileId);
      return items.map((i) => ({ ...i })) as unknown as T;
    }

    // 23. character_builds SELECT by profile and character
    if (/^SELECT \* FROM character_builds WHERE profile_id = \$1 AND character_id = \$2/i.test(normalized)) {
      const profileId = String(params[0]);
      const characterId = String(params[1]);
      for (const build of this.characterBuilds.values()) {
        if (build.profile_id === profileId && build.character_id === characterId) {
          return [{ ...build }] as unknown as T;
        }
      }
      return [] as unknown as T;
    }

    // 24. character_builds SELECT by profile
    if (/^SELECT \* FROM character_builds WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const list = Array.from(this.characterBuilds.values()).filter((b) => b.profile_id === profileId);
      return list.map((b) => ({ ...b })) as unknown as T;
    }

    // 25. character_builds SELECT by id
    if (/^SELECT \* FROM character_builds WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const build = this.characterBuilds.get(id);
      return (build ? [{ ...build }] : []) as unknown as T;
    }

    // 26. build_artifact_slots SELECT by build_id and slot_key
    if (/^SELECT \* FROM build_artifact_slots WHERE build_id = \$1 AND slot_key = \$2/i.test(normalized)) {
      const buildId = String(params[0]);
      const slotKey = String(params[1]);
      for (const slot of this.buildArtifactSlots.values()) {
        if (slot.build_id === buildId && slot.slot_key === slotKey) {
          return [{ ...slot }] as unknown as T;
        }
      }
      return [] as unknown as T;
    }

    // 27. build_artifact_slots SELECT by build_id
    if (/^SELECT \* FROM build_artifact_slots WHERE build_id = \$1/i.test(normalized)) {
      const buildId = String(params[0]);
      const list = Array.from(this.buildArtifactSlots.values()).filter((s) => s.build_id === buildId);
      return list.map((s) => ({ ...s })) as unknown as T;
    }

    // 28. wish_rule_sets SELECT
    if (/^SELECT \* FROM wish_rule_sets/i.test(normalized)) {
      const list = Array.from(this.wishRuleSets.values());
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
      return list as unknown as T;
    }

    // 29. wish_entries SELECT by id
    if (/^SELECT \* FROM wish_entries WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const row = this.wishEntries.get(id);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 30a. wish_entries COUNT unsequenced
    if (/^SELECT COUNT\(\*\) as count FROM wish_entries WHERE profile_id = \$1 AND \(sequence_no IS NULL OR sequence_no = 0\)/i.test(normalized)) {
      const profileId = String(params[0]);
      let count = 0;
      for (const w of this.wishEntries.values()) {
        if (w.profile_id === profileId && (!w.sequence_no || Number(w.sequence_no) === 0)) {
          count++;
        }
      }
      return [{ count }] as unknown as T;
    }

    // 30b. wish_entries MAX sequence_no
    if (/^SELECT MAX\(sequence_no\) as max_seq FROM wish_entries/i.test(normalized)) {
      const profileId = String(params[0]);
      let maxSeq = 0;
      for (const w of this.wishEntries.values()) {
        if (w.profile_id === profileId) {
          const seq = Number(w.sequence_no) || 0;
          if (seq > maxSeq) maxSeq = seq;
        }
      }
      return [{ max_seq: maxSeq }] as unknown as T;
    }

    // 30c. wish_entries SELECT by profile_id
    if (/^SELECT \* FROM wish_entries WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const bannerType = params[1] != null ? String(params[1]) : null;
      let items = Array.from(this.wishEntries.values()).filter((w) => w.profile_id === profileId);
      if (bannerType) {
        items = items.filter((w) => w.banner_type === bannerType);
      }
      if (/ORDER BY occurred_at ASC/i.test(normalized)) {
        items.sort((a, b) => {
          const occ = String(a.occurred_at).localeCompare(String(b.occurred_at));
          if (occ !== 0) return occ;
          const cr = String(a.created_at || '').localeCompare(String(b.created_at || ''));
          if (cr !== 0) return cr;
          return String(a.id).localeCompare(String(b.id));
        });
      } else {
        items.sort((a, b) => {
          const seqA = Number(a.sequence_no) || 0;
          const seqB = Number(b.sequence_no) || 0;
          if (seqA !== seqB) return seqB - seqA;
          const cmp = String(b.occurred_at).localeCompare(String(a.occurred_at));
          return cmp !== 0 ? cmp : String(b.id).localeCompare(String(a.id));
        });
      }
      return items.map((w) => ({ ...w })) as unknown as T;
    }

    // 31. wish_goals SELECT by id
    if (/^SELECT \* FROM wish_goals WHERE id = \$1/i.test(normalized)) {
      const id = String(params[0]);
      const row = this.wishGoals.get(id);
      return (row ? [{ ...row }] : []) as unknown as T;
    }

    // 32. wish_goals SELECT by profile_id
    if (/^SELECT \* FROM wish_goals WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const items = Array.from(this.wishGoals.values()).filter((g) => g.profile_id === profileId);
      items.sort((a, b) => {
        const aOrder = Number(a.sort_order) || 0;
        const bOrder = Number(b.sort_order) || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aPrio = Number(a.priority) || 0;
        const bPrio = Number(b.priority) || 0;
        if (aPrio !== bPrio) return aPrio - bPrio;
        return String(a.created_at).localeCompare(String(b.created_at));
      });
      return items.map((g) => ({ ...g })) as unknown as T;
    }

    // 33. achievements COUNT
    if (/^SELECT COUNT\(\*\) as count FROM achievements/i.test(normalized)) {
      return [{ count: this.achievements.size }] as unknown as T;
    }

    // 33b. achievements SELECT id or all
    if (/^SELECT id FROM achievements/i.test(normalized)) {
      return Array.from(this.achievements.values()).map((a) => ({ id: String(a.id) })) as unknown as T;
    }

    if (/^SELECT \* FROM achievements/i.test(normalized)) {
      return Array.from(this.achievements.values()).map((a) => ({ ...a })) as unknown as T;
    }

    // 34. achievements SELECT with profile join
    if (/^SELECT .* FROM achievements a LEFT JOIN profile_achievements pa/i.test(normalized)) {
      const profileId = String(params[0]);
      const category = params[1] != null ? String(params[1]) : null;
      let achs = Array.from(this.achievements.values());
      if (category) {
        achs = achs.filter((a) => a.category === category);
      }
      achs.sort((a, b) => {
        const catCmp = String(a.category).localeCompare(String(b.category));
        if (catCmp !== 0) return catCmp;
        const aOrder = Number(a.order_index) || 0;
        const bOrder = Number(b.order_index) || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.name_pt_br).localeCompare(String(b.name_pt_br));
      });
      const results = achs.map((a) => {
        const pa = this.profileAchievements.get(`${profileId}_${String(a.id)}`);
        return {
          id: String(a.id),
          category: String(a.category),
          name_pt_br: String(a.name_pt_br),
          description_pt_br: String(a.description_pt_br),
          reward_primogems: Number(a.reward_primogems) || 0,
          version_id: a.version_id != null ? String(a.version_id) : null,
          order_index: Number(a.order_index) || 0,
          created_at: String(a.created_at),
          completed: pa ? Number(pa.completed) || 0 : 0,
          completed_at: pa && pa.completed_at != null ? String(pa.completed_at) : null,
        };
      });
      return results as unknown as T;
    }

    // 35. profile_achievements SELECT single
    if (/^SELECT \* FROM profile_achievements WHERE profile_id = \$1 AND achievement_id = \$2/i.test(normalized)) {
      const profileId = String(params[0]);
      const achievementId = String(params[1]);
      const pa = this.profileAchievements.get(`${profileId}_${achievementId}`);
      return (pa ? [{ ...pa }] : []) as unknown as T;
    }

    // 36. banner_pity_states SELECT by profile_id
    if (/^SELECT \* FROM banner_pity_states WHERE profile_id = \$1/i.test(normalized)) {
      const profileId = String(params[0]);
      const bannerType = params[1] != null ? String(params[1]) : null;
      let items = Array.from(this.bannerPityStates.values()).filter((p) => p.profile_id === profileId);
      if (bannerType) {
        items = items.filter((p) => p.banner_type === bannerType);
      }
      return items.map((p) => ({ ...p })) as unknown as T;
    }

    return [] as unknown as T;
  }

  public async close(): Promise<boolean> {
    return true;
  }
}
