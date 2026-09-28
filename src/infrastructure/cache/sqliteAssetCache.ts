import type { AssetCacheMetadata, AssetVariant } from '../../domain/catalog';
import { getDatabase } from '../db/client';
import type { IAssetCache } from './assetCache';

interface AssetCacheRow {
  id: string;
  entity_type: string;
  entity_key: string;
  variant: string;
  source_url: string;
  local_path: string | null;
  data_uri: string | null;
  etag: string | null;
  last_modified: string | null;
  downloaded_at: string;
  last_checked_at: string | null;
}

function mapRowToMetadata(row: AssetCacheRow): AssetCacheMetadata {
  return {
    id: row.id,
    entityType: row.entity_type as AssetCacheMetadata['entityType'],
    entityKey: row.entity_key,
    variant: row.variant as AssetVariant,
    sourceUrl: row.source_url,
    localPath: row.local_path,
    etag: row.etag,
    lastModified: row.last_modified,
    downloadedAt: row.downloaded_at,
    lastCheckedAt: row.last_checked_at,
  };
}

export class SqliteAssetCache implements IAssetCache {
  public async get(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<AssetCacheMetadata | null> {
    const db = await getDatabase();
    const rows = await db.select<AssetCacheRow[]>(
      `SELECT * FROM asset_cache_metadata
       WHERE entity_type = $1 AND entity_key = $2 AND variant = $3
       LIMIT 1`,
      [entityType, entityKey, variant]
    );

    if (!rows || rows.length === 0) return null;
    return mapRowToMetadata(rows[0]);
  }

  public async set(entry: AssetCacheMetadata): Promise<void> {
    const db = await getDatabase();
    await db.execute(
      `INSERT OR REPLACE INTO asset_cache_metadata (
        id, entity_type, entity_key, variant, source_url, local_path,
        etag, last_modified, downloaded_at, last_checked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.id,
        entry.entityType,
        entry.entityKey,
        entry.variant,
        entry.sourceUrl,
        entry.localPath ?? null,
        entry.etag ?? null,
        entry.lastModified ?? null,
        entry.downloadedAt,
        entry.lastCheckedAt ?? null,
      ]
    );
  }

  public async has(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean> {
    const item = await this.get(entityType, entityKey, variant);
    return item !== null;
  }

  public async delete(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean> {
    const db = await getDatabase();
    const res = await db.execute(
      `DELETE FROM asset_cache_metadata
       WHERE entity_type = $1 AND entity_key = $2 AND variant = $3`,
      [entityType, entityKey, variant]
    );
    return res.rowsAffected > 0;
  }

  public async clear(): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM asset_cache_metadata');
  }

  public async getAll(): Promise<AssetCacheMetadata[]> {
    const db = await getDatabase();
    const rows = await db.select<AssetCacheRow[]>(
      'SELECT * FROM asset_cache_metadata ORDER BY downloaded_at DESC'
    );
    return rows.map(mapRowToMetadata);
  }
}
