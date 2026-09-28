import type {
  ArtifactSetData,
  CatalogMetadata,
  CatalogState,
  CategoryCompleteness,
  CharacterData,
  Element,
  MaterialCategory,
  MaterialData,
  Rarity,
  WeaponData,
  WeaponType,
} from '../../domain/catalog';
import { getDatabase } from './client';

interface CharacterRow {
  id: string;
  game_key: string;
  name_pt_br: string;
  rarity: number;
  element: string;
  weapon_type: string;
  release_version_id: string | null;
  source_provider: string;
  source_entry_id: string | null;
  icon_url: string | null;
  splash_url: string | null;
  region: string | null;
  max_constellation: number | null;
  supports_friendship: number | null;
}

interface WeaponRow {
  id: string;
  game_key: string;
  name_pt_br: string;
  rarity: number;
  weapon_type: string;
  release_version_id: string | null;
  source_provider: string;
  source_entry_id: string | null;
  icon_url: string | null;
}

interface MaterialRow {
  id: string;
  game_key: string;
  name_pt_br: string;
  category: string;
  rarity: number | null;
  region: string | null;
  source_provider: string;
  source_entry_id: string | null;
  icon_url: string | null;
}

interface ArtifactSetRow {
  id: string;
  game_key: string;
  name_pt_br: string;
  rarities: string;
  source_provider: string;
  source_entry_id: string | null;
  icon_url: string | null;
}

interface CatalogMetadataRow {
  key: string;
  value: string;
  updated_at: string;
}

function mapCharacterRow(row: CharacterRow): CharacterData {
  const isUpcoming = row.release_version_id === '7.1';
  return {
    id: row.id,
    gameKey: row.game_key,
    namePtBr: row.name_pt_br,
    rarity: row.rarity as 4 | 5,
    element: row.element as Element,
    weaponType: row.weapon_type as WeaponType,
    releaseVersionId: row.release_version_id,
    sourceProvider: row.source_provider,
    sourceEntryId: row.source_entry_id,
    iconUrl: row.icon_url,
    splashUrl: row.splash_url,
    region: row.region ?? null,
    maxConstellation: row.max_constellation != null ? Number(row.max_constellation) : 6,
    supportsFriendship: row.supports_friendship != null ? Boolean(row.supports_friendship) : true,
    availability: isUpcoming ? 'upcoming' : 'available',
  };
}

function mapWeaponRow(row: WeaponRow): WeaponData {
  return {
    id: row.id,
    gameKey: row.game_key,
    namePtBr: row.name_pt_br,
    rarity: row.rarity as Rarity,
    weaponType: row.weapon_type as WeaponType,
    releaseVersionId: row.release_version_id,
    sourceProvider: row.source_provider,
    sourceEntryId: row.source_entry_id,
    iconUrl: row.icon_url,
  };
}

function mapMaterialRow(row: MaterialRow): MaterialData {
  return {
    id: row.id,
    gameKey: row.game_key,
    namePtBr: row.name_pt_br,
    category: row.category as MaterialCategory,
    rarity: row.rarity as Rarity | null,
    region: row.region,
    sourceProvider: row.source_provider,
    sourceEntryId: row.source_entry_id,
    iconUrl: row.icon_url,
  };
}

function mapArtifactSetRow(row: ArtifactSetRow): ArtifactSetData {
  let rarities: Rarity[] = [4, 5];
  try {
    const parsed = JSON.parse(row.rarities) as unknown[];
    if (Array.isArray(parsed)) {
      rarities = parsed.map(Number) as Rarity[];
    }
  } catch {
    rarities = row.rarities.split(',').map((s) => Number(s.trim()) as Rarity);
  }

  return {
    id: row.id,
    gameKey: row.game_key,
    namePtBr: row.name_pt_br,
    rarities,
    sourceProvider: row.source_provider,
    sourceEntryId: row.source_entry_id,
    iconUrl: row.icon_url,
  };
}

