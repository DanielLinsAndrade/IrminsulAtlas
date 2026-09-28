-- WishLog: Migração 011 - Ordem Histórica Estável (sequence_no) em wish_entries
-- Permite preservação exata da ordem histórica ao editar ou excluir registros.

ALTER TABLE wish_entries ADD COLUMN sequence_no INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_wish_entries_sequence ON wish_entries(profile_id, sequence_no DESC);
