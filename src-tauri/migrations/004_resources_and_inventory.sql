-- WishLog: Migração 004 - Recursos de Desejos e Inventário de Materiais
-- Conforme SPEC.md (Seções 9 e 15) e ARCHITECTURE.md (Seções 5 e 6)

-- 1. Tabela de Recursos de Desejos vinculados ao Perfil
CREATE TABLE IF NOT EXISTS profile_resources (
    profile_id TEXT PRIMARY KEY,
    primogems INTEGER NOT NULL DEFAULT 0,
    intertwined_fates INTEGER NOT NULL DEFAULT 0,
    acquaint_fates INTEGER NOT NULL DEFAULT 0,
    starglitter INTEGER NOT NULL DEFAULT 0,
    stardust INTEGER NOT NULL DEFAULT 0,
    genesis_crystals INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 2. Tabela de Itens de Inventário de Materiais de Evolução
CREATE TABLE IF NOT EXISTS inventory_items (
    profile_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id, material_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- Índices para buscas rápidas e integridade relacional
CREATE INDEX IF NOT EXISTS idx_inventory_items_profile ON inventory_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_material ON inventory_items(material_id);

-- Atualiza versão do schema para 4
INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '4');
