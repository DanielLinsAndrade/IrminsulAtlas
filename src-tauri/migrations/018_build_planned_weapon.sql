-- Alvo do catálogo; não representa uma instância possuída nem cria inventário.
ALTER TABLE character_builds ADD COLUMN planned_weapon_id TEXT REFERENCES weapons(id) ON DELETE SET NULL;
