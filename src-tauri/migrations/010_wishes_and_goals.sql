-- WishLog: Migração 010 - Histórico de Desejos, Pity, Metas, Farm Prioritário e Conquistas
-- Conforme SPEC.md (Seções 11, 12, 13, 14, 15, 16), ARCHITECTURE.md (Seção 6) e ROADMAP.md

-- 1. Extensões na tabela character_builds para ordenação e status do farm
ALTER TABLE character_builds ADD COLUMN farm_priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE character_builds ADD COLUMN farm_status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_character_builds_farm_priority ON character_builds(profile_id, farm_priority);
CREATE INDEX IF NOT EXISTS idx_character_builds_farm_status ON character_builds(farm_status);

-- 2. Conjuntos de regras de banners (Rule Sets)
CREATE TABLE IF NOT EXISTS wish_rule_sets (
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
);

-- Inserção dos rule sets padrão do jogo
INSERT OR IGNORE INTO wish_rule_sets (id, game_key, name, banner_type, hard_pity_5star, soft_pity_5star, hard_pity_4star, soft_pity_4star, base_rate_5star, base_rate_4star, featured_guarantee_system)
VALUES 
  ('rule_character', 'character_event', 'Oração de Evento de Personagem', 'character', 90, 74, 10, 8, 0.006, 0.051, '50_50'),
  ('rule_weapon', 'weapon_event', 'Oração de Evento de Arma', 'weapon', 80, 63, 10, 7, 0.007, 0.060, 'epitomized_path'),
  ('rule_standard', 'standard_wish', 'Oração Comum (Invocação do Mochileiro)', 'standard', 90, 74, 10, 8, 0.006, 0.051, 'none'),
  ('rule_chronicled', 'chronicled_wish', 'Oração de Registro', 'chronicled', 90, 74, 10, 8, 0.006, 0.051, 'fate_points');

-- 3. Histórico de desejos / tiros
CREATE TABLE IF NOT EXISTS wish_entries (
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
    is_featured INTEGER NOT NULL DEFAULT 0,
    won_pity_rate INTEGER NOT NULL DEFAULT 0,
    rule_set_id TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_set_id) REFERENCES wish_rule_sets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wish_entries_profile_date ON wish_entries(profile_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_wish_entries_banner ON wish_entries(profile_id, banner_type, occurred_at ASC);
CREATE INDEX IF NOT EXISTS idx_wish_entries_rarity ON wish_entries(profile_id, rarity);

-- 4. Planejamento de tiros e metas de banners (Wish Goals)
CREATE TABLE IF NOT EXISTS wish_goals (
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
);

CREATE INDEX IF NOT EXISTS idx_wish_goals_profile ON wish_goals(profile_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_wish_goals_status ON wish_goals(profile_id, status);

-- 5. Catálogo de conquistas e progresso por perfil
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    name_pt_br TEXT NOT NULL,
    description_pt_br TEXT NOT NULL,
    reward_primogems INTEGER NOT NULL DEFAULT 5,
    version_id TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category, order_index ASC);

CREATE TABLE IF NOT EXISTS profile_achievements (
    profile_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at DATETIME,
    notes TEXT,
    PRIMARY KEY (profile_id, achievement_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_achievements_profile ON profile_achievements(profile_id, completed);

-- 6. Atualiza versão do schema para 10
INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '10');
