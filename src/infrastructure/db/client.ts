import { invoke, isTauri } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import type { IDatabase, SqlStatement } from './types';
import { InMemoryDatabase } from './memoryDb';

let activeDatabase: IDatabase | null = null;
let databasePromise: Promise<IDatabase> | null = null;

export const INITIAL_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS schema_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    uid TEXT,
    server TEXT,
    adventure_rank INTEGER,
    world_level INTEGER,
    traveler_gender TEXT,
    avatar_character_id TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_opened_at DATETIME
  )`,
  `CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_profiles_last_opened ON profiles(last_opened_at DESC)`,
  `CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    rarity INTEGER NOT NULL,
    element TEXT NOT NULL,
    weapon_type TEXT NOT NULL,
    release_version_id TEXT,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    icon_url TEXT,
    splash_url TEXT,
    region TEXT,
    max_constellation INTEGER DEFAULT 6,
    supports_friendship INTEGER DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS weapons (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    rarity INTEGER NOT NULL,
    weapon_type TEXT NOT NULL,
    release_version_id TEXT,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    icon_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity INTEGER,
    region TEXT,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    icon_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS asset_cache_metadata (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_key TEXT NOT NULL,
    variant TEXT NOT NULL,
    source_url TEXT NOT NULL,
    local_path TEXT,
    data_uri TEXT,
    etag TEXT,
    last_modified TEXT,
    downloaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_checked_at DATETIME
  )`,
  `CREATE INDEX IF NOT EXISTS idx_characters_element ON characters(element)`,
  `CREATE INDEX IF NOT EXISTS idx_characters_weapon ON characters(weapon_type)`,
  `CREATE INDEX IF NOT EXISTS idx_weapons_type ON weapons(weapon_type)`,
  `CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category)`,
  `CREATE INDEX IF NOT EXISTS idx_asset_cache_lookup ON asset_cache_metadata(entity_type, entity_key, variant)`,
  `CREATE TABLE IF NOT EXISTS catalog_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS artifact_sets (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    rarities TEXT NOT NULL,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    icon_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_artifact_sets_game_key ON artifact_sets(game_key)`,
  `CREATE TABLE IF NOT EXISTS profile_resources (
    profile_id TEXT PRIMARY KEY,
    primogems INTEGER NOT NULL DEFAULT 0,
    intertwined_fates INTEGER NOT NULL DEFAULT 0,
    acquaint_fates INTEGER NOT NULL DEFAULT 0,
    starglitter INTEGER NOT NULL DEFAULT 0,
    stardust INTEGER NOT NULL DEFAULT 0,
    genesis_crystals INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_items (
    profile_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id, material_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_items_profile ON inventory_items(profile_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_items_material ON inventory_items(material_id)`,
  `CREATE TABLE IF NOT EXISTS account_characters (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    owned INTEGER NOT NULL DEFAULT 1,
    constellation INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    ascension INTEGER NOT NULL DEFAULT 0,
    friendship INTEGER,
    combat_stats TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (profile_id, character_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_account_characters_profile ON account_characters(profile_id)`,
  `CREATE INDEX IF NOT EXISTS idx_account_characters_char ON account_characters(character_id)`,
  `CREATE TABLE IF NOT EXISTS account_weapons (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    weapon_id TEXT NOT NULL,
    instance_no INTEGER NOT NULL DEFAULT 1,
    level INTEGER NOT NULL DEFAULT 1,
    ascension INTEGER NOT NULL DEFAULT 0,
    refinement INTEGER NOT NULL DEFAULT 1,
    equipped_character_id TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (weapon_id) REFERENCES weapons(id) ON DELETE CASCADE,
    FOREIGN KEY (equipped_character_id) REFERENCES characters(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_account_weapons_profile ON account_weapons(profile_id)`,
  `CREATE INDEX IF NOT EXISTS idx_account_weapons_weapon ON account_weapons(weapon_id)`,
  `CREATE INDEX IF NOT EXISTS idx_account_weapons_equipped ON account_weapons(equipped_character_id)`,
  `CREATE TABLE IF NOT EXISTS character_builds (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sem_build',
    account_weapon_id TEXT,
    planned_weapon_id TEXT,
    weapon_target_level INTEGER NOT NULL DEFAULT 90,
    character_target_level INTEGER NOT NULL DEFAULT 90,
    normal_attack_level INTEGER NOT NULL DEFAULT 1,
    normal_attack_target INTEGER NOT NULL DEFAULT 8,
    elemental_skill_level INTEGER NOT NULL DEFAULT 1,
    elemental_skill_target INTEGER NOT NULL DEFAULT 8,
    elemental_burst_level INTEGER NOT NULL DEFAULT 1,
    elemental_burst_target INTEGER NOT NULL DEFAULT 8,
    farm_enabled INTEGER NOT NULL DEFAULT 1,
    character_target_ascension INTEGER NOT NULL DEFAULT 6,
    weapon_target_ascension INTEGER NOT NULL DEFAULT 6,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (account_weapon_id) REFERENCES account_weapons(id) ON DELETE SET NULL,
    UNIQUE (profile_id, character_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_character_builds_profile ON character_builds(profile_id)`,
  `CREATE INDEX IF NOT EXISTS idx_character_builds_char ON character_builds(character_id)`,
  `CREATE INDEX IF NOT EXISTS idx_character_builds_status ON character_builds(status)`,
  `CREATE TABLE IF NOT EXISTS build_artifact_slots (
    id TEXT PRIMARY KEY NOT NULL,
    build_id TEXT NOT NULL,
    slot_key TEXT NOT NULL,
    set_id TEXT,
    main_stat TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    target_level INTEGER NOT NULL DEFAULT 20,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    rarity INTEGER NOT NULL DEFAULT 5,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (build_id) REFERENCES character_builds(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id) REFERENCES artifact_sets(id) ON DELETE SET NULL,
    UNIQUE (build_id, slot_key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_build_artifact_slots_build ON build_artifact_slots(build_id)`,
  `CREATE TABLE IF NOT EXISTS wish_rule_sets (
    id TEXT PRIMARY KEY NOT NULL,
    game_key TEXT NOT NULL,
    name TEXT NOT NULL,
    banner_type TEXT NOT NULL,
    hard_pity_5star INTEGER NOT NULL DEFAULT 90,
    soft_pity_5star INTEGER NOT NULL DEFAULT 74,
    hard_pity_4star INTEGER NOT NULL DEFAULT 10,
    soft_pity_4star INTEGER NOT NULL DEFAULT 8,
    base_rate_5star REAL NOT NULL DEFAULT 0.006,
    base_rate_4star REAL NOT NULL DEFAULT 0.051,
    featured_guarantee_system TEXT NOT NULL DEFAULT '50_50',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT OR IGNORE INTO wish_rule_sets (id, game_key, name, banner_type, hard_pity_5star, soft_pity_5star, hard_pity_4star, soft_pity_4star, base_rate_5star, base_rate_4star, featured_guarantee_system)
   VALUES 
     ('rule_character', 'character_event', 'Oração de Evento de Personagem', 'character', 90, 74, 10, 8, 0.006, 0.051, '50_50'),
     ('rule_weapon', 'weapon_event', 'Oração de Evento de Arma', 'weapon', 80, 63, 10, 7, 0.007, 0.060, 'epitomized_path'),
     ('rule_standard', 'standard_wish', 'Oração Comum (Invocação do Mochileiro)', 'standard', 90, 74, 10, 8, 0.006, 0.051, 'none'),
     ('rule_chronicled', 'chronicled_wish', 'Oração de Registro', 'chronicled', 90, 74, 10, 8, 0.006, 0.051, 'fate_points')`,
  `CREATE TABLE IF NOT EXISTS wish_entries (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    occurred_at DATETIME NOT NULL,
    game_version_id TEXT,
    banner_type TEXT NOT NULL,
    banner_name TEXT,
    weapon_fate_state TEXT,
    weapon_path_result TEXT,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    rarity INTEGER NOT NULL,
    pity_index INTEGER NOT NULL DEFAULT 1,
    sequence_no INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0,
    won_pity_rate INTEGER NOT NULL DEFAULT 0,
    rule_set_id TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_set_id) REFERENCES wish_rule_sets(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_wish_entries_profile_date ON wish_entries(profile_id, occurred_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_wish_entries_sequence ON wish_entries(profile_id, sequence_no DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_wish_entries_banner ON wish_entries(profile_id, banner_type, occurred_at ASC)`,
  `CREATE INDEX IF NOT EXISTS idx_wish_entries_rarity ON wish_entries(profile_id, rarity)`,
  `CREATE TABLE IF NOT EXISTS wish_goals (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_name TEXT NOT NULL,
    target_rank INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'planning',
    expected_version_id TEXT,
    reserved_wishes INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_wish_goals_profile ON wish_goals(profile_id, sort_order ASC)`,
  `CREATE INDEX IF NOT EXISTS idx_wish_goals_status ON wish_goals(profile_id, status)`,
  `CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    description_pt_br TEXT NOT NULL,
    reward_primogems INTEGER NOT NULL DEFAULT 5,
    version_id TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category, order_index ASC)`,
  `CREATE TABLE IF NOT EXISTS profile_achievements (
    profile_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at DATETIME,
    notes TEXT,
    PRIMARY KEY (profile_id, achievement_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_profile_achievements_profile ON profile_achievements(profile_id, completed)`,
  `CREATE TABLE IF NOT EXISTS banner_pity_states (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    banner_type TEXT NOT NULL,
    current_5star_pity INTEGER NOT NULL DEFAULT 0,
    current_4star_pity INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE (profile_id, banner_type)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_banner_pity_states_profile ON banner_pity_states(profile_id)`,
  `INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '12')`,
  `INSERT OR IGNORE INTO schema_metadata (key, value) VALUES ('spec_version', '1.0')`,
];

export function isTauriApp(): boolean {
  try {
    return isTauri();
  } catch {
    return false;
  }
}

/**
 * Garante que as tabelas essenciais existam antes de qualquer operação de CRUD.
 */
export async function ensureDatabaseReady(db: IDatabase): Promise<void> {
  let hasAllTables = false;
  try {
    const rows = await db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('profiles', 'app_settings', 'characters', 'weapons', 'materials', 'asset_cache_metadata', 'profile_resources', 'inventory_items', 'account_characters', 'account_weapons', 'character_builds', 'build_artifact_slots', 'wish_rule_sets', 'wish_entries', 'wish_goals', 'achievements', 'profile_achievements')"
    );
    if (rows && rows.length >= 17) {
      hasAllTables = true;
    }
  } catch {
    // Se a checagem falhar ou não suportar sqlite_master, continua para execução defensiva
  }

  if (!hasAllTables) {
    for (const statement of INITIAL_SCHEMA_STATEMENTS) {
      await db.execute(statement);
    }
  }

  // Tabelas criadas condicionalmente caso ainda não existam no banco
  const requiredTablesStatements = [
    `CREATE TABLE IF NOT EXISTS account_weapons (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      weapon_id TEXT NOT NULL,
      instance_no INTEGER NOT NULL DEFAULT 1,
      level INTEGER NOT NULL DEFAULT 1,
      ascension INTEGER NOT NULL DEFAULT 0,
      refinement INTEGER NOT NULL DEFAULT 1,
      equipped_character_id TEXT,
      favorite INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (weapon_id) REFERENCES weapons(id) ON DELETE CASCADE,
      FOREIGN KEY (equipped_character_id) REFERENCES characters(id) ON DELETE SET NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_account_weapons_profile ON account_weapons(profile_id)',
    'CREATE INDEX IF NOT EXISTS idx_account_weapons_weapon ON account_weapons(weapon_id)',
    'CREATE INDEX IF NOT EXISTS idx_account_weapons_equipped ON account_weapons(equipped_character_id)',
    `CREATE TABLE IF NOT EXISTS character_builds (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sem_build',
      account_weapon_id TEXT,
      planned_weapon_id TEXT,
      weapon_target_level INTEGER NOT NULL DEFAULT 90,
      character_target_level INTEGER NOT NULL DEFAULT 90,
      normal_attack_level INTEGER NOT NULL DEFAULT 1,
      normal_attack_target INTEGER NOT NULL DEFAULT 8,
      elemental_skill_level INTEGER NOT NULL DEFAULT 1,
      elemental_skill_target INTEGER NOT NULL DEFAULT 8,
      elemental_burst_level INTEGER NOT NULL DEFAULT 1,
      elemental_burst_target INTEGER NOT NULL DEFAULT 8,
      farm_enabled INTEGER NOT NULL DEFAULT 1,
      farm_priority INTEGER NOT NULL DEFAULT 0,
      farm_status TEXT NOT NULL DEFAULT 'active',
      character_target_ascension INTEGER NOT NULL DEFAULT 6,
      weapon_target_ascension INTEGER NOT NULL DEFAULT 6,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (account_weapon_id) REFERENCES account_weapons(id) ON DELETE SET NULL,
      UNIQUE (profile_id, character_id)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_character_builds_profile ON character_builds(profile_id)',
    'CREATE INDEX IF NOT EXISTS idx_character_builds_char ON character_builds(character_id)',
    'CREATE INDEX IF NOT EXISTS idx_character_builds_status ON character_builds(status)',
    'CREATE INDEX IF NOT EXISTS idx_character_builds_farm_priority ON character_builds(profile_id, farm_priority)',
    'CREATE INDEX IF NOT EXISTS idx_character_builds_farm_status ON character_builds(farm_status)',
    `CREATE TABLE IF NOT EXISTS build_artifact_slots (
      id TEXT PRIMARY KEY NOT NULL,
      build_id TEXT NOT NULL,
      slot_key TEXT NOT NULL,
      set_id TEXT,
      main_stat TEXT,
      level INTEGER NOT NULL DEFAULT 0,
      target_level INTEGER NOT NULL DEFAULT 20,
      is_equipped INTEGER NOT NULL DEFAULT 0,
      rarity INTEGER NOT NULL DEFAULT 5,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (build_id) REFERENCES character_builds(id) ON DELETE CASCADE,
      FOREIGN KEY (set_id) REFERENCES artifact_sets(id) ON DELETE SET NULL,
      UNIQUE (build_id, slot_key)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_build_artifact_slots_build ON build_artifact_slots(build_id)',
    `CREATE TABLE IF NOT EXISTS wish_rule_sets (
      id TEXT PRIMARY KEY NOT NULL,
      game_key TEXT NOT NULL,
      name TEXT NOT NULL,
      banner_type TEXT NOT NULL,
      hard_pity_5star INTEGER NOT NULL DEFAULT 90,
      soft_pity_5star INTEGER NOT NULL DEFAULT 74,
      hard_pity_4star INTEGER NOT NULL DEFAULT 10,
      soft_pity_4star INTEGER NOT NULL DEFAULT 8,
      base_rate_5star REAL NOT NULL DEFAULT 0.006,
      base_rate_4star REAL NOT NULL DEFAULT 0.051,
      featured_guarantee_system TEXT NOT NULL DEFAULT '50_50',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `INSERT OR IGNORE INTO wish_rule_sets (id, game_key, name, banner_type, hard_pity_5star, soft_pity_5star, hard_pity_4star, soft_pity_4star, base_rate_5star, base_rate_4star, featured_guarantee_system)
     VALUES 
       ('rule_character', 'character_event', 'Oração de Evento de Personagem', 'character', 90, 74, 10, 8, 0.006, 0.051, '50_50'),
       ('rule_weapon', 'weapon_event', 'Oração de Evento de Arma', 'weapon', 80, 63, 10, 7, 0.007, 0.060, 'epitomized_path'),
       ('rule_standard', 'standard_wish', 'Oração Comum (Invocação do Mochileiro)', 'standard', 90, 74, 10, 8, 0.006, 0.051, 'none'),
       ('rule_chronicled', 'chronicled_wish', 'Oração de Registro', 'chronicled', 90, 74, 10, 8, 0.006, 0.051, 'fate_points')`,
    `CREATE TABLE IF NOT EXISTS wish_entries (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      occurred_at DATETIME NOT NULL,
      game_version_id TEXT,
      banner_type TEXT NOT NULL,
      banner_name TEXT,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      rarity INTEGER NOT NULL,
      pity_index INTEGER NOT NULL DEFAULT 1,
      sequence_no INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      won_pity_rate INTEGER NOT NULL DEFAULT 0,
      rule_set_id TEXT,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (rule_set_id) REFERENCES wish_rule_sets(id) ON DELETE SET NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_wish_entries_profile_date ON wish_entries(profile_id, occurred_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_wish_entries_sequence ON wish_entries(profile_id, sequence_no DESC)',
    'CREATE INDEX IF NOT EXISTS idx_wish_entries_banner ON wish_entries(profile_id, banner_type, occurred_at ASC)',
    'CREATE INDEX IF NOT EXISTS idx_wish_entries_rarity ON wish_entries(profile_id, rarity)',
    `CREATE TABLE IF NOT EXISTS wish_goals (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_name TEXT NOT NULL,
      target_rank INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'planning',
      expected_version_id TEXT,
      reserved_wishes INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )`,
    'CREATE INDEX IF NOT EXISTS idx_wish_goals_profile ON wish_goals(profile_id, sort_order ASC)',
    'CREATE INDEX IF NOT EXISTS idx_wish_goals_status ON wish_goals(profile_id, status)',
    `CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      name_pt_br TEXT NOT NULL,
      description_pt_br TEXT NOT NULL,
      reward_primogems INTEGER NOT NULL DEFAULT 5,
      version_id TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category, order_index ASC)',
    `CREATE TABLE IF NOT EXISTS profile_achievements (
      profile_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at DATETIME,
      notes TEXT,
      PRIMARY KEY (profile_id, achievement_id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    )`,
    'CREATE INDEX IF NOT EXISTS idx_profile_achievements_profile ON profile_achievements(profile_id, completed)',
    `CREATE TABLE IF NOT EXISTS banner_pity_states (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      banner_type TEXT NOT NULL,
      current_5star_pity INTEGER NOT NULL DEFAULT 0,
      current_4star_pity INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE (profile_id, banner_type)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_banner_pity_states_profile ON banner_pity_states(profile_id)',
  ];
  for (const stmt of requiredTablesStatements) {
    await db.execute(stmt);
  }

  // Normalização de colunas pré-existentes com pré-condição explicitamente verificada
  await ensureColumnExists(db, 'characters', 'icon_url', 'TEXT');
  await ensureColumnExists(db, 'account_characters', 'combat_stats', 'TEXT');
  await ensureColumnExists(db, 'build_artifact_slots', 'substats', "TEXT NOT NULL DEFAULT '[]'");
  await ensureColumnExists(db, 'characters', 'splash_url', 'TEXT');
  await ensureColumnExists(db, 'characters', 'region', 'TEXT');
  await ensureColumnExists(db, 'characters', 'max_constellation', 'INTEGER DEFAULT 6');
  await ensureColumnExists(db, 'characters', 'supports_friendship', 'INTEGER DEFAULT 1');
  await ensureColumnExists(db, 'weapons', 'icon_url', 'TEXT');
  await ensureColumnExists(db, 'materials', 'icon_url', 'TEXT');
  await ensureColumnExists(db, 'character_builds', 'farm_enabled', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumnExists(db, 'character_builds', 'farm_priority', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumnExists(db, 'character_builds', 'farm_status', "TEXT NOT NULL DEFAULT 'active'");
  await ensureColumnExists(db, 'character_builds', 'character_target_ascension', 'INTEGER NOT NULL DEFAULT 6');
  await ensureColumnExists(db, 'character_builds', 'weapon_target_ascension', 'INTEGER NOT NULL DEFAULT 6');
  await ensureColumnExists(db, 'wish_entries', 'sequence_no', 'INTEGER NOT NULL DEFAULT 0');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_wish_entries_sequence ON wish_entries(profile_id, sequence_no DESC)');

  // Desktop reports the SQLx ledger, not the browser bootstrap's legacy version.
  const tables = await db.select<{ name: string }[]>("SELECT name FROM sqlite_master WHERE type='table'");
  if (tables.some(table => table.name === '_sqlx_migrations')) {
    await db.execute("INSERT OR REPLACE INTO schema_metadata (key, value) SELECT 'schema_version', CAST(MAX(version) AS TEXT) FROM _sqlx_migrations WHERE success = 1 HAVING MAX(version) IS NOT NULL");
    return;
  }
  // Browser/test emulator does not run SQLx migrations.
  await db.execute(
    "INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '12')"
  );
}

/**
 * Garante que uma coluna exista em uma tabela SQLite via verificação explícita de pré-condição
 * (PRAGMA table_info), prevenindo falhas de duplicate column name e sem try/catch cego.
 */
async function ensureColumnExists(
  db: IDatabase,
  tableName: string,
  columnName: string,
  columnDefinitionSql: string
): Promise<void> {
  const columns = await db.select<{ name: string }[]>(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((col) => col.name.toLowerCase() === columnName.toLowerCase());
  if (!hasColumn) {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinitionSql}`);
  }
}

/**
 * Obtém a conexão ativa com o banco SQLite.
 * No runtime do Tauri, conecta-se a 'sqlite:wishlog.db'.
 * Erros no Tauri são propagados (sem fallback para memória), garantindo persistência real.
 * Em testes ou navegador isolado (fora do Tauri), utiliza o emulador em memória.
 */
export async function getDatabase(): Promise<IDatabase> {
  if (activeDatabase) {
    return activeDatabase;
  }
  if (databasePromise) {
    return databasePromise;
  }


  databasePromise = (async () => {
    if (isTauriApp()) {
      try {
        const db = Object.assign(await Database.load('sqlite:wishlog.db'), {
          executeBatch: (statements: SqlStatement[]) => invoke<void>('execute_sql_transaction', { statements }),
        });
        await ensureDatabaseReady(db);
        activeDatabase = db;
        return activeDatabase;
      } catch (err) {
        // Reseta cache para permitir retentativas legítimas
        activeDatabase = null;
        databasePromise = null;
        const message = err instanceof Error ? err.message : String(err);
        console.error('Falha crítica ao conectar ao SQLite nativo via Tauri:', err);
        // NUNCA usar memoryDb silenciosamente em ambiente desktop Tauri
        throw new Error(`Falha no banco SQLite nativo: ${message}`, { cause: err });
      }
    } else {
      activeDatabase = new InMemoryDatabase();
      await ensureDatabaseReady(activeDatabase);
      return activeDatabase;
    }
  })();

  return databasePromise;
}

/**
 * Define explicitamente a instância de banco (útil para injeção de dependência em testes).
 */
export function setDatabaseInstance(db: IDatabase | null): void {
  activeDatabase = db;
  databasePromise = db ? Promise.resolve(db) : null;
}

export const getDatabaseInstance = getDatabase;

/**
 * Fecha a conexão com o banco de dados.
 */
export async function closeDatabase(): Promise<void> {
  if (activeDatabase) {
    await activeDatabase.close();
    activeDatabase = null;
    databasePromise = null;
  }
}
