-- WishLog: Migração 002 - Tabelas de Catálogo Base e Metadados de Cache de Assets
-- Conforme SPEC.md e ARCHITECTURE.md (Seções 6 e 12)

-- 1. Catálogo de Personagens
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    rarity INTEGER NOT NULL,
    element TEXT NOT NULL,
    weapon_type TEXT NOT NULL,
    release_version_id TEXT,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catálogo de Armas
CREATE TABLE IF NOT EXISTS weapons (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    rarity INTEGER NOT NULL,
    weapon_type TEXT NOT NULL,
    release_version_id TEXT,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Catálogo de Materiais
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity INTEGER,
    region TEXT,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Metadados de Cache de Assets
CREATE TABLE IF NOT EXISTS asset_cache_metadata (
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
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_characters_element ON characters(element);
CREATE INDEX IF NOT EXISTS idx_characters_weapon ON characters(weapon_type);
CREATE INDEX IF NOT EXISTS idx_weapons_type ON weapons(weapon_type);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_asset_cache_lookup ON asset_cache_metadata(entity_type, entity_key, variant);

-- Atualiza versão do schema
INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '2');
