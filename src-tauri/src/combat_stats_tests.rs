#[cfg(test)]
mod tests {
    use sqlx::{Connection, Executor, SqliteConnection};

    #[test]
    fn combat_stats_migration_preserves_canonical_progress() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE account_characters(id TEXT PRIMARY KEY, constellation INTEGER); INSERT INTO account_characters VALUES('chiori',2);").await.unwrap();
            db.execute(include_str!("../migrations/020_character_combat_stats.sql")).await.unwrap();
            let stats: Option<String> = sqlx::query_scalar("SELECT combat_stats FROM account_characters").fetch_one(&mut db).await.unwrap();
            assert_eq!(stats, None);
            let constellation: i64 = sqlx::query_scalar("SELECT constellation FROM account_characters").fetch_one(&mut db).await.unwrap();
            assert_eq!(constellation, 2);
            db.execute("UPDATE account_characters SET combat_stats='{\"hp\":20000}'").await.unwrap();
            let saved: String = sqlx::query_scalar("SELECT combat_stats FROM account_characters").fetch_one(&mut db).await.unwrap();
            assert_eq!(saved, "{\"hp\":20000}");
        });
    }

    #[test]
    fn combat_stats_migration_accepts_empty_database() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE account_characters(id TEXT PRIMARY KEY, constellation INTEGER);").await.unwrap();
            db.execute(include_str!("../migrations/020_character_combat_stats.sql")).await.unwrap();
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM account_characters").fetch_one(&mut db).await.unwrap();
            assert_eq!(count, 0);
        });
    }
}
