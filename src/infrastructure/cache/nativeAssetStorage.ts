import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { isTauriApp } from '../db/client';

export interface INativeAssetStorage {
  isAvailable(): boolean;
  saveAssetFile(
    entityType: string,
    filename: string,
    bytes: Uint8Array | ArrayBuffer
  ): Promise<string>;
  getAssetFilePath(
    entityType: string,
    filename: string
  ): Promise<string | null>;
  getAssetFileUrl(localPath: string): string;
  clearCacheFiles(): Promise<void>;
}

export class TauriNativeAssetStorage implements INativeAssetStorage {
  public isAvailable(): boolean {
    return isTauriApp();
  }

  public async saveAssetFile(
    entityType: string,
    filename: string,
    bytes: Uint8Array | ArrayBuffer
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Tauri Native Asset Storage não está disponível neste ambiente.');
    }

    const dataArray = bytes instanceof Uint8Array ? Array.from(bytes) : Array.from(new Uint8Array(bytes));

    const localPath = await invoke<string>('save_cached_asset_file', {
      entityType,
      filename,
      data: dataArray,
    });

    return localPath;
  }

  public async getAssetFilePath(
    entityType: string,
    filename: string
  ): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const path = await invoke<string | null>('get_cached_asset_file_path', {
        entityType,
        filename,
      });
      return path;
    } catch {
      return null;
    }
  }

  public getAssetFileUrl(localPath: string): string {
    if (!this.isAvailable()) {
      return localPath;
    }
    return convertFileSrc(localPath);
  }

  public async clearCacheFiles(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await invoke('clear_asset_cache_files');
    } catch {
      // Ignora erro de limpeza silenciosamente
    }
  }
}

export const defaultNativeAssetStorage: INativeAssetStorage = new TauriNativeAssetStorage();
