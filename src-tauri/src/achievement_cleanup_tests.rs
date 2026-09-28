#[cfg(test)]
mod tests {
    use sqlx::{Connection, Executor, SqliteConnection};
    #[test]
    fn additive_weapon_states_preserve_history_and_enforce_banner_constraints() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE wish_entries(id TEXT PRIMARY KEY, banner_type TEXT, pity_index INTEGER, sequence_no INTEGER); INSERT INTO wish_entries VALUES('old','weapon',72,15);").await.unwrap();
            db.execute(include_str!("../migrations/014_weapon_fate.sql")).await.unwrap();
            db.execute(include_str!("../migrations/015_weapon_path_result.sql")).await.unwrap();
            let old: (i64,i64,Option<String>,Option<String>) = sqlx::query_as("SELECT pity_index,sequence_no,weapon_fate_state,weapon_path_result FROM wish_entries WHERE id='old'").fetch_one(&mut db).await.unwrap();
            assert_eq!(old,(72,15,None,None));
            for state in ["none","current_1","current_2","legacy_1","legacy_2","legacy_3"] {
                sqlx::query("UPDATE wish_entries SET weapon_fate_state=?,weapon_path_result='lost' WHERE id='old'").bind(state).execute(&mut db).await.unwrap();
            }
            assert!(db.execute("UPDATE wish_entries SET banner_type='character' WHERE id='old'").await.is_err());
            assert!(db.execute("UPDATE wish_entries SET weapon_path_result='invalid' WHERE id='old'").await.is_err());
            assert!(db.execute("UPDATE wish_entries SET weapon_fate_state='invalid' WHERE id='old'").await.is_err());
        });
    }
    #[test]
    fn canonical_cleanup_supports_empty_database_and_transaction_rollback() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE achievements(id TEXT PRIMARY KEY, category TEXT, name_pt_br TEXT, description_pt_br TEXT, reward_primogems INTEGER, version_id TEXT, order_index INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE profile_achievements(profile_id TEXT,achievement_id TEXT,completed INTEGER,completed_at TEXT,notes TEXT);").await.unwrap();
            let mut tx = db.begin().await.unwrap();
            tx.execute(include_str!("../migrations/013_canonical_achievements.sql")).await.unwrap();
            tx.rollback().await.unwrap();
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM achievements").fetch_one(&mut db).await.unwrap();
            assert_eq!(count,0);
            db.execute(include_str!("../migrations/013_canonical_achievements.sql")).await.unwrap();
            let count: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT id) FROM achievements").fetch_one(&mut db).await.unwrap();
            assert_eq!(count,1844);
        });
    }
    #[test]
    fn canonical_cleanup_preserves_dates_backs_up_removed_records_and_is_repeatable() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            db.execute("CREATE TABLE achievements(id TEXT PRIMARY KEY, category TEXT, name_pt_br TEXT, description_pt_br TEXT, reward_primogems INTEGER, version_id TEXT, order_index INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE profile_achievements(profile_id TEXT,achievement_id TEXT,completed INTEGER,completed_at TEXT,notes TEXT);").await.unwrap();
            db.execute("INSERT INTO achievements VALUES('80001','old','Books','ambiguous',5,'1.0',1,'old'),('gi_80001','canonical','Dandelion','Anemo',5,'1.0',1,'old'); INSERT INTO profile_achievements VALUES('p','80001',1,'2020-01-01','old'),('p','orphan',1,'2021-01-01','orphan'),('p','gi_80001',1,'2022-01-01','keep');").await.unwrap();
            for _ in 0..2 {
                let mut tx = db.begin().await.unwrap();
                tx.execute(include_str!("../migrations/013_canonical_achievements.sql")).await.unwrap();
                tx.commit().await.unwrap();
                let count: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT id) FROM achievements").fetch_one(&mut db).await.unwrap();
                assert_eq!(count,1844);
                let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM profile_achievements").fetch_one(&mut db).await.unwrap();
                assert_eq!(count,1);
                let date: String = sqlx::query_scalar("SELECT completed_at FROM profile_achievements").fetch_one(&mut db).await.unwrap();
                assert_eq!(date,"2022-01-01");
                let backup: String = sqlx::query_scalar("SELECT payload FROM achievement_cleanup_backup").fetch_one(&mut db).await.unwrap();
                let backup: serde_json::Value = serde_json::from_str(&backup).unwrap();
                assert_eq!(backup["catalog"].as_array().unwrap().len(),1);
                assert_eq!(backup["progress"].as_array().unwrap().len(),2);
            }
        });
    }
}
