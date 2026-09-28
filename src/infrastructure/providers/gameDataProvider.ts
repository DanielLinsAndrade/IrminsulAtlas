import type {
  ArtifactSetData,
  CatalogImportResult,
  CatalogMetadata,
  CharacterData,
  GameCatalogPayload,
  MaterialData,
  WeaponData,
} from '../../domain/catalog';
import { type ICatalogRepository, catalogRepository } from '../db/catalogRepository';
import { BUNDLED_GAME_CATALOG } from '../importers/bundledCatalog';
import { defaultCatalogImporter } from '../importers/catalogImporter';
import { resolveCatalogEntry } from '../../domain/catalog/identity';
import { MATERIAL_ALIASES } from '../../domain/catalog/materialAliases';

export interface IGameDataProvider {
  getCharacter(idOrKey: string): Promise<CharacterData | null>;
  getWeapon(idOrKey: string): Promise<WeaponData | null>;
  getMaterial(idOrKey: string): Promise<MaterialData | null>;
  getArtifactSet(idOrKey: string): Promise<ArtifactSetData | null>;
  getAllCharacters(): Promise<CharacterData[]>;
  getAllWeapons(): Promise<WeaponData[]>;
  getAllMaterials(): Promise<MaterialData[]>;
  getAllArtifactSets(): Promise<ArtifactSetData[]>;
  ensureCatalogLoaded(): Promise<void>;
  getCatalogMetadata(): Promise<CatalogMetadata | null>;
  syncCatalog(payload?: GameCatalogPayload): Promise<CatalogImportResult>;
}

export class LocalGameDataProvider implements IGameDataProvider {
  private repository: ICatalogRepository;
  private fallbackCharacters: Map<string, CharacterData> = new Map();
  private fallbackWeapons: Map<string, WeaponData> = new Map();
  private fallbackMaterials: Map<string, MaterialData> = new Map();
  private fallbackArtifactSets: Map<string, ArtifactSetData> = new Map();
  private isLoaded = false;

  constructor(
    repository?: ICatalogRepository,
    initialData?: GameCatalogPayload
  ) {
    this.repository = repository ?? catalogRepository;
    const bundled = initialData ?? BUNDLED_GAME_CATALOG;

    for (const c of bundled.characters) {
      this.fallbackCharacters.set(c.id, c);
      this.fallbackCharacters.set(c.gameKey.toLowerCase(), c);
    }
    for (const w of bundled.weapons) {
      this.fallbackWeapons.set(w.id, w);
      this.fallbackWeapons.set(w.gameKey.toLowerCase(), w);
    }
    for (const m of bundled.materials) {
      this.fallbackMaterials.set(m.id, m);
      this.fallbackMaterials.set(m.gameKey.toLowerCase(), m);
    }
    if (bundled.artifactSets) {
      for (const a of bundled.artifactSets) {
        this.fallbackArtifactSets.set(a.id, a);
        this.fallbackArtifactSets.set(a.gameKey.toLowerCase(), a);
      }
    }
  }

