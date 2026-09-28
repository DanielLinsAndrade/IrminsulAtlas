export interface AppSettings {
  compactDensity: boolean;
  autoDownloadAssets: boolean;
  confirmBeforeDelete: boolean;
  defaultBannerView: 'character' | 'weapon' | 'standard' | 'chronicled';
  locale: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  compactDensity: false,
  autoDownloadAssets: true,
  confirmBeforeDelete: true,
  defaultBannerView: 'character',
  locale: 'pt-BR',
};

export interface AssetCacheStats {
  totalCount: number;
  charactersCount: number;
  weaponsCount: number;
  materialsCount: number;
  artifactsCount: number;
  otherCount: number;
}

export interface CatalogSummary {
  charactersCount: number;
  weaponsCount: number;
  materialsCount: number;
  artifactSetsCount: number;
  achievementsCount: number;
  gameVersion: string;
  specVersion: string;
  schemaVersion: number;
  sourceProvider: string;
}

export interface StoragePathsInfo {
  isNativeTauri: boolean;
  databaseFile: string;
  assetCacheDir: string;
  environmentDescription: string;
}
