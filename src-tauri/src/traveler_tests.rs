#[cfg(test)]
mod tests {
    use sqlx::{Connection, Executor, SqliteConnection};
    async fn setup() -> SqliteConnection {
        let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
        db.execute(r#"CREATE TABLE profiles(id TEXT PRIMARY KEY, traveler_gender TEXT, avatar_character_id TEXT); CREATE TABLE app_settings(key TEXT PRIMARY KEY,value TEXT,updated_at TEXT); CREATE TABLE account_characters(id TEXT PRIMARY KEY,profile_id TEXT,character_id TEXT,owned TEXT,constellation TEXT,level TEXT,ascension TEXT,friendship TEXT,notes TEXT,created_at TEXT,updated_at TEXT,combat_stats TEXT); CREATE TABLE character_builds(id TEXT PRIMARY KEY,profile_id TEXT,character_id TEXT,status TEXT,account_weapon_id TEXT,weapon_target_level TEXT,character_target_level TEXT,normal_attack_level TEXT,normal_attack_target TEXT,elemental_skill_level TEXT,elemental_skill_target TEXT,elemental_burst_level TEXT,elemental_burst_target TEXT,notes TEXT,created_at TEXT,updated_at TEXT,farm_enabled TEXT,character_target_ascension TEXT,weapon_target_ascension TEXT,farm_priority TEXT,farm_status TEXT,planned_weapon_id TEXT); CREATE TABLE build_artifact_slots(id TEXT PRIMARY KEY,build_id TEXT,slot_key TEXT,set_id TEXT,main_stat TEXT,level TEXT,target_level TEXT,is_equipped TEXT,rarity TEXT,notes TEXT,created_at TEXT,updated_at TEXT,substats TEXT); CREATE TABLE account_weapons(id TEXT PRIMARY KEY,profile_id TEXT,weapon_id TEXT,instance_no TEXT,level TEXT,ascension TEXT,refinement TEXT,equipped_character_id TEXT,favorite TEXT,notes TEXT,created_at TEXT,updated_at TEXT); "#).await.unwrap();
        db
    }
    #[test]
    fn traveler_migration_and_switch_are_safe() {
        tauri::async_runtime::block_on(async {
            for configured in [Some("aether"), Some("lumine"), None] {
                let mut db = setup().await;
                sqlx::query("INSERT INTO profiles VALUES('p',$1,NULL)")
                    .bind(configured)
                    .execute(&mut db)
                    .await
                    .unwrap();
                for gender in ["aether", "lumine"] {
                    sqlx::query("INSERT INTO account_characters(id,profile_id,character_id,level) VALUES($1,'p',$2,'80')").bind(gender).bind(format!("character_{gender}")).execute(&mut db).await.unwrap();
                    sqlx::query("INSERT INTO character_builds(id,profile_id,character_id) VALUES($1,'p',$2)").bind(gender).bind(format!("character_{gender}")).execute(&mut db).await.unwrap();
                    sqlx::query(r#"INSERT INTO build_artifact_slots(id,build_id,substats) VALUES($1,$1,'["critRate"]')"#).bind(gender).execute(&mut db).await.unwrap();
                }
                db.execute(include_str!("../migrations/022_traveler_exclusivity.sql"))
                    .await
                    .unwrap();
                let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM account_characters")
                    .fetch_one(&mut db)
                    .await
                    .unwrap();
                assert_eq!(count, if configured.is_some() { 1 } else { 0 });
                let archive: String = sqlx::query_scalar(
                    "SELECT value FROM app_settings WHERE key='traveler_archive:p'",
                )
                .fetch_one(&mut db)
                .await
                .unwrap();
                let archive: serde_json::Value = serde_json::from_str(&archive).unwrap();
                assert!(archive[0]["characters"].is_array());
                assert_eq!(
                    archive[0]["characters"].as_array().unwrap().len(),
                    if configured.is_some() { 1 } else { 2 }
                );
                assert!(archive[0]["slots"][0]["substats"]
                    .as_str()
                    .unwrap()
                    .contains("critRate"));
                db.execute("UPDATE profiles SET traveler_gender='aether' WHERE id='p'")
                    .await
                    .unwrap();
                assert!(db.execute("INSERT INTO account_characters(id,profile_id,character_id) VALUES('bad','p','character_lumine')").await.is_err());
                assert!(db.execute("INSERT INTO character_builds(id,profile_id,character_id) VALUES('bad','p','character_lumine')").await.is_err());
                db.execute("UPDATE profiles SET traveler_gender='lumine' WHERE id='p'")
                    .await
                    .unwrap();
                let remaining: i64 = sqlx::query_scalar(
                    "SELECT COUNT(*) FROM account_characters WHERE character_id='character_aether'",
                )
                .fetch_one(&mut db)
                .await
                .unwrap();
                assert_eq!(remaining, 0);
            }
        });
    }
    #[test]
    fn traveler_empty_database_infers_first_registration_and_backup_failure_rolls_back() {
        tauri::async_runtime::block_on(async {
            let mut db = setup().await;
            db.execute(include_str!("../migrations/022_traveler_exclusivity.sql"))
                .await
                .unwrap();
            db.execute("INSERT INTO profiles VALUES('p',NULL,NULL); INSERT INTO account_characters(id,profile_id,character_id) VALUES('a','p','character_aether');").await.unwrap();
            let gender: String = sqlx::query_scalar("SELECT traveler_gender FROM profiles")
                .fetch_one(&mut db)
                .await
                .unwrap();
            assert_eq!(gender, "aether");
            db.execute("CREATE TRIGGER reject_archive BEFORE INSERT ON app_settings BEGIN SELECT RAISE(ABORT,'test archive failure'); END;").await.unwrap();
            assert!(db
                .execute("UPDATE profiles SET traveler_gender='lumine' WHERE id='p'")
                .await
                .is_err());
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM account_characters")
                .fetch_one(&mut db)
                .await
                .unwrap();
            assert_eq!(count, 1);
            let gender: String = sqlx::query_scalar("SELECT traveler_gender FROM profiles")
                .fetch_one(&mut db)
                .await
                .unwrap();
            assert_eq!(gender, "aether");
        });
    }
}
