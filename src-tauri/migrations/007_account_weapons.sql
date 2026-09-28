-- WishLog: Migração 007 - Tabela de Armas da Conta (Múltiplas Cópias Independentes)
-- Conforme SPEC.md e ARCHITECTURE.md (Seção 6)

CREATE TABLE IF NOT EXISTS account_weapons (
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
);

CREATE INDEX IF NOT EXISTS idx_account_weapons_profile ON account_weapons(profile_id);
CREATE INDEX IF NOT EXISTS idx_account_weapons_weapon ON account_weapons(weapon_id);
CREATE INDEX IF NOT EXISTS idx_account_weapons_equipped ON account_weapons(equipped_character_id);

UPDATE schema_metadata SET value = '7', updated_at = CURRENT_TIMESTAMP WHERE key = 'schema_version';
