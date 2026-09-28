-- WishLog: Migração 009 - Planejamento de Evolução e Farm Ativo
-- Conforme SPEC.md (Seções 14 e 16), ARCHITECTURE.md (Seção 6) e Referência Genshin Center

ALTER TABLE character_builds ADD COLUMN farm_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE character_builds ADD COLUMN character_target_ascension INTEGER NOT NULL DEFAULT 6;
ALTER TABLE character_builds ADD COLUMN weapon_target_ascension INTEGER NOT NULL DEFAULT 6;

CREATE INDEX IF NOT EXISTS idx_character_builds_farm ON character_builds(farm_enabled);

INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '9');