  public async ensureCatalogLoaded(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const metadata = await this.repository.getCatalogMetadata();
      const populated = await this.repository.isCatalogPopulated();
      const bundledVersion = BUNDLED_GAME_CATALOG.contentVersion || BUNDLED_GAME_CATALOG.version;
      const needsImport =
        !populated ||
        !metadata ||
        metadata.charactersCount < BUNDLED_GAME_CATALOG.characters.length ||
        metadata.weaponsCount < BUNDLED_GAME_CATALOG.weapons.length ||
        metadata.contentVersion !== bundledVersion;

      if (needsImport) {
        await defaultCatalogImporter.importBundledCatalog();
      }
      this.isLoaded = true;
    } catch (err) {
      // Se falhar o acesso ao banco (ex: ambiente restrito), mantém fallback em memória funcional
      console.warn('[GameDataProvider] Não foi possível verificar/semear o catálogo no SQLite; operando com catálogo bundled em memória:', err);
    }
  }

  public async getCharacter(idOrKey: string): Promise<CharacterData | null> {
    try {
      const fromDb = await this.repository.getCharacter(idOrKey);
      if (fromDb) return fromDb;
    } catch {
      // Fallback em memória
    }

    const direct = this.fallbackCharacters.get(idOrKey);
    if (direct) return direct;
    return resolveCatalogEntry([...new Set(this.fallbackCharacters.values())], idOrKey, 'character');
  }

  public async getWeapon(idOrKey: string): Promise<WeaponData | null> {
    try {
      const fromDb = await this.repository.getWeapon(idOrKey);
      if (fromDb) return fromDb;
    } catch {
      // Fallback
    }

    const direct = this.fallbackWeapons.get(idOrKey);
    if (direct) return direct;
    return resolveCatalogEntry([...new Set(this.fallbackWeapons.values())], idOrKey, 'weapon');
  }

  public async getMaterial(idOrKey: string): Promise<MaterialData | null> {
    idOrKey = MATERIAL_ALIASES[idOrKey] ?? idOrKey;
    try {
      const fromDb = await this.repository.getMaterial(idOrKey);
      if (fromDb) return fromDb;
    } catch {
      // Fallback
    }

    const direct = this.fallbackMaterials.get(idOrKey);
    if (direct) return direct;
    return resolveCatalogEntry([...new Set(this.fallbackMaterials.values())], idOrKey, 'material');
  }

  public async getArtifactSet(idOrKey: string): Promise<ArtifactSetData | null> {
    try {
      const fromDb = await this.repository.getArtifactSet(idOrKey);
      if (fromDb) return { ...this.fallbackArtifactSets.get(fromDb.id), ...fromDb };
    } catch {
      // Fallback
    }

    const direct = this.fallbackArtifactSets.get(idOrKey);
    if (direct) return direct;
    return resolveCatalogEntry([...new Set(this.fallbackArtifactSets.values())], idOrKey, 'artifact');
  }

  public async getAllCharacters(): Promise<CharacterData[]> {
    try {
      const fromDb = await this.repository.getCharacters();
      if (fromDb.length > 0) return fromDb;
    } catch {
      // Fallback
    }

    return Array.from(new Set(this.fallbackCharacters.values()));
  }

  public async getAllWeapons(): Promise<WeaponData[]> {
    try {
      const fromDb = await this.repository.getWeapons();
      if (fromDb.length > 0) return fromDb;
    } catch {
      // Fallback
    }

    return [...new Set(this.fallbackWeapons.values())];
  }

  public async getAllMaterials(): Promise<MaterialData[]> {
    try {
      const fromDb = await this.repository.getMaterials();
      if (fromDb.length > 0) return fromDb.filter(item => !MATERIAL_ALIASES[item.id]);
    } catch {
      // Fallback
    }

    return Array.from(new Set(this.fallbackMaterials.values()));
  }

  public async getAllArtifactSets(): Promise<ArtifactSetData[]> {
    try {
      const fromDb = await this.repository.getArtifactSets();
      if (fromDb.length > 0) return fromDb.map(entry => ({ ...this.fallbackArtifactSets.get(entry.id), ...entry }));
    } catch {
      // Fallback
    }

    return Array.from(new Set(this.fallbackArtifactSets.values()));
  }

  public async getCatalogMetadata(): Promise<CatalogMetadata | null> {
    try {
      const meta = await this.repository.getCatalogMetadata();
      if (meta) return meta;
    } catch {
      // Fallback
    }

    const schemaVersion = BUNDLED_GAME_CATALOG.schemaVersion || '1.0';
    const contentVersion = BUNDLED_GAME_CATALOG.contentVersion || BUNDLED_GAME_CATALOG.version || '5.4.0-dev-bootstrap';
    const sourceProvider = BUNDLED_GAME_CATALOG.sourceProvider || 'manual_bootstrap';
    const catalogState = BUNDLED_GAME_CATALOG.catalogState || 'development';
    const generatedAt =
      BUNDLED_GAME_CATALOG.generatedAt || BUNDLED_GAME_CATALOG.updatedAt || new Date().toISOString();
    const updatedAt = BUNDLED_GAME_CATALOG.updatedAt || new Date().toISOString();

    const categoryStates = {
      characters: BUNDLED_GAME_CATALOG.categoryStates?.characters || (BUNDLED_GAME_CATALOG.characters.length >= 90 ? 'complete' : catalogState),
      weapons: BUNDLED_GAME_CATALOG.categoryStates?.weapons || (BUNDLED_GAME_CATALOG.weapons.length >= 200 ? 'complete' : catalogState),
      materials: BUNDLED_GAME_CATALOG.categoryStates?.materials || catalogState,
      artifactSets: BUNDLED_GAME_CATALOG.categoryStates?.artifactSets || catalogState,
    };

    return {
      schemaVersion,
      contentVersion,
      catalogVersion: contentVersion,
      sourceProvider,
      catalogState,
      categoryStates,
      generatedAt,
      updatedAt,
      charactersCount: new Set(this.fallbackCharacters.values()).size,
      weaponsCount: new Set(this.fallbackWeapons.values()).size,
      materialsCount: new Set(this.fallbackMaterials.values()).size,
      artifactSetsCount: new Set(this.fallbackArtifactSets.values()).size,
    };
  }

  public async syncCatalog(payload?: GameCatalogPayload): Promise<CatalogImportResult> {
    const importer = defaultCatalogImporter;
    if (payload) {
      return importer.importCatalog(payload);
    }
    return importer.importBundledCatalog();
  }
}

export const defaultGameDataProvider: IGameDataProvider = new LocalGameDataProvider();