export interface ICatalogRepository {
  getCharacters(): Promise<CharacterData[]>;
  getCharacter(idOrKey: string): Promise<CharacterData | null>;
  getWeapons(): Promise<WeaponData[]>;
  getWeapon(idOrKey: string): Promise<WeaponData | null>;
  getMaterials(): Promise<MaterialData[]>;
  getMaterial(idOrKey: string): Promise<MaterialData | null>;
  getArtifactSets(): Promise<ArtifactSetData[]>;
  getArtifactSet(idOrKey: string): Promise<ArtifactSetData | null>;
  saveCharacters(characters: CharacterData[]): Promise<number>;
  saveWeapons(weapons: WeaponData[]): Promise<number>;
  saveMaterials(materials: MaterialData[]): Promise<number>;
  saveArtifactSets(artifactSets: ArtifactSetData[]): Promise<number>;
  getCatalogMetadata(): Promise<CatalogMetadata | null>;
  setCatalogMetadata(key: string, value: string): Promise<void>;
  isCatalogPopulated(): Promise<boolean>;
  clearCatalog(): Promise<void>;
}

export class SqliteCatalogRepository implements ICatalogRepository {
  public async getCharacters(): Promise<CharacterData[]> {
    const db = await getDatabase();
    const rows = await db.select<CharacterRow[]>('SELECT * FROM characters ORDER BY rarity DESC, name_pt_br ASC');
    return (rows || []).map(mapCharacterRow);
  }

  public async getCharacter(idOrKey: string): Promise<CharacterData | null> {
    const db = await getDatabase();
    const rows = await db.select<CharacterRow[]>(
      'SELECT * FROM characters WHERE id = $1 OR LOWER(game_key) = LOWER($1) LIMIT 1',
      [idOrKey]
    );
    if (!rows || rows.length === 0) return null;
    return mapCharacterRow(rows[0]);
  }

  public async getWeapons(): Promise<WeaponData[]> {
    const db = await getDatabase();
    const rows = await db.select<WeaponRow[]>('SELECT * FROM weapons ORDER BY rarity DESC, name_pt_br ASC');
    return (rows || []).map(mapWeaponRow);
  }

  public async getWeapon(idOrKey: string): Promise<WeaponData | null> {
    const db = await getDatabase();
    const rows = await db.select<WeaponRow[]>(
      'SELECT * FROM weapons WHERE id = $1 OR LOWER(game_key) = LOWER($1) LIMIT 1',
      [idOrKey]
    );
    if (!rows || rows.length === 0) return null;
    return mapWeaponRow(rows[0]);
  }

  public async getMaterials(): Promise<MaterialData[]> {
    const db = await getDatabase();
    const rows = await db.select<MaterialRow[]>('SELECT * FROM materials ORDER BY category ASC, rarity DESC, name_pt_br ASC');
    return (rows || []).map(mapMaterialRow);
  }

  public async getMaterial(idOrKey: string): Promise<MaterialData | null> {
    const db = await getDatabase();
    const rows = await db.select<MaterialRow[]>(
      'SELECT * FROM materials WHERE id = $1 OR LOWER(game_key) = LOWER($1) LIMIT 1',
      [idOrKey]
    );
    if (!rows || rows.length === 0) return null;
    return mapMaterialRow(rows[0]);
  }

  public async getArtifactSets(): Promise<ArtifactSetData[]> {
    const db = await getDatabase();
    const rows = await db.select<ArtifactSetRow[]>('SELECT * FROM artifact_sets ORDER BY name_pt_br ASC');
    return (rows || []).map(mapArtifactSetRow);
  }

  public async getArtifactSet(idOrKey: string): Promise<ArtifactSetData | null> {
    const db = await getDatabase();
    const rows = await db.select<ArtifactSetRow[]>(
      'SELECT * FROM artifact_sets WHERE id = $1 OR LOWER(game_key) = LOWER($1) LIMIT 1',
      [idOrKey]
    );
    if (!rows || rows.length === 0) return null;
    return mapArtifactSetRow(rows[0]);
  }

