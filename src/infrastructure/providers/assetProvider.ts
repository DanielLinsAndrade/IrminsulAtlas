import type {
  AssetRef,
  AssetVariant,
  CharacterData,
  MaterialData,
  WeaponData,
} from '../../domain/catalog';
import { type IAssetCache, defaultAssetCache } from '../cache/assetCache';
import {
  type INativeAssetStorage,
  defaultNativeAssetStorage,
} from '../cache/nativeAssetStorage';
import {
  createCharacterFallbackSvg,
  createGenericFallbackSvg,
  createMaterialFallbackSvg,
  createWeaponFallbackSvg,
} from './fallbackAssets';
import {
  type IGameDataProvider,
  defaultGameDataProvider,
} from './gameDataProvider';
import {
  getCharacterPortraitUrl,
  getCharacterSplashUrl,
  getWeaponIconUrl,
  getArtifactSetIconUrl,
  getMaterialIconUrl,
} from './uiAssetRegistry';

export interface IAssetProvider {
  getCharacterAsset(id: string, variant?: AssetVariant): Promise<AssetRef>;
  getWeaponAsset(id: string, variant?: AssetVariant): Promise<AssetRef>;
  getMaterialAsset(id: string, variant?: AssetVariant): Promise<AssetRef>;
  getArtifactAsset(id: string, variant?: AssetVariant): Promise<AssetRef>;
  cacheAssetLocally(
    entityType: 'character' | 'weapon' | 'material' | 'artifact' | 'general',
    entityKey: string,
    variant: AssetVariant,
    sourceUrl: string,
    dataUriOrLocalPath?: string
  ): Promise<void>;
  cacheAssetFile?(
    entityType: 'character' | 'weapon' | 'material' | 'artifact' | 'general',
    entityKey: string,
    variant: AssetVariant,
    sourceUrl: string,
    filename: string,
    bytes: Uint8Array | ArrayBuffer
  ): Promise<string | null>;
  isOffline(): boolean;
  setOfflineMode(offline: boolean | null): void;
}

export class HoYoAssetProvider implements IAssetProvider {
  private gameData: IGameDataProvider;
  private cache: IAssetCache;
  private nativeStorage: INativeAssetStorage;
  private forcedOffline: boolean | null = null;
  private splashDownloads = new Map<string, Promise<string | null>>();

  constructor(
    gameData?: IGameDataProvider,
    cache?: IAssetCache,
    nativeStorage?: INativeAssetStorage
  ) {
    this.gameData = gameData ?? defaultGameDataProvider;
    this.cache = cache ?? defaultAssetCache;
    this.nativeStorage = nativeStorage ?? defaultNativeAssetStorage;
  }

  public setOfflineMode(offline: boolean | null): void {
    this.forcedOffline = offline;
  }

  public isOffline(): boolean {
    if (this.forcedOffline !== null) {
      return this.forcedOffline;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return !navigator.onLine;
    }
    return false;
  }

  public async cacheAssetLocally(
    entityType: 'character' | 'weapon' | 'material' | 'artifact' | 'general',
    entityKey: string,
    variant: AssetVariant,
    sourceUrl: string,
    dataUriOrLocalPath?: string
  ): Promise<void> {
    const isDataUri = dataUriOrLocalPath?.startsWith('data:') ?? false;
    const isLocalPath = dataUriOrLocalPath ? !isDataUri : false;

    await this.cache.set({
      id: `${entityType}_${entityKey}_${variant}`,
      entityType,
      entityKey,
      variant,
      sourceUrl,
      localPath: isLocalPath ? dataUriOrLocalPath : null,
      dataUri: isDataUri ? dataUriOrLocalPath : null,
      downloadedAt: new Date().toISOString(),
    });
  }

  public async cacheAssetFile(
    entityType: 'character' | 'weapon' | 'material' | 'artifact' | 'general',
    entityKey: string,
    variant: AssetVariant,
    sourceUrl: string,
    filename: string,
    bytes: Uint8Array | ArrayBuffer
  ): Promise<string | null> {
    try {
      if (this.nativeStorage.isAvailable()) {
        const localPath = await this.nativeStorage.saveAssetFile(entityType, filename, bytes);
        await this.cache.set({
          id: `${entityType}_${entityKey}_${variant}`,
          entityType,
          entityKey,
          variant,
          sourceUrl,
          localPath,
          dataUri: null,
          downloadedAt: new Date().toISOString(),
        });
        return localPath;
      }
    } catch (err) {
      console.warn(`[AssetProvider] Falha ao persistir asset em disco (${entityType}/${entityKey}):`, err);
    }
    return null;
  }

