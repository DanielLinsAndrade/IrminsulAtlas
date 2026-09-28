-- WishLog: Migração 008 - Builds Básicas e Slots de Artefatos
-- Conforme SPEC.md (Seção 14) e ROADMAP.md (Etapa 10)

CREATE TABLE IF NOT EXISTS character_builds (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'sem_build',
    account_weapon_id TEXT REFERENCES account_weapons(id) ON DELETE SET NULL,
    weapon_target_level INTEGER NOT NULL DEFAULT 90,
    character_target_level INTEGER NOT NULL DEFAULT 90,
    normal_attack_level INTEGER NOT NULL DEFAULT 1,
    normal_attack_target INTEGER NOT NULL DEFAULT 8,
    elemental_skill_level INTEGER NOT NULL DEFAULT 1,
    elemental_skill_target INTEGER NOT NULL DEFAULT 8,
    elemental_burst_level INTEGER NOT NULL DEFAULT 1,
    elemental_burst_target INTEGER NOT NULL DEFAULT 8,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_character_builds_profile ON character_builds(profile_id);
CREATE INDEX IF NOT EXISTS idx_character_builds_character ON character_builds(character_id);
CREATE INDEX IF NOT EXISTS idx_character_builds_status ON character_builds(status);

CREATE TABLE IF NOT EXISTS build_artifact_slots (
    id TEXT PRIMARY KEY,
    build_id TEXT NOT NULL REFERENCES character_builds(id) ON DELETE CASCADE,
    slot_key TEXT NOT NULL,
    set_id TEXT REFERENCES artifact_sets(id) ON DELETE SET NULL,
    main_stat TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    target_level INTEGER NOT NULL DEFAULT 20,
    is_equipped INTEGER NOT NULL DEFAULT 0,
    rarity INTEGER NOT NULL DEFAULT 5,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(build_id, slot_key)
);

CREATE INDEX IF NOT EXISTS idx_build_artifact_slots_build ON build_artifact_slots(build_id);

INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '8');
