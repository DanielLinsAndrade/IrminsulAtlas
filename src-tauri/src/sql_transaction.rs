use serde::Deserialize;
use serde_json::Value;
use sqlx::{Connection, SqliteConnection};
use tauri::Manager;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Statement {
    query: String,
    #[serde(default)]
    bind_values: Vec<Value>,
}

async fn execute(
    connection: &mut SqliteConnection,
    statements: Vec<Statement>,
) -> Result<(), String> {
    let mut transaction = connection.begin().await.map_err(|e| e.to_string())?;
    for statement in statements {
        let mut query = sqlx::query(&statement.query);
        for value in statement.bind_values {
            query = match value {
                Value::Null => query.bind(None::<String>),
                Value::Bool(value) => query.bind(value),
                Value::Number(value) if value.is_i64() => query.bind(value.as_i64().unwrap()),
                Value::Number(value) => query.bind(value.as_f64().ok_or("Invalid SQL number")?),
                Value::String(value) => query.bind(value),
                _ => return Err("SQL parameters must be scalar values".into()),
            };
        }
        query
            .execute(&mut *transaction)
            .await
            .map_err(|e| e.to_string())?;
    }
    transaction.commit().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn execute_sql_transaction(
    app: tauri::AppHandle,
    statements: Vec<Statement>,
) -> Result<(), String> {
    // Fixed application database; never accept a database path from the caller.
    let path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("wishlog.db");
    let options = sqlx::sqlite::SqliteConnectOptions::new()
        .filename(path)
        .foreign_keys(true)
        .create_if_missing(false);
    let mut connection = SqliteConnection::connect_with(&options)
        .await
        .map_err(|e| e.to_string())?;
    execute(&mut connection, statements).await
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn transaction_commits_and_rolls_back_on_constraint_failure() {
        tauri::async_runtime::block_on(async {
            let mut db = SqliteConnection::connect("sqlite::memory:").await.unwrap();
            sqlx::query("CREATE TABLE values_test(id INTEGER PRIMARY KEY, value TEXT NOT NULL)")
                .execute(&mut db)
                .await
                .unwrap();
            let statement = |id, value: &str| Statement {
                query: "INSERT INTO values_test VALUES ($1, $2)".into(),
                bind_values: vec![Value::from(id), Value::from(value)],
            };
            execute(&mut db, vec![statement(1, "original")])
                .await
                .unwrap();
            assert!(execute(
                &mut db,
                vec![statement(2, "rollback"), statement(1, "duplicate")]
            )
            .await
            .is_err());
            let rows: Vec<(i64, String)> =
                sqlx::query_as("SELECT id,value FROM values_test ORDER BY id")
                    .fetch_all(&mut db)
                    .await
                    .unwrap();
            assert_eq!(rows, vec![(1, "original".into())]);
        });
    }
}
