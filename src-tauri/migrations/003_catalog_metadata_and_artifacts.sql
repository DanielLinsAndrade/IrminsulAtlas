-- WishLog: Migração 003 - Metadados de Catálogo e Tabela de Conjuntos de Artefatos
-- Conforme SPEC.md e ARCHITECTURE.md (Seções 4, 5 e 6)

-- 1. Tabela de Metadados de Catálogo
CREATE TABLE IF NOT EXISTS catalog_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Conjuntos de Artefatos
CREATE TABLE IF NOT EXISTS artifact_sets (
    id TEXT PRIMARY KEY,
    game_key TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    rarities TEXT NOT NULL,
    source_provider TEXT NOT NULL,
    source_entry_id TEXT,
    icon_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_artifact_sets_game_key ON artifact_sets(game_key);

-- Atualiza versão do schema
INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '3');
