import { getDatabase } from './client';

export class AppSettingsRepository {
  public async getSetting(key: string): Promise<string | null> {
    const db = await getDatabase();
    const rows = await db.select<{ value: string }[]>(
      'SELECT value FROM app_settings WHERE key = $1',
      [key]
    );
    return rows.length > 0 ? rows[0].value : null;
  }

  public async setSetting(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [key, value]
    );
  }

  public async deleteSetting(key: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM app_settings WHERE key = $1', [key]);
  }

  public async getAllSettings(): Promise<Record<string, string>> {
    const db = await getDatabase();
    const rows = await db.select<{ key: string; value: string }[]>(
      'SELECT key, value FROM app_settings'
    );
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }
}

export const appSettingsRepository = new AppSettingsRepository();
