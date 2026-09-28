-- WishLog: Migração 005 - Personagens da Conta e Constelações
-- Conforme SPEC.md (Seções 11 e 12) e ARCHITECTURE.md (Seções 5 e 6)

-- 1. Tabela de Personagens da Conta vinculados ao Perfil
CREATE TABLE IF NOT EXISTS account_characters (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    owned INTEGER NOT NULL DEFAULT 1,
    constellation INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    ascension INTEGER NOT NULL DEFAULT 0,
    friendship INTEGER,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE (profile_id, character_id)
);

-- Índices para consultas de personagens por perfil e por personagem
CREATE INDEX IF NOT EXISTS idx_account_characters_profile ON account_characters(profile_id);
CREATE INDEX IF NOT EXISTS idx_account_characters_char ON account_characters(character_id);

-- Atualiza versão do schema para 5
INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '5');
