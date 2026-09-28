use std::fs;
mod wish_export;
mod sql_transaction;
mod achievement_cleanup_tests;
mod combat_stats_tests;
mod artifact_substats_tests;
mod traveler_tests;
use tauri::Manager;
mod migrations;

#[tauri::command]
fn save_cached_asset_file(
    app: tauri::AppHandle,
    entity_type: String,
    filename: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("assets")
        .join(&entity_type);
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    let file_path = cache_dir.join(&filename);
    fs::write(&file_path, data).map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_cached_asset_file_path(
    app: tauri::AppHandle,
    entity_type: String,
    filename: String,
) -> Result<Option<String>, String> {
    let file_path = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("assets")
        .join(&entity_type)
        .join(&filename);
    if file_path.exists() {
        Ok(Some(file_path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn clear_asset_cache_files(app: tauri::AppHandle) -> Result<(), String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("assets");
    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

mod migration_compat;
#[cfg(test)]
mod material_alias_tests;
#[cfg(test)]
mod planned_weapon_tests;
mod public_profile;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = migrations::all();

    let compat_plugin = tauri::plugin::Builder::<tauri::Wry>::new("migration_compat")
        .setup(|app, _api| {
            if let Ok(app_path) = app.path().app_config_dir() {
                let db_path = app_path.join("wishlog.db");
                if db_path.exists() {
                    tauri::async_runtime::block_on(async {
                        if let Err(e) =
                            migration_compat::ensure_database_schema_compatibility(&db_path).await
                        {
                            eprintln!(
                                "[WishLog Migrations] Error during pre-migration compat: {}",
                                e
                            );
                        }
                    });
                }
            }
            Ok(())
        })
        .build();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(compat_plugin)
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:wishlog.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            sql_transaction::execute_sql_transaction,
            wish_export::save_wish_history,
            public_profile::fetch_public_profile,
            save_cached_asset_file,
            get_cached_asset_file_path,
            clear_asset_cache_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
