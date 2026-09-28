import { getDatabase } from './client';
import type { SchemaMetadataRow } from './types';

export class SchemaMetadataRepository {
  public async getMetadata(key: string): Promise<string | null> {
    const db = await getDatabase();
    const rows = await db.select<{ value: string }[]>(
      'SELECT value FROM schema_metadata WHERE key = $1',
      [key]
    );
    return rows.length > 0 ? rows[0].value : null;
  }

  public async setMetadata(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      'INSERT OR REPLACE INTO schema_metadata (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [key, value]
    );
  }

  public async getSchemaVersion(): Promise<number> {
    const value = await this.getMetadata('schema_version');
    return value ? parseInt(value, 10) : 0;
  }

  public async getSpecVersion(): Promise<string> {
    const value = await this.getMetadata('spec_version');
    return value ?? '1.0';
  }

  public async getAllMetadata(): Promise<SchemaMetadataRow[]> {
    const db = await getDatabase();
    return db.select<SchemaMetadataRow[]>('SELECT key, value, updated_at FROM schema_metadata');
  }
}

export const schemaMetadataRepository = new SchemaMetadataRepository();
