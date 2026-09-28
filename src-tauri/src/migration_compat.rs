use std::collections::HashSet;
use std::path::Path;
use sha2::{Digest, Sha384};
use sqlx::{Connection, Executor, Row, SqliteConnection};

pub const MIGRATION_6_SQL: &str = include_str!("../migrations/006_catalog_asset_columns.sql");
pub const MIGRATION_9_SQL: &str = include_str!("../migrations/009_farm_and_evolution_planning.sql");

pub fn compute_migration_checksum(sql: &str) -> Vec<u8> {
    Sha384::digest(sql.as_bytes()).to_vec()
}

/// Garante compatibilidade do schema em bancos existentes antes da execução das migrações do SQLx.
///
/// Previne a falha de inicialização `duplicate column name: icon_url` que ocorre quando
/// colunas como `icon_url` ou `splash_url` já foram criadas em versões prévias do WishLog
/// sem que a migração 6 tenha sido registrada no `_sqlx_migrations`.
///
/// Não utiliza try/catch cego: toda adição de coluna é precedida de verificação explícita
/// via `PRAGMA table_info`.
pub async fn ensure_database_schema_compatibility(
    db_path: &Path,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if !db_path.exists() {
        return Ok(());
    }

    let conn_str = format!("sqlite:{}", db_path.to_string_lossy());
    let mut conn = SqliteConnection::connect(&conn_str).await?;

    // Verifica se a tabela interna de migrações do plugin sqlx existe
    let table_exists: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='_sqlx_migrations'",
    )
    .fetch_one(&mut conn)
    .await?;

    if !table_exists {
        return Ok(());
    }

    // Verifica se a migração 6 já foi instalada
    let migration_6_applied: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM _sqlx_migrations WHERE version = 6",
    )
    .fetch_one(&mut conn)
    .await?;

    // Verifica se a tabela characters existe
    let characters_exists: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='characters'",
    )
    .fetch_one(&mut conn)
    .await?;

    if !characters_exists {
        return Ok(());
    }

    // Lê colunas existentes de characters
    let char_rows = sqlx::query("PRAGMA table_info(characters)")
        .fetch_all(&mut conn)
        .await?;
    let char_cols: HashSet<String> = char_rows
        .into_iter()
        .map(|r| r.get::<String, _>("name"))
        .collect();

    // Lê colunas existentes de weapons se a tabela existir
    let weapons_exists: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='weapons'",
    )
    .fetch_one(&mut conn)
    .await?;
    let wpn_cols: HashSet<String> = if weapons_exists {
        let wpn_rows = sqlx::query("PRAGMA table_info(weapons)")
            .fetch_all(&mut conn)
            .await?;
        wpn_rows
            .into_iter()
            .map(|r| r.get::<String, _>("name"))
            .collect()
    } else {
        HashSet::new()
    };

    // Lê colunas existentes de materials se a tabela existir
    let materials_exists: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='materials'",
    )
    .fetch_one(&mut conn)
    .await?;
    let mat_cols: HashSet<String> = if materials_exists {
        let mat_rows = sqlx::query("PRAGMA table_info(materials)")
            .fetch_all(&mut conn)
            .await?;
        mat_rows
            .into_iter()
            .map(|r| r.get::<String, _>("name"))
            .collect()
    } else {
        HashSet::new()
    };

    // Se alguma das colunas do Migration 6 já estiver presente, o banco possui histórico
    // parcial de colunas. Executar `006_catalog_asset_columns.sql` diretamente causará
    // `duplicate column name`. Realizamos a normalização idempotente com pré-condições verificadas.
    let has_pre_existing_asset_cols = char_cols.contains("icon_url")
        || char_cols.contains("splash_url")
        || wpn_cols.contains("icon_url")
        || mat_cols.contains("icon_url");

    if !migration_6_applied && has_pre_existing_asset_cols {
        let mut tx = conn.begin().await?;

        // 1. Normaliza tabela characters
        if !char_cols.contains("icon_url") {
            tx.execute("ALTER TABLE characters ADD COLUMN icon_url TEXT").await?;
        }
        if !char_cols.contains("splash_url") {
            tx.execute("ALTER TABLE characters ADD COLUMN splash_url TEXT").await?;
        }
        if !char_cols.contains("region") {
            tx.execute("ALTER TABLE characters ADD COLUMN region TEXT").await?;
        }
        if !char_cols.contains("max_constellation") {
            tx.execute("ALTER TABLE characters ADD COLUMN max_constellation INTEGER DEFAULT 6").await?;
        }
        if !char_cols.contains("supports_friendship") {
            tx.execute("ALTER TABLE characters ADD COLUMN supports_friendship INTEGER DEFAULT 1").await?;
        }

        // 2. Normaliza tabela weapons
        if weapons_exists && !wpn_cols.contains("icon_url") {
            tx.execute("ALTER TABLE weapons ADD COLUMN icon_url TEXT").await?;
        }

        // 3. Normaliza tabela materials
        if materials_exists && !mat_cols.contains("icon_url") {
            tx.execute("ALTER TABLE materials ADD COLUMN icon_url TEXT").await?;
        }

        // 4. Atualiza schema_metadata se a tabela existir
        let has_schema_metadata: bool = sqlx::query_scalar(
            "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='schema_metadata'",
        )
        .fetch_one(&mut *tx)
        .await?;

        if has_schema_metadata {
            tx.execute(
                "UPDATE schema_metadata SET value = '6', updated_at = CURRENT_TIMESTAMP WHERE key = 'schema_version'",
            )
            .await?;
        }

        // 5. Registra formalmente a migração 6 no _sqlx_migrations com o checksum esperado pelo SQLx
        let checksum = compute_migration_checksum(MIGRATION_6_SQL);
        sqlx::query(
            "INSERT INTO _sqlx_migrations (version, description, installed_on, success, checksum, execution_time) \
             VALUES (6, 'catalog_asset_columns', CURRENT_TIMESTAMP, 1, ?1, 0)",
        )
        .bind(checksum)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
    }

    // Verifica compatibilidade da migração 9 (farm_and_evolution_planning)
    let migration_9_applied: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM _sqlx_migrations WHERE version = 9",
    )
    .fetch_one(&mut conn)
    .await?;

    if !migration_9_applied {
        let builds_exists: bool = sqlx::query_scalar(
            "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='character_builds'",
        )
        .fetch_one(&mut conn)
        .await?;

        if builds_exists {
            let build_rows = sqlx::query("PRAGMA table_info(character_builds)")
                .fetch_all(&mut conn)
                .await?;
            let build_cols: HashSet<String> = build_rows
                .into_iter()
                .map(|r| r.get::<String, _>("name"))
                .collect();

            if build_cols.contains("farm_enabled") {
                let mut tx = conn.begin().await?;

                if !build_cols.contains("character_target_ascension") {
                    tx.execute("ALTER TABLE character_builds ADD COLUMN character_target_ascension INTEGER NOT NULL DEFAULT 6").await?;
                }
                if !build_cols.contains("weapon_target_ascension") {
                    tx.execute("ALTER TABLE character_builds ADD COLUMN weapon_target_ascension INTEGER NOT NULL DEFAULT 6").await?;
                }
                tx.execute("CREATE INDEX IF NOT EXISTS idx_character_builds_farm ON character_builds(farm_enabled)").await?;

                let has_schema_metadata: bool = sqlx::query_scalar(
                    "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='schema_metadata'",
                )
                .fetch_one(&mut *tx)
                .await?;

                if has_schema_metadata {
                    tx.execute(
                        "UPDATE schema_metadata SET value = '9', updated_at = CURRENT_TIMESTAMP WHERE key = 'schema_version'",
                    )
                    .await?;
                }

                let checksum = compute_migration_checksum(MIGRATION_9_SQL);
                sqlx::query(
                    "INSERT INTO _sqlx_migrations (version, description, installed_on, success, checksum, execution_time) \
                     VALUES (9, 'farm_and_evolution_planning', CURRENT_TIMESTAMP, 1, ?1, 0)",
                )
                .bind(checksum)
                .execute(&mut *tx)
                .await?;

                tx.commit().await?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_database_does_nothing() {
        tauri::async_runtime::block_on(async {
            let db_path = std::env::temp_dir().join("wishlog_test_non_existent.db");
            if db_path.exists() {
                let _ = std::fs::remove_file(&db_path);
            }
            let res = ensure_database_schema_compatibility(&db_path).await;
            assert!(res.is_ok());
        });
    }

    #[test]
    fn test_pre_existing_icon_url_is_safely_upgraded() {
        tauri::async_runtime::block_on(async {
            let test_id = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let db_path = std::env::temp_dir().join(format!("wishlog_test_{}.db", test_id));
            if db_path.exists() {
                let _ = std::fs::remove_file(&db_path);
            }
            let conn_str = format!("sqlite:{}?mode=rwc", db_path.to_string_lossy());

            let mut file_conn = SqliteConnection::connect(&conn_str).await.unwrap();

            // Replica schema prévio das migrações 1 a 5 com icon_url já adicionado
            sqlx::query("CREATE TABLE _sqlx_migrations (version BIGINT PRIMARY KEY, description TEXT NOT NULL, installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, success BOOLEAN NOT NULL, checksum BLOB NOT NULL, execution_time BIGINT NOT NULL)").execute(&mut file_conn).await.unwrap();
            for v in 1..=5 {
                sqlx::query("INSERT INTO _sqlx_migrations VALUES (?1, 'test', CURRENT_TIMESTAMP, 1, X'00', 0)").bind(v).execute(&mut file_conn).await.unwrap();
            }
            sqlx::query("CREATE TABLE characters (id TEXT PRIMARY KEY, game_key TEXT NOT NULL, name_pt_br TEXT NOT NULL, rarity INTEGER NOT NULL, element TEXT NOT NULL, weapon_type TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, icon_url TEXT, splash_url TEXT)").execute(&mut file_conn).await.unwrap();
            sqlx::query("CREATE TABLE weapons (id TEXT PRIMARY KEY, game_key TEXT NOT NULL, name_pt_br TEXT NOT NULL, rarity INTEGER NOT NULL, weapon_type TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, icon_url TEXT)").execute(&mut file_conn).await.unwrap();
            sqlx::query("CREATE TABLE materials (id TEXT PRIMARY KEY, game_key TEXT NOT NULL, name_pt_br TEXT NOT NULL, category TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, icon_url TEXT)").execute(&mut file_conn).await.unwrap();
            sqlx::query("CREATE TABLE schema_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").execute(&mut file_conn).await.unwrap();
            sqlx::query("INSERT INTO schema_metadata VALUES ('schema_version', '5', CURRENT_TIMESTAMP)").execute(&mut file_conn).await.unwrap();
            sqlx::query("INSERT INTO characters (id, game_key, name_pt_br, rarity, element, weapon_type, icon_url) VALUES ('c1', 'furina', 'Furina', 5, 'hydro', 'sword', 'https://icon.png')").execute(&mut file_conn).await.unwrap();
            drop(file_conn);

            // Executa a função de compatibilidade
            ensure_database_schema_compatibility(&db_path).await.unwrap();

            // Reabre conexão e valida que:
            // 1. migration 6 foi inserida no _sqlx_migrations com sucesso
            // 2. colunas region, max_constellation e supports_friendship foram adicionadas
            // 3. icon_url original foi preservada
            // 4. schema_version é '6'
            let mut check_conn = SqliteConnection::connect(&conn_str).await.unwrap();
            let m6_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM _sqlx_migrations WHERE version = 6").fetch_one(&mut check_conn).await.unwrap();
            assert_eq!(m6_count, 1);

            let char_rows = sqlx::query("PRAGMA table_info(characters)").fetch_all(&mut check_conn).await.unwrap();
            let cols: HashSet<String> = char_rows.into_iter().map(|r| r.get::<String, _>("name")).collect();
            assert!(cols.contains("icon_url"));
            assert!(cols.contains("splash_url"));
            assert!(cols.contains("region"));
            assert!(cols.contains("max_constellation"));
            assert!(cols.contains("supports_friendship"));

            let icon: String = sqlx::query_scalar("SELECT icon_url FROM characters WHERE id = 'c1'").fetch_one(&mut check_conn).await.unwrap();
            assert_eq!(icon, "https://icon.png");

            let schema_ver: String = sqlx::query_scalar("SELECT value FROM schema_metadata WHERE key = 'schema_version'").fetch_one(&mut check_conn).await.unwrap();
            assert_eq!(schema_ver, "6");

            // Execução repetida não causa erro nem duplica entradas
            drop(check_conn);
            ensure_database_schema_compatibility(&db_path).await.unwrap();
            let _ = std::fs::remove_file(&db_path);
        });
    }
}
