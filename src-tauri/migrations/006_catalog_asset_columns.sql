-- WishLog: Migração 006 - Adiciona colunas icon_url, splash_url, region e capacidades ao catálogo
-- Conforme SPEC.md e ARCHITECTURE.md

ALTER TABLE characters ADD COLUMN icon_url TEXT;
ALTER TABLE characters ADD COLUMN splash_url TEXT;
ALTER TABLE characters ADD COLUMN region TEXT;
ALTER TABLE characters ADD COLUMN max_constellation INTEGER DEFAULT 6;
ALTER TABLE characters ADD COLUMN supports_friendship INTEGER DEFAULT 1;

ALTER TABLE weapons ADD COLUMN icon_url TEXT;
ALTER TABLE materials ADD COLUMN icon_url TEXT;

UPDATE schema_metadata SET value = '6', updated_at = CURRENT_TIMESTAMP WHERE key = 'schema_version';
