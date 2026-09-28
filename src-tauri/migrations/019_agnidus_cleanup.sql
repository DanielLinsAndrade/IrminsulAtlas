-- Pares explícitos de identidade; não agrupar nomes traduzidos.
CREATE TEMP TABLE material_aliases_019 (old_id TEXT PRIMARY KEY, canonical_id TEXT NOT NULL);
INSERT INTO material_aliases_019 VALUES
('material_agnidus_agate_chunk','material_gem_pyro_chunk');
DELETE FROM material_aliases_019 WHERE canonical_id NOT IN (SELECT id FROM materials);
CREATE TABLE IF NOT EXISTS material_cleanup_backup (
 migration_id TEXT PRIMARY KEY, catalog_json TEXT NOT NULL,
 inventory_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO material_cleanup_backup(migration_id,catalog_json,inventory_json)
SELECT '019_agnidus_cleanup',
 (SELECT COALESCE(json_group_array(json_object('id',m.id,'gameKey',m.game_key,'namePtBr',m.name_pt_br,'iconUrl',m.icon_url)), '[]') FROM materials m JOIN material_aliases_019 a ON m.id=a.old_id),
 (SELECT COALESCE(json_group_array(json_object('profileId',i.profile_id,'materialId',i.material_id,'quantity',i.quantity,'updatedAt',i.updated_at)), '[]') FROM inventory_items i WHERE i.material_id IN (SELECT old_id FROM material_aliases_019 UNION SELECT canonical_id FROM material_aliases_019));
INSERT INTO inventory_items(profile_id,material_id,quantity,updated_at)
SELECT i.profile_id,a.canonical_id,i.quantity,i.updated_at FROM inventory_items i
JOIN material_aliases_019 a ON i.material_id=a.old_id WHERE 1
ON CONFLICT(profile_id,material_id) DO UPDATE SET
quantity=inventory_items.quantity+excluded.quantity,
updated_at=MAX(inventory_items.updated_at,excluded.updated_at);
DELETE FROM inventory_items WHERE material_id IN (SELECT old_id FROM material_aliases_019);
DELETE FROM materials WHERE id IN (SELECT old_id FROM material_aliases_019);
DROP TABLE material_aliases_019;
