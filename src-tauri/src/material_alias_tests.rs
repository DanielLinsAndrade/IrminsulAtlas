#[cfg(test)]
mod tests {
    use sqlx::{Connection, Executor, SqliteConnection};

    #[test]
    fn preserves_quantities_and_profiles_with_backup_and_idempotence() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE inventory_items(profile_id TEXT,material_id TEXT,quantity INTEGER,updated_at TEXT,PRIMARY KEY(profile_id,material_id)); INSERT INTO inventory_items VALUES ('a','material_mora',10,'2026'),('a','Mora',20,'2026'),('a','mat_mora',30,'2026'),('b','material_mora',4,'2026'),('a','unknown',7,'2026');").await.unwrap();
            let migration = include_str!("../migrations/016_material_aliases.sql");
            db.execute(migration).await.unwrap();
            let total: i64 = sqlx::query_scalar("SELECT quantity FROM inventory_items WHERE profile_id='a' AND material_id='material_mora'").fetch_one(&mut db).await.unwrap();
            assert_eq!(total, 60);
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inventory_items").fetch_one(&mut db).await.unwrap();
            assert_eq!(count, 3);
            let backup: String = sqlx::query_scalar("SELECT payload FROM inventory_alias_backup").fetch_one(&mut db).await.unwrap();
            assert_eq!(serde_json::from_str::<serde_json::Value>(&backup).unwrap().as_array().unwrap().len(), 3);
            db.execute(migration).await.unwrap();
            let repeated: i64 = sqlx::query_scalar("SELECT quantity FROM inventory_items WHERE profile_id='a' AND material_id='material_mora'").fetch_one(&mut db).await.unwrap();
            assert_eq!(repeated, 60);
        });
    }

    #[test]
    fn supports_empty_inventory() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE inventory_items(profile_id TEXT,material_id TEXT,quantity INTEGER,updated_at TEXT);").await.unwrap();
            db.execute(include_str!("../migrations/016_material_aliases.sql")).await.unwrap();
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inventory_items").fetch_one(&mut db).await.unwrap();
            assert_eq!(count, 0);
        });
    }

    #[test]
    fn agnidus_cleanup_is_backed_up_repeatable_and_profile_safe() {
        tauri::async_runtime::block_on(async {
            for populated in [false, true] {
                let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
                db.execute("PRAGMA foreign_keys=ON; CREATE TABLE materials(id TEXT PRIMARY KEY,game_key TEXT,name_pt_br TEXT,icon_url TEXT); CREATE TABLE inventory_items(profile_id TEXT,material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,quantity INTEGER,updated_at TEXT,PRIMARY KEY(profile_id,material_id));").await.unwrap();
                if populated {
                    db.execute("INSERT INTO materials VALUES ('material_agnidus_agate_chunk','AgnidusAgateChunk','Pedaço de Ágata Agnidus',NULL),('material_gem_pyro_chunk','pyro_gem_chunk','Pedaço de Ágata Agnidus','local.png'); INSERT INTO inventory_items VALUES ('a','material_agnidus_agate_chunk',3,'2025'),('a','material_gem_pyro_chunk',8,'2026'),('b','material_agnidus_agate_chunk',5,'2026');").await.unwrap();
                }
                for _ in 0..2 {
                    db.execute(include_str!("../migrations/019_agnidus_cleanup.sql")).await.unwrap();
                    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM materials WHERE name_pt_br='Pedaço de Ágata Agnidus'").fetch_one(&mut db).await.unwrap();
                    assert_eq!(count, if populated { 1 } else { 0 });
                    if populated {
                        let quantities: Vec<i64> = sqlx::query_scalar("SELECT quantity FROM inventory_items ORDER BY profile_id").fetch_all(&mut db).await.unwrap();
                        assert_eq!(quantities, vec![11, 5]);
                        let backup: String = sqlx::query_scalar("SELECT inventory_json FROM material_cleanup_backup WHERE migration_id='019_agnidus_cleanup'").fetch_one(&mut db).await.unwrap();
                        assert_eq!(serde_json::from_str::<serde_json::Value>(&backup).unwrap().as_array().unwrap().len(), 3);
                    }
                }
            }
        });
    }

    #[test]
    fn removes_only_explicit_catalog_aliases_and_preserves_stock() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("PRAGMA foreign_keys=ON; CREATE TABLE materials(id TEXT PRIMARY KEY,game_key TEXT,name_pt_br TEXT,icon_url TEXT); CREATE TABLE inventory_items(profile_id TEXT,material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,quantity INTEGER,updated_at TEXT,PRIMARY KEY(profile_id,material_id)); INSERT INTO materials VALUES ('material_cecilia','Cecilia','Cecília',NULL),('material_specialty_cecilia','cecilia','Cecília','local.png'),('unknown','unknown','Cecília',NULL); INSERT INTO inventory_items VALUES ('a','material_cecilia',2,'2025'),('a','material_specialty_cecilia',10,'2026'),('b','material_specialty_cecilia',7,'2026');").await.unwrap();
            let migration = include_str!("../migrations/017_material_catalog_cleanup.sql");
            for _ in 0..2 {
                db.execute(migration).await.unwrap();
                let total: i64 = sqlx::query_scalar("SELECT quantity FROM inventory_items WHERE profile_id='a'").fetch_one(&mut db).await.unwrap();
                assert_eq!(total, 12);
                let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM materials").fetch_one(&mut db).await.unwrap();
                assert_eq!(count, 2);
            }
            let backup: String = sqlx::query_scalar("SELECT inventory_json FROM material_cleanup_backup").fetch_one(&mut db).await.unwrap();
            assert_eq!(serde_json::from_str::<serde_json::Value>(&backup).unwrap().as_array().unwrap().len(), 3);
            let other: i64 = sqlx::query_scalar("SELECT quantity FROM inventory_items WHERE profile_id='b'").fetch_one(&mut db).await.unwrap();
            assert_eq!(other, 7);
        });
    }
}
