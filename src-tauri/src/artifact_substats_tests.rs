#[cfg(test)]
mod tests {
    use sqlx::{Connection, Executor, SqliteConnection};
    #[test]
    fn substats_migration_empty_and_upgrade_preserve_slots() {
        tauri::async_runtime::block_on(async {
            for existing in [false, true] {
                let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
                db.execute("CREATE TABLE build_artifact_slots(id TEXT PRIMARY KEY, level INTEGER);").await.unwrap();
                if existing { db.execute("INSERT INTO build_artifact_slots VALUES('flower',16)").await.unwrap(); }
                db.execute(include_str!("../migrations/021_artifact_substats.sql")).await.unwrap();
                let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM build_artifact_slots").fetch_one(&mut db).await.unwrap();
                assert_eq!(count, if existing { 1 } else { 0 });
                if existing {
                    let row: (i64, String) = sqlx::query_as("SELECT level, substats FROM build_artifact_slots").fetch_one(&mut db).await.unwrap();
                    assert_eq!(row, (16, "[]".into()));
                    db.execute("UPDATE build_artifact_slots SET substats='[\"critRate\"]'").await.unwrap();
                    let saved: String = sqlx::query_scalar("SELECT substats FROM build_artifact_slots").fetch_one(&mut db).await.unwrap();
                    assert_eq!(saved, "[\"critRate\"]");
                }
            }
        });
    }
}
