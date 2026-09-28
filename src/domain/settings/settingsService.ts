import type { IAssetCache, INativeAssetStorage } from '../../infrastructure/cache';
import type { AppSettingsRepository } from '../../infrastructure/db/appSettingsRepository';
import type { ICatalogRepository } from '../../infrastructure/db/catalogRepository';
import type { AchievementsRepository } from '../../infrastructure/db/achievementsRepository';
import type { SchemaMetadataRepository } from '../../infrastructure/db/schemaMetadataRepository';
import { isTauriApp } from '../../infrastructure/db/client';
import {
  type AppSettings,
  type AssetCacheStats,
  type CatalogSummary,
  DEFAULT_APP_SETTINGS,
  type StoragePathsInfo,
} from './types';

export async function loadAppSettings(repo: AppSettingsRepository): Promise<AppSettings> {
  try {
    const raw = await repo.getAllSettings();
    return {
      compactDensity: raw['ui.compact_density'] === 'true',
      autoDownloadAssets: raw['assets.auto_download'] !== 'false',
      confirmBeforeDelete: raw['ui.confirm_delete'] !== 'false',
      defaultBannerView: (raw['wishes.default_banner'] as AppSettings['defaultBannerView']) || DEFAULT_APP_SETTINGS.defaultBannerView,
      locale: raw['app.locale'] || DEFAULT_APP_SETTINGS.locale,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export async function saveAppSetting<K extends keyof AppSettings>(
  repo: AppSettingsRepository,
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const dbKeyMap: Record<keyof AppSettings, string> = {
    compactDensity: 'ui.compact_density',
    autoDownloadAssets: 'assets.auto_download',
    confirmBeforeDelete: 'ui.confirm_delete',
    defaultBannerView: 'wishes.default_banner',
    locale: 'app.locale',
  };

  const dbKey = dbKeyMap[key];
  if (!dbKey) return;

  await repo.setSetting(dbKey, String(value));
}

export async function getAssetCacheStats(cache: IAssetCache): Promise<AssetCacheStats> {
  try {
    const items = await cache.getAll();
    let charactersCount = 0;
    let weaponsCount = 0;
    let materialsCount = 0;
    let artifactsCount = 0;
    let otherCount = 0;

    for (const item of items) {
      const type = item.entityType.toLowerCase();
      if (type === 'character') charactersCount++;
      else if (type === 'weapon') weaponsCount++;
      else if (type === 'material') materialsCount++;
      else if (type === 'artifact' || type === 'artifact_set') artifactsCount++;
      else otherCount++;
    }

    return {
      totalCount: items.length,
      charactersCount,
      weaponsCount,
      materialsCount,
      artifactsCount,
      otherCount,
    };
  } catch {
    return {
      totalCount: 0,
      charactersCount: 0,
      weaponsCount: 0,
      materialsCount: 0,
      artifactsCount: 0,
      otherCount: 0,
    };
  }
}

export async function clearAssetCacheSafely(
  cache: IAssetCache,
  nativeStorage?: INativeAssetStorage
): Promise<void> {
  // Limpa apenas metadados de cache e arquivos temporários de imagens baixadas
  // Não altera perfis, histórico de desejos, inventário, armas ou planos
  await cache.clear();
  if (nativeStorage && nativeStorage.isAvailable()) {
    await nativeStorage.clearCacheFiles();
  }
}

export function getStoragePathsInfo(): StoragePathsInfo {
  const native = isTauriApp();
  return {
    isNativeTauri: native,
    databaseFile: native ? 'wishlog.db (no diretório AppConfig)' : 'wishlog.db (em memória no navegador)',
    assetCacheDir: native ? 'assets/ (no diretório AppCache)' : 'localStorage / Cache de Memória',
    environmentDescription: native
      ? 'Desktop Nativo (Tauri v2 com SQLite local e sistema de arquivos dedicado)'
      : 'Modo Web / Ambiente de Testes (SQLite em memória com cache simulado)',
  };
}

export async function getCatalogSummary(
  catalogRepo: ICatalogRepository,
  achievementsRepo: AchievementsRepository,
  schemaRepo: SchemaMetadataRepository
): Promise<CatalogSummary> {
  try {
    const meta = await catalogRepo.getCatalogMetadata();
    const achievementIds = await achievementsRepo.getAllAchievementIds();
    const schemaVer = await schemaRepo.getSchemaVersion();
    const specVer = await schemaRepo.getSpecVersion();

    return {
      charactersCount: meta?.charactersCount ?? 0,
      weaponsCount: meta?.weaponsCount ?? 0,
      materialsCount: meta?.materialsCount ?? 0,
      artifactSetsCount: meta?.artifactSetsCount ?? 0,
      achievementsCount: achievementIds.size,
      gameVersion: meta?.catalogVersion ?? '5.4.0',
      specVersion: specVer || '1.0',
      schemaVersion: schemaVer || 1,
      sourceProvider: meta?.sourceProvider ?? 'HoYoWiki / Genshin Data',
    };
  } catch {
    return {
      charactersCount: 0,
      weaponsCount: 0,
      materialsCount: 0,
      artifactSetsCount: 0,
      achievementsCount: 0,
      gameVersion: '5.4.0',
      specVersion: '1.0',
      schemaVersion: 1,
      sourceProvider: 'HoYoWiki / Genshin Data',
    };
  }
}