  public async saveCharacters(characters: CharacterData[]): Promise<number> {
    const db = await getDatabase();
    let saved = 0;
    for (const c of characters) {
      await db.execute(
        `INSERT INTO characters (
          id, game_key, name_pt_br, rarity, element, weapon_type,
          release_version_id, source_provider, source_entry_id, icon_url, splash_url,
          region, max_constellation, supports_friendship
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT(id) DO UPDATE SET
          game_key = excluded.game_key,
          name_pt_br = excluded.name_pt_br,
          rarity = excluded.rarity,
          element = excluded.element,
          weapon_type = excluded.weapon_type,
          release_version_id = excluded.release_version_id,
          source_provider = excluded.source_provider,
          source_entry_id = excluded.source_entry_id,
          icon_url = excluded.icon_url,
          splash_url = excluded.splash_url,
          region = excluded.region,
          max_constellation = excluded.max_constellation,
          supports_friendship = excluded.supports_friendship`,
        [
          c.id,
          c.gameKey,
          c.namePtBr,
          c.rarity,
          c.element,
          c.weaponType,
          c.releaseVersionId ?? null,
          c.sourceProvider,
          c.sourceEntryId ?? null,
          c.iconUrl ?? null,
          c.splashUrl ?? null,
          c.region ?? null,
          c.maxConstellation ?? 6,
          c.supportsFriendship === false ? 0 : 1,
        ]
      );
      saved++;
    }
    return saved;
  }

  public async saveWeapons(weapons: WeaponData[]): Promise<number> {
    const db = await getDatabase();
    let saved = 0;
    for (const w of weapons) {
      await db.execute(
        `INSERT INTO weapons (
          id, game_key, name_pt_br, rarity, weapon_type,
          release_version_id, source_provider, source_entry_id, icon_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT(id) DO UPDATE SET
          game_key = excluded.game_key,
          name_pt_br = excluded.name_pt_br,
          rarity = excluded.rarity,
          weapon_type = excluded.weapon_type,
          release_version_id = excluded.release_version_id,
          source_provider = excluded.source_provider,
          source_entry_id = excluded.source_entry_id,
          icon_url = excluded.icon_url`,
        [
          w.id,
          w.gameKey,
          w.namePtBr,
          w.rarity,
          w.weaponType,
          w.releaseVersionId ?? null,
          w.sourceProvider,
          w.sourceEntryId ?? null,
          w.iconUrl ?? null,
        ]
      );
      saved++;
    }
    return saved;
  }

  public async saveMaterials(materials: MaterialData[]): Promise<number> {
    const db = await getDatabase();
    let saved = 0;
    for (const m of materials) {
      await db.execute(
        `INSERT INTO materials (
          id, game_key, name_pt_br, category, rarity, region,
          source_provider, source_entry_id, icon_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT(id) DO UPDATE SET
          game_key = excluded.game_key,
          name_pt_br = excluded.name_pt_br,
          category = excluded.category,
          rarity = excluded.rarity,
          region = excluded.region,
          source_provider = excluded.source_provider,
          source_entry_id = excluded.source_entry_id,
          icon_url = excluded.icon_url`,
        [
          m.id,
          m.gameKey,
          m.namePtBr,
          m.category,
          m.rarity ?? null,
          m.region ?? null,
          m.sourceProvider,
          m.sourceEntryId ?? null,
          m.iconUrl ?? null,
        ]
      );
      saved++;
    }
    return saved;
  }

