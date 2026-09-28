import type { AssetCacheMetadata } from '../../domain/catalog';
import { isTauriApp } from '../db/client';
import { SqliteAssetCache } from './sqliteAssetCache';

export interface IAssetCache {
  get(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<AssetCacheMetadata | null>;
  set(entry: AssetCacheMetadata): Promise<void>;
  has(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean>;
  delete(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean>;
  clear(): Promise<void>;
  getAll(): Promise<AssetCacheMetadata[]>;
}

export class MemoryAssetCache implements IAssetCache {
  private cache = new Map<string, AssetCacheMetadata>();

  private buildKey(entityType: string, entityKey: string, variant: string): string {
    return `${entityType}:${entityKey}:${variant}`;
  }

  public async get(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<AssetCacheMetadata | null> {
    const key = this.buildKey(entityType, entityKey, variant);
    return this.cache.get(key) ?? null;
  }

  public async set(entry: AssetCacheMetadata): Promise<void> {
    const key = this.buildKey(entry.entityType, entry.entityKey, entry.variant);
    this.cache.set(key, { ...entry });
  }

  public async has(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean> {
    const key = this.buildKey(entityType, entityKey, variant);
    return this.cache.has(key);
  }

  public async delete(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean> {
    const key = this.buildKey(entityType, entityKey, variant);
    return this.cache.delete(key);
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }

  public async getAll(): Promise<AssetCacheMetadata[]> {
    return Array.from(this.cache.values());
  }
}

const STORAGE_KEY_PREFIX = 'wishlog_asset_cache_';

export class LocalStorageAssetCache implements IAssetCache {
  private memoryFallback = new MemoryAssetCache();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private buildKey(entityType: string, entityKey: string, variant: string): string {
    return `${STORAGE_KEY_PREFIX}${entityType}_${entityKey}_${variant}`;
  }

  public async get(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<AssetCacheMetadata | null> {
    if (!this.isStorageAvailable()) {
      return this.memoryFallback.get(entityType, entityKey, variant);
    }

    try {
      const raw = localStorage.getItem(this.buildKey(entityType, entityKey, variant));
      if (!raw) return null;
      return JSON.parse(raw) as AssetCacheMetadata;
    } catch {
      return this.memoryFallback.get(entityType, entityKey, variant);
    }
  }

  public async set(entry: AssetCacheMetadata): Promise<void> {
    // Garante que APENAS metadados leves sejam persistidos no localStorage,
    // NUNCA binários ou imagens em Base64 / Data URLs
    const lightweightEntry: AssetCacheMetadata = {
      id: entry.id,
      entityType: entry.entityType,
      entityKey: entry.entityKey,
      variant: entry.variant,
      sourceUrl: entry.sourceUrl,
      localPath: entry.localPath ?? null,
      dataUri: null,
      etag: entry.etag ?? null,
      lastModified: entry.lastModified ?? null,
      downloadedAt: entry.downloadedAt,
      lastCheckedAt: entry.lastCheckedAt ?? null,
    };

    await this.memoryFallback.set(lightweightEntry);

    if (!this.isStorageAvailable()) return;

    try {
      const key = this.buildKey(entry.entityType, entry.entityKey, entry.variant);
      localStorage.setItem(key, JSON.stringify(lightweightEntry));
    } catch {
      // Falha de cota de localStorage ou restrição de ambiente: preserva fallback em memória
    }
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
    await this.memoryFallback.delete(entityType, entityKey, variant);

    if (!this.isStorageAvailable()) return true;

    try {
      const key = this.buildKey(entityType, entityKey, variant);
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  public async clear(): Promise<void> {
    await this.memoryFallback.clear();

    if (!this.isStorageAvailable()) return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // Ignora erro de limpeza
    }
  }

  public async getAll(): Promise<AssetCacheMetadata[]> {
    if (!this.isStorageAvailable()) {
      return this.memoryFallback.getAll();
    }

    try {
      const list: AssetCacheMetadata[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            list.push(JSON.parse(item) as AssetCacheMetadata);
          }
        }
      }
      return list;
    } catch {
      return this.memoryFallback.getAll();
    }
  }
}

export class DynamicAssetCache implements IAssetCache {
  private sqliteCache = new SqliteAssetCache();
  private localStorageCache = new LocalStorageAssetCache();

  private getTarget(): IAssetCache {
    return isTauriApp() ? this.sqliteCache : this.localStorageCache;
  }

  public async get(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<AssetCacheMetadata | null> {
    return this.getTarget().get(entityType, entityKey, variant);
  }

  public async set(entry: AssetCacheMetadata): Promise<void> {
    return this.getTarget().set(entry);
  }

  public async has(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean> {
    return this.getTarget().has(entityType, entityKey, variant);
  }

  public async delete(
    entityType: string,
    entityKey: string,
    variant: string
  ): Promise<boolean> {
    return this.getTarget().delete(entityType, entityKey, variant);
  }

  public async clear(): Promise<void> {
    return this.getTarget().clear();
  }

  public async getAll(): Promise<AssetCacheMetadata[]> {
    return this.getTarget().getAll();
  }
}

export const defaultAssetCache: IAssetCache = new DynamicAssetCache();
