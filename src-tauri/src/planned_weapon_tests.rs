#[cfg(test)]
mod tests {
    use sqlx::{Connection, Executor, SqliteConnection};
    #[test]
    fn supports_empty_build_catalog() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE weapons(id TEXT PRIMARY KEY); CREATE TABLE character_builds(id TEXT PRIMARY KEY,account_weapon_id TEXT);").await.unwrap();
            db.execute(include_str!("../migrations/018_build_planned_weapon.sql")).await.unwrap();
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM character_builds").fetch_one(&mut db).await.unwrap();
            assert_eq!(count, 0);
        });
    }
    #[test]
    fn additive_planned_weapon_preserves_owned_link() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("PRAGMA foreign_keys=ON; CREATE TABLE weapons(id TEXT PRIMARY KEY); CREATE TABLE account_weapons(id TEXT PRIMARY KEY); CREATE TABLE character_builds(id TEXT PRIMARY KEY,account_weapon_id TEXT); INSERT INTO weapons VALUES ('target'); INSERT INTO account_weapons VALUES ('owned'); INSERT INTO character_builds VALUES ('existing','owned');").await.unwrap();
            db.execute(include_str!("../migrations/018_build_planned_weapon.sql")).await.unwrap();
            let target: Option<String> = sqlx::query_scalar("SELECT planned_weapon_id FROM character_builds").fetch_one(&mut db).await.unwrap();
            assert_eq!(target, None);
            db.execute("UPDATE character_builds SET planned_weapon_id='target'").await.unwrap();
            let owned: String = sqlx::query_scalar("SELECT account_weapon_id FROM character_builds").fetch_one(&mut db).await.unwrap();
            assert_eq!(owned, "owned");
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM account_weapons").fetch_one(&mut db).await.unwrap();
            assert_eq!(count, 1);
            assert!(db.execute("UPDATE character_builds SET planned_weapon_id='unknown'").await.is_err());
        });
    }
}
