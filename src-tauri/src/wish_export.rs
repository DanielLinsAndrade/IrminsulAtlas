#[tauri::command]
pub async fn save_wish_history(content: String, filename: String) -> Result<bool, String> {
    let payload: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    if payload["format"] != "wishlog_wishes" || payload["schemaVersion"] != 1 {
        return Err("Formato de histórico inválido".into());
    }
    // The frontend cannot supply a destination path: only the user's dialog choice is used.
    let name = std::path::Path::new(&filename)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("irminsul-atlas-wishes.json");
    let Some(file) = rfd::AsyncFileDialog::new()
        .set_title("Exportar histórico de tiros")
        .add_filter("JSON", &["json"])
        .set_file_name(name)
        .save_file()
        .await
    else {
        return Ok(false);
    };
    file.write(content.as_bytes())
        .await
        .map_err(|e| format!("Falha ao salvar histórico: {e}"))?;
    Ok(true)
}