  public async saveArtifactSets(artifactSets: ArtifactSetData[]): Promise<number> {
    const db = await getDatabase();
    let saved = 0;
    for (const a of artifactSets) {
      await db.execute(
        `INSERT INTO artifact_sets (
          id, game_key, name_pt_br, rarities, source_provider, source_entry_id, icon_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(id) DO UPDATE SET
          game_key = excluded.game_key,
          name_pt_br = excluded.name_pt_br,
          rarities = excluded.rarities,
          source_provider = excluded.source_provider,
          source_entry_id = excluded.source_entry_id,
          icon_url = excluded.icon_url`,
        [
          a.id,
          a.gameKey,
          a.namePtBr,
          JSON.stringify(a.rarities),
          a.sourceProvider,
          a.sourceEntryId ?? null,
          a.iconUrl ?? null,
        ]
      );
      saved++;
    }
    return saved;
  }

  public async getCatalogMetadata(): Promise<CatalogMetadata | null> {
    const db = await getDatabase();
    const rows = await db.select<CatalogMetadataRow[]>('SELECT * FROM catalog_metadata');
    if (!rows || rows.length === 0) return null;

    const map = new Map<string, string>();
    let latestUpdatedAt = '';
    for (const r of rows) {
      map.set(r.key, r.value);
      if (!latestUpdatedAt || r.updated_at > latestUpdatedAt) {
        latestUpdatedAt = r.updated_at;
      }
    }

    const charsCount = await this.countTable('characters');
    const weapsCount = await this.countTable('weapons');
    const matsCount = await this.countTable('materials');
    const artsCount = await this.countTable('artifact_sets');

    const schemaVersion = map.get('schema_version') || '1.0';
    const contentVersion = map.get('content_version') || map.get('catalog_version') || '5.4.0-dev-bootstrap';
    const sourceProvider = map.get('source_provider') || 'manual_bootstrap';
    const catalogState = (map.get('catalog_state') as CatalogState) || 'development';
    const generatedAt =
      map.get('generated_at') || map.get('catalog_updated_at') || latestUpdatedAt || new Date().toISOString();
    const updatedAt = map.get('catalog_updated_at') || latestUpdatedAt || new Date().toISOString();

    const categoryStates: CategoryCompleteness = {
      characters: (map.get('category_state_characters') as CatalogState) || (catalogState === 'complete' ? 'complete' : 'development'),
      weapons: (map.get('category_state_weapons') as CatalogState) || (catalogState === 'complete' ? 'complete' : 'development'),
      materials: (map.get('category_state_materials') as CatalogState) || (catalogState === 'complete' ? 'complete' : 'development'),
      artifactSets: (map.get('category_state_artifact_sets') as CatalogState) || (catalogState === 'complete' ? 'complete' : 'development'),
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
      charactersCount: Number(map.get('characters_count')) || charsCount,
      weaponsCount: Number(map.get('weapons_count')) || weapsCount,
      materialsCount: Number(map.get('materials_count')) || matsCount,
      artifactSetsCount: Number(map.get('artifact_sets_count')) || artsCount,
      rosterCoverage: map.get('roster_coverage') || (Number(map.get('characters_count')) >= 112 ? 'through-7.1' : undefined),
    };
  }

  public async setCatalogMetadata(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('INSERT OR REPLACE INTO catalog_metadata (key, value) VALUES ($1, $2)', [key, value]);
  }

  public async isCatalogPopulated(): Promise<boolean> {
    const charCount = await this.countTable('characters');
    return charCount > 0;
  }

  public async clearCatalog(): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM characters');
    await db.execute('DELETE FROM weapons');
    await db.execute('DELETE FROM materials');
    await db.execute('DELETE FROM artifact_sets');
    await db.execute('DELETE FROM catalog_metadata');
  }

  private async countTable(table: string): Promise<number> {
    try {
      const db = await getDatabase();
      const res = await db.select<Array<{ count: number }>>(`SELECT COUNT(*) as count FROM ${table}`);
      return res?.[0]?.count ?? 0;
    } catch {
      return 0;
    }
  }
}

export const catalogRepository: ICatalogRepository = new SqliteCatalogRepository();