  public async getCharacterAsset(
    id: string,
    variant: AssetVariant = 'icon'
  ): Promise<AssetRef> {
    const char = await this.gameData.getCharacter(id);
    const label = char?.namePtBr || id;
    const characterKey = char?.gameKey || char?.id || id;
    const localUri = variant === 'icon' || variant === 'splash' ? getCharacterPortraitUrl(characterKey) : null;
    const splashUri = variant === 'splash' ? getCharacterSplashUrl(characterKey) : null;
    const bundledUri = variant === 'splash' ? splashUri : localUri;
    if (bundledUri) {
      return { uri: bundledUri, source: 'local', isFallback: variant === 'splash' && !splashUri, label };
    }

    // 1. Verifica cache (disco nativo, memória ou metadados)
    const cached = await this.cache.get('character', id, variant);
    if (cached) {
      if (cached.localPath) {
        try {
          const uri = this.nativeStorage.getAssetFileUrl(cached.localPath);
          return {
            uri,
            source: 'cache',
            isFallback: false,
            label,
          };
        } catch {
          // Se falhar a resolução física do arquivo, continua para fallback/remoto
        }
      }
      if (cached.dataUri) {
        return {
          uri: cached.dataUri,
          source: 'cache',
          isFallback: false,
          label,
        };
      }
      if (variant !== 'splash' && !this.isOffline() && cached.sourceUrl) {
        return {
          uri: cached.sourceUrl,
          source: 'cache',
          isFallback: false,
          label,
        };
      }
    }

    // A splash is rendered only after it has been persisted. Portrait is last resort.
    if (variant === 'splash') {
      if (char?.splashUrl && !this.isOffline() && this.nativeStorage.isAvailable()) {
        try {
          let download = this.splashDownloads.get(id);
          if (!download) {
            download = this.downloadSplash(id, char.splashUrl);
            this.splashDownloads.set(id, download);
          }
          const path = await download;
          if (path) {
            this.splashDownloads.delete(id);
            return { uri: this.nativeStorage.getAssetFileUrl(path), source: 'cache', isFallback: false, label };
          }
        } catch (error) { console.warn(`[AssetProvider] Splash ${id}: usando fallback local`, error); }
      }
      return localUri ? { uri: localUri, source: 'local', isFallback: true, label } : this.resolveCharacterFallback(char, id);
    }

    // 2. Se estiver offline e não houver asset físico/memória em cache, utiliza fallback visual temático
    if (this.isOffline()) {
      return this.resolveCharacterFallback(char, id);
    }

    // 3. Prioridade para asset local bundled (/icons/...)
    const targetUrl = char?.iconUrl || localUri;
    if (targetUrl && targetUrl.startsWith('/icons/')) {
      return {
        uri: targetUrl,
        source: 'local',
        isFallback: false,
        label,
      };
    }

    // 4. Resolve URL oficial online
    if (targetUrl) {
      void this.cache.set({
        id: `char_${id}_${variant}`,
        entityType: 'character',
        entityKey: id,
        variant,
        sourceUrl: targetUrl,
        downloadedAt: new Date().toISOString(),
      });

      return {
        uri: targetUrl,
        source: 'remote',
        isFallback: false,
        label,
      };
    }

    // 5. Fallback se não existir URL
    return this.resolveCharacterFallback(char, id);
  }

