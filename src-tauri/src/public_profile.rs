#[tauri::command]
pub async fn fetch_public_profile(uid: String) -> Result<serde_json::Value, String> {
    if !(9..=10).contains(&uid.len()) || !uid.bytes().all(|b| b.is_ascii_digit()) {
        return Err("UID inválido: use 9 ou 10 dígitos.".into());
    }
    let client = reqwest::Client::builder()
        .user_agent("IrminsulAtlas/0.1.0 (local desktop profile lookup)")
        .timeout(std::time::Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .get(format!("https://enka.network/api/uid/{uid}?info"))
        .send()
        .await
        .map_err(|_| "Consulta indisponível. Seus dados locais foram mantidos.".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "Enka indisponível (HTTP {}). Tente novamente mais tarde.",
            response.status().as_u16()
        ));
    }
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    if bytes.len() > 1_000_000 {
        return Err("Resposta excede limite permitido.".into());
    }
    serde_json::from_slice(&bytes).map_err(|_| "Resposta de perfil inválida.".into())
}
