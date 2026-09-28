use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg(test)]
mod tests {
    use sqlx::migrate::{Migration, MigrationType, Migrator};
    use sqlx::{Connection, SqliteConnection};
    use std::borrow::Cow;

    fn runner(through: i64) -> Migrator {
        Migrator {
            migrations: Cow::Owned(
                super::all()
                    .into_iter()
                    .filter(|m| m.version <= through)
                    .map(|m| {
                        Migration::new(
                            m.version,
                            m.description.into(),
                            MigrationType::Simple,
                            m.sql.into(),
                            false,
                        )
                    })
                    .collect(),
            ),
            ..Migrator::DEFAULT
        }
    }

    async fn assert_current(db: &mut SqliteConnection) {
        runner(22).run(&mut *db).await.unwrap();
        runner(22).run(&mut *db).await.unwrap();
        assert_eq!(
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM _sqlx_migrations WHERE success=1")
                .fetch_one(&mut *db)
                .await
                .unwrap(),
            22
        );
        assert_eq!(
            sqlx::query_scalar::<_, i64>("SELECT COUNT(DISTINCT id) FROM achievements")
                .fetch_one(&mut *db)
                .await
                .unwrap(),
            1844
        );
        assert_eq!(
            sqlx::query_scalar::<_, String>("PRAGMA integrity_check")
                .fetch_one(&mut *db)
                .await
                .unwrap(),
            "ok"
        );
        assert!(sqlx::query("PRAGMA foreign_key_check")
            .fetch_all(&mut *db)
            .await
            .unwrap()
            .is_empty());
    }

    #[test]
    fn clean_and_historical_schemas_upgrade_with_real_checksums() {
        tauri::async_runtime::block_on(async {
            for version in [0, 5, 8, 9, 12, 17, 21] {
                let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
                runner(version).run(&mut db).await.unwrap();
                if version > 0 {
                    sqlx::query("INSERT INTO profiles(id,name,notes) VALUES ('stage23','Preserved','fixture')").execute(&mut db).await.unwrap();
                    sqlx::query("INSERT INTO app_settings(key,value) VALUES ('stage23_setting','preserved')").execute(&mut db).await.unwrap();
                }
                assert_current(&mut db).await;
                if version > 0 {
                    assert_eq!(
                        sqlx::query_scalar::<_, String>(
                            "SELECT notes FROM profiles WHERE id='stage23'"
                        )
                        .fetch_one(&mut db)
                        .await
                        .unwrap(),
                        "fixture"
                    );
                    assert_eq!(
                        sqlx::query_scalar::<_, String>(
                            "SELECT value FROM app_settings WHERE key='stage23_setting'"
                        )
                        .fetch_one(&mut db)
                        .await
                        .unwrap(),
                        "preserved"
                    );
                }
            }
        });
    }

    #[test]
    fn migration_nine_compat_runs_when_six_is_already_applied() {
        tauri::async_runtime::block_on(async {
            let id = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let path = std::env::temp_dir().join(format!("wishlog-stage23-{id}.db"));
            let options = sqlx::sqlite::SqliteConnectOptions::new()
                .filename(&path)
                .create_if_missing(true)
                .foreign_keys(true);
            let mut db = SqliteConnection::connect_with(&options).await.unwrap();
            runner(8).run(&mut db).await.unwrap();
            sqlx::query(
                "ALTER TABLE character_builds ADD COLUMN farm_enabled INTEGER NOT NULL DEFAULT 1",
            )
            .execute(&mut db)
            .await
            .unwrap();
            db.close().await.unwrap();
            crate::migration_compat::ensure_database_schema_compatibility(&path)
                .await
                .unwrap();
            crate::migration_compat::ensure_database_schema_compatibility(&path)
                .await
                .unwrap();
            let mut db = SqliteConnection::connect_with(&options).await.unwrap();
            assert_current(&mut db).await;
            db.close().await.unwrap();
            std::fs::remove_file(path).unwrap();
        });
    }
}

pub fn all() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../migrations/001_initial_schema.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "catalog_and_assets",
            sql: include_str!("../migrations/002_catalog_and_assets.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "catalog_metadata_and_artifacts",
            sql: include_str!("../migrations/003_catalog_metadata_and_artifacts.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "resources_and_inventory",
            sql: include_str!("../migrations/004_resources_and_inventory.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "account_characters",
            sql: include_str!("../migrations/005_account_characters.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "catalog_asset_columns",
            sql: include_str!("../migrations/006_catalog_asset_columns.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "account_weapons",
            sql: include_str!("../migrations/007_account_weapons.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "character_builds",
            sql: include_str!("../migrations/008_character_builds.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "farm_and_evolution_planning",
            sql: include_str!("../migrations/009_farm_and_evolution_planning.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "wishes_and_goals",
            sql: include_str!("../migrations/010_wishes_and_goals.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "wish_sequence_no",
            sql: include_str!("../migrations/011_wish_sequence_no.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "banner_pity_state",
            sql: include_str!("../migrations/012_banner_pity_state.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "canonical_achievements",
            sql: include_str!("../migrations/013_canonical_achievements.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 14,
            description: "weapon_fate",
            sql: include_str!("../migrations/014_weapon_fate.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 15,
            description: "weapon_path_result",
            sql: include_str!("../migrations/015_weapon_path_result.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 16,
            description: "material_aliases",
            sql: include_str!("../migrations/016_material_aliases.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 17,
            description: "material_catalog_cleanup",
            sql: include_str!("../migrations/017_material_catalog_cleanup.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 18,
            description: "build_planned_weapon",
            sql: include_str!("../migrations/018_build_planned_weapon.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 19,
            description: "agnidus_cleanup",
            sql: include_str!("../migrations/019_agnidus_cleanup.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 20,
            description: "character_combat_stats",
            sql: include_str!("../migrations/020_character_combat_stats.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 21,
            description: "artifact_substats",
            sql: include_str!("../migrations/021_artifact_substats.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 22,
            description: "traveler_exclusivity",
            sql: include_str!("../migrations/022_traveler_exclusivity.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