  private async downloadSplash(id: string, url: string): Promise<string | null> {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Splash indisponível na origem');
    if (Number(response.headers.get('content-length')) > 15_000_000) throw new Error('Splash excede o limite de 15 MB');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 15_000_000) throw new Error('Splash excede o limite de 15 MB');
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
    if (!png && !jpeg && !webp) throw new Error('Formato de splash não suportado');
    return this.cacheAssetFile('character', id, 'splash', url, `${id}_splash.${png ? 'png' : jpeg ? 'jpg' : 'webp'}`, bytes);
  }

  public async getWeaponAsset(
    id: string,
    variant: AssetVariant = 'icon'
  ): Promise<AssetRef> {
    const weapon = await this.gameData.getWeapon(id);
    const label = weapon?.namePtBr || id;

    const bundledUri = getWeaponIconUrl(weapon?.gameKey || weapon?.id || id);
    if (bundledUri) {
      return { uri: bundledUri, source: 'local', isFallback: false, label };
    }

    // 1. Verifica cache local
    const cached = await this.cache.get('weapon', id, variant);
    if (cached) {
      if (cached.localPath) {
        try {
          const uri = this.nativeStorage.getAssetFileUrl(cached.localPath);
          return {
            uri,
            source: 'cache',
            isFallback: false,
            label,
          };
        } catch {
          // Continua para fallback/remoto
        }
      }
      if (cached.dataUri) {
        return {
          uri: cached.dataUri,
          source: 'cache',
          isFallback: false,
          label,
        };
      }
      if (!this.isOffline() && cached.sourceUrl) {
        return {
          uri: cached.sourceUrl,
          source: 'cache',
          isFallback: false,
          label,
        };
      }
    }

    // 2. Offline sem cache físico -> fallback
    if (this.isOffline()) {
      return this.resolveWeaponFallback(weapon, id);
    }

    // 3. Prioridade para asset local bundled (/icons/...)
    const localUri = variant === 'icon'
      ? getWeaponIconUrl(weapon?.gameKey || weapon?.id || id)
      : null;
    const targetUrl = weapon?.iconUrl || localUri;
    if (targetUrl && targetUrl.startsWith('/icons/')) {
      return {
        uri: targetUrl,
        source: 'local',
        isFallback: false,
        label,
      };
    }

    // 4. URL remota
    if (weapon?.iconUrl) {
      void this.cache.set({
        id: `weap_${id}_${variant}`,
        entityType: 'weapon',
        entityKey: id,
        variant,
        sourceUrl: weapon.iconUrl,
        downloadedAt: new Date().toISOString(),
      });

      return {
        uri: weapon.iconUrl,
        source: 'remote',
        isFallback: false,
        label,
      };
    }

    return this.resolveWeaponFallback(weapon, id);
  }

  public async getMaterialAsset(
    id: string,
    variant: AssetVariant = 'icon'
  ): Promise<AssetRef> {
    const material = await this.gameData.getMaterial(id);
    const label = material?.namePtBr || id;
    const bundledUri = variant === 'icon' ? getMaterialIconUrl(material?.id || id) : '';
    if (bundledUri) return { uri: bundledUri, source: 'local', isFallback: false, label };


    // 1. Cache local
    const cached = await this.cache.get('material', id, variant);
    if (cached) {
      if (cached.localPath) {
        try {
          const uri = this.nativeStorage.getAssetFileUrl(cached.localPath);
          return {
            uri,
            source: 'cache',
            isFallback: false,
            label,
          };
        } catch {
          // Continua
        }
      }
      if (cached.dataUri) {
        return {
          uri: cached.dataUri,
          source: 'cache',
          isFallback: false,
          label,
        };
      }
    }

    // URLs do catálogo são metadados; a UI usa arquivo local, cache físico ou SVG.
    return this.resolveMaterialFallback(material, id);
  }

  public async getArtifactAsset(
    id: string,
    variant: AssetVariant = 'icon'
  ): Promise<AssetRef> {
    const art = await this.gameData.getArtifactSet(id);
    const label = art?.namePtBr || id;
    const bundledUri = variant === 'icon' ? getArtifactSetIconUrl(art?.id || id) || getArtifactSetIconUrl(art?.gameKey || id) : '';
    if (bundledUri) return { uri: bundledUri, source: 'local', isFallback: false, label };


    const cached = await this.cache.get('artifact', id, variant);
    if (cached) {
      if (cached.localPath) {
        try {
          const uri = this.nativeStorage.getAssetFileUrl(cached.localPath);
          return {
            uri,
            source: 'cache',
            isFallback: false,
            label,
          };
        } catch {
          // Continua
        }
      }
      if (cached.dataUri) {
        return {
          uri: cached.dataUri,
          source: 'cache',
          isFallback: false,
          label,
        };
      }
    }

    // URLs do catálogo são metadados; a UI usa arquivo local, cache físico ou SVG.
    return { uri: createGenericFallbackSvg(label), source: 'fallback', isFallback: true, label };
  }

  private resolveCharacterFallback(char: CharacterData | null, id: string): AssetRef {
    const name = char?.namePtBr || id;
    const element = char?.element || 'electro';
    const rarity = char?.rarity || 5;

    return {
      uri: createCharacterFallbackSvg(name, element, rarity),
      source: 'fallback',
      isFallback: true,
      label: name,
    };
  }

  private resolveWeaponFallback(weapon: WeaponData | null, id: string): AssetRef {
    const name = weapon?.namePtBr || id;
    const weaponType = weapon?.weaponType || 'sword';
    const rarity = weapon?.rarity || 4;

    return {
      uri: createWeaponFallbackSvg(name, weaponType, rarity),
      source: 'fallback',
      isFallback: true,
      label: name,
    };
  }

  private resolveMaterialFallback(material: MaterialData | null, id: string): AssetRef {
    const name = material?.namePtBr || id;
    const category = material?.category || 'currency';
    const rarity = material?.rarity || 5;

    return {
      uri: createMaterialFallbackSvg(name, category, rarity),
      source: 'fallback',
      isFallback: true,
      label: name,
    };
  }
}

export const defaultAssetProvider: IAssetProvider = new HoYoAssetProvider();
