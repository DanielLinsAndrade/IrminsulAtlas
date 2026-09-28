-- WishLog: Migração Inicial 001 - Tabelas de Sistema e Perfis
-- Compatível com SQLite 3 e SPEC1

-- 1. Metadados do Schema
CREATE TABLE IF NOT EXISTS schema_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Configurações da Aplicação
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Perfis de Conta (SPEC.md Seção 6 / ARCHITECTURE.md Seção 6)
CREATE TABLE IF NOT EXISTS profiles (
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
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_opened ON profiles(last_opened_at DESC);

-- Registro da versão inicial do schema
INSERT OR IGNORE INTO schema_metadata (key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO schema_metadata (key, value) VALUES ('spec_version', '1.0');