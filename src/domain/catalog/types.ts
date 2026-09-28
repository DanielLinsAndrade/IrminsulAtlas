/**
 * Tipos e interfaces de domínio para o catálogo do jogo (Genshin Impact) e assets.
 * Conforme SPEC.md (Seções 11, 13, 15 e 20) e ARCHITECTURE.md (Seções 6, 11 e 12).
 */

export type Element =
  | 'pyro'
  | 'hydro'
  | 'anemo'
  | 'electro'
  | 'dendro'
  | 'cryo'
  | 'geo';

export type WeaponType =
  | 'sword'
  | 'claymore'
  | 'polearm'
  | 'bow'
  | 'catalyst';

export type Rarity = 1 | 2 | 3 | 4 | 5;

export type MaterialCategory =
  | 'currency'
  | 'character_ascension'
  | 'talent'
  | 'weapon_ascension'
  | 'common'
  | 'local_specialty'
  | 'boss'
  | 'other';

export interface CharacterData {
  id: string;
  gameKey: string;
  namePtBr: string;
  rarity: 4 | 5;
  element: Element;
  weaponType: WeaponType;
  releaseVersionId?: string | null;
  sourceProvider: string;
  sourceEntryId?: string | null;
  iconUrl?: string | null;
  splashUrl?: string | null;
  region?: string | null;
  maxConstellation?: number;
  supportsFriendship?: boolean;
  availability?: 'available' | 'upcoming';
}

export interface WeaponData {
  id: string;
  gameKey: string;
  namePtBr: string;
  rarity: Rarity;
  weaponType: WeaponType;
  releaseVersionId?: string | null;
  sourceProvider: string;
  sourceEntryId?: string | null;
  iconUrl?: string | null;
}

export interface MaterialData {
  id: string;
  gameKey: string;
  namePtBr: string;
  category: MaterialCategory;
  rarity?: Rarity | null;
  region?: string | null;
  sourceProvider: string;
  sourceEntryId?: string | null;
  iconUrl?: string | null;
}

export interface ArtifactSetData {
  releaseVersionId?: string;
  pieces?: Partial<Record<'flower' | 'plume' | 'sands' | 'goblet' | 'circlet', { namePtBr: string; iconKey: string }>>;
  id: string;
  gameKey: string;
  namePtBr: string;
  rarities: Rarity[];
  sourceProvider: string;
  sourceEntryId?: string | null;
  iconUrl?: string | null;
}

export type AssetVariant = 'icon' | 'splash' | 'card' | 'thumbnail';

export type AssetSource = 'cache' | 'remote' | 'bundled' | 'local' | 'fallback';

export interface AssetRef {
  uri: string;
  source: AssetSource;
  isFallback: boolean;
  mimeType?: string;
  label?: string;
}

export interface AssetCacheMetadata {
  id: string;
  entityType: 'character' | 'weapon' | 'material' | 'artifact' | 'general';
  entityKey: string;
  variant: AssetVariant;
  sourceUrl: string;
  localPath?: string | null;
  dataUri?: string | null;
  etag?: string | null;
  lastModified?: string | null;
  downloadedAt: string;
  lastCheckedAt?: string | null;
}

export type CatalogState = 'development' | 'partial' | 'complete';

export interface CategoryCompleteness {
  characters: CatalogState;
  weapons: CatalogState;
  materials: CatalogState;
  artifactSets: CatalogState;
}

export interface CatalogMetadata {
  schemaVersion: string;
  contentVersion: string;
  sourceProvider: string;
  catalogState: CatalogState;
  categoryStates?: CategoryCompleteness;
  generatedAt: string;
  updatedAt: string;
  charactersCount: number;
  weaponsCount: number;
  materialsCount: number;
  artifactSetsCount: number;
  rosterCoverage?: string;
  /** @deprecated Utilize contentVersion para a versão do conteúdo do catálogo */
  catalogVersion?: string;
}

export interface GameCatalogPayload {
  schemaVersion?: string;
  contentVersion?: string;
  /** @deprecated Suportado para retrocompatibilidade com payloads legados */
  version?: string;
  sourceProvider: string;
  catalogState?: CatalogState;
  categoryStates?: Partial<CategoryCompleteness>;
  rosterCoverage?: string;
  generatedAt?: string;
  updatedAt?: string;
  characters: CharacterData[];
  weapons: WeaponData[];
  materials: MaterialData[];
  artifactSets?: ArtifactSetData[];
}

export interface CatalogImportResult {
  success: boolean;
  schemaVersion: string;
  contentVersion: string;
  sourceProvider: string;
  catalogState: CatalogState;
  categoryStates?: CategoryCompleteness;
  charactersImported: number;
  weaponsImported: number;
  materialsImported: number;
  artifactSetsImported: number;
  warnings?: string[];
  error?: string;
  /** @deprecated Suportado para retrocompatibilidade */
  version?: string;
}
