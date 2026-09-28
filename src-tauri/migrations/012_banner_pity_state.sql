-- WishLog Migration 012 - banner_pity_state
-- Armazenamento independente do estado atual de pity de cada tipo de banner por perfil.

CREATE TABLE IF NOT EXISTS banner_pity_states (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  banner_type TEXT NOT NULL,
  current_5star_pity INTEGER NOT NULL DEFAULT 0,
  current_4star_pity INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, banner_type)
);

CREATE INDEX IF NOT EXISTS idx_banner_pity_states_profile ON banner_pity_states(profile_id);
