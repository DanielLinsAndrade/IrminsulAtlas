import type {
  ArtifactSetData,
  CatalogImportResult,
  CatalogState,
  CategoryCompleteness,
  CharacterData,
  GameCatalogPayload,
  MaterialData,
  WeaponData,
} from '../../domain/catalog';
import { type ICatalogRepository, catalogRepository } from '../db/catalogRepository';
import { BUNDLED_GAME_CATALOG } from './bundledCatalog';

export interface ICatalogImporter {
  importCatalog(payload: unknown): Promise<CatalogImportResult>;
  importBundledCatalog(): Promise<CatalogImportResult>;
}

export class CatalogImporter implements ICatalogImporter {
  private repository: ICatalogRepository;

  constructor(repository?: ICatalogRepository) {
    this.repository = repository ?? catalogRepository;
  }

  public async importBundledCatalog(): Promise<CatalogImportResult> {
    return this.importCatalog(BUNDLED_GAME_CATALOG);
  }

  public async importCatalog(rawPayload: unknown): Promise<CatalogImportResult> {
    const warnings: string[] = [];

    // 1. Validação estrutural básica
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Formato de catálogo inválido: o payload deve ser um objeto JSON válido.');
    }

    const payload = rawPayload as Partial<GameCatalogPayload>;
    const contentVersion = payload.contentVersion || payload.version;

    if (!contentVersion || typeof contentVersion !== 'string' || contentVersion.trim() === '') {
      throw new Error('Formato de catálogo inválido: campo "version" ausente ou inválido (ou "contentVersion").');
    }

    if (!payload.sourceProvider || typeof payload.sourceProvider !== 'string') {
      throw new Error('Formato de catálogo inválido: campo "sourceProvider" ausente ou inválido.');
    }

    if (!Array.isArray(payload.characters)) {
      throw new Error('Formato de catálogo inválido: campo "characters" deve ser uma lista.');
    }

    if (!Array.isArray(payload.weapons)) {
      throw new Error('Formato de catálogo inválido: campo "weapons" deve ser uma lista.');
    }

    if (!Array.isArray(payload.materials)) {
      throw new Error('Formato de catálogo inválido: campo "materials" deve ser uma lista.');
    }

    // 2. Validação e sanitização de personagens
    const validCharacters: CharacterData[] = [];
    for (let i = 0; i < payload.characters.length; i++) {
      const c = payload.characters[i];
      if (!c || typeof c !== 'object' || !c.id || !c.gameKey || !c.namePtBr) {
        warnings.push(`Personagem no índice ${i} ignorado por possuir identificador ou nome inválido.`);
        continue;
      }
      if (c.rarity !== 4 && c.rarity !== 5) {
        warnings.push(`Personagem "${c.namePtBr}" possui raridade inválida (${c.rarity}). Esperado 4 ou 5.`);
        continue;
      }
      validCharacters.push({
        id: String(c.id),
        gameKey: String(c.gameKey),
        namePtBr: String(c.namePtBr),
        rarity: c.rarity,
        element: c.element || 'electro',
        weaponType: c.weaponType || 'sword',
        releaseVersionId: c.releaseVersionId ? String(c.releaseVersionId) : null,
        sourceProvider: c.sourceProvider ? String(c.sourceProvider) : payload.sourceProvider,
        sourceEntryId: c.sourceEntryId ? String(c.sourceEntryId) : null,
        iconUrl: c.iconUrl ? String(c.iconUrl) : null,
        splashUrl: c.splashUrl ? String(c.splashUrl) : null,
        region: c.region ? String(c.region) : null,
        maxConstellation: c.maxConstellation != null ? Number(c.maxConstellation) : 6,
        supportsFriendship: c.supportsFriendship !== undefined ? Boolean(c.supportsFriendship) : true,
        availability: c.availability === 'upcoming' ? 'upcoming' : 'available',
      });
    }

    // 3. Validação e sanitização de armas
    const validWeapons: WeaponData[] = [];
    for (let i = 0; i < payload.weapons.length; i++) {
      const w = payload.weapons[i];
      if (!w || typeof w !== 'object' || !w.id || !w.gameKey || !w.namePtBr) {
        warnings.push(`Arma no índice ${i} ignorada por dados incompletos.`);
        continue;
      }
      validWeapons.push({
        id: String(w.id),
        gameKey: String(w.gameKey),
        namePtBr: String(w.namePtBr),
        rarity: w.rarity ?? 4,
        weaponType: w.weaponType || 'sword',
        releaseVersionId: w.releaseVersionId ? String(w.releaseVersionId) : null,
        sourceProvider: w.sourceProvider ? String(w.sourceProvider) : payload.sourceProvider,
        sourceEntryId: w.sourceEntryId ? String(w.sourceEntryId) : null,
        iconUrl: w.iconUrl ? String(w.iconUrl) : null,
      });
    }

    // 4. Validação e sanitização de materiais
    const validMaterials: MaterialData[] = [];
    for (let i = 0; i < payload.materials.length; i++) {
      const m = payload.materials[i];
      if (!m || typeof m !== 'object' || !m.id || !m.gameKey || !m.namePtBr) {
        warnings.push(`Material no índice ${i} ignorado por dados incompletos.`);
        continue;
      }
      validMaterials.push({
        id: String(m.id),
        gameKey: String(m.gameKey),
        namePtBr: String(m.namePtBr),
        category: m.category || 'other',
        rarity: m.rarity ?? null,
        region: m.region ? String(m.region) : null,
        sourceProvider: m.sourceProvider ? String(m.sourceProvider) : payload.sourceProvider,
        sourceEntryId: m.sourceEntryId ? String(m.sourceEntryId) : null,
        iconUrl: m.iconUrl ? String(m.iconUrl) : null,
      });
    }

    // 5. Validação e sanitização de artefatos
    const validArtifacts: ArtifactSetData[] = [];
    if (Array.isArray(payload.artifactSets)) {
      for (let i = 0; i < payload.artifactSets.length; i++) {
        const a = payload.artifactSets[i];
        if (!a || typeof a !== 'object' || !a.id || !a.gameKey || !a.namePtBr) {
          warnings.push(`Conjunto de artefatos no índice ${i} ignorado por dados incompletos.`);
          continue;
        }
        validArtifacts.push({
          id: String(a.id),
          gameKey: String(a.gameKey),
          namePtBr: String(a.namePtBr),
          rarities: Array.isArray(a.rarities) && a.rarities.length > 0 ? a.rarities : [4, 5],
          sourceProvider: a.sourceProvider ? String(a.sourceProvider) : payload.sourceProvider,
          sourceEntryId: a.sourceEntryId ? String(a.sourceEntryId) : null,
          iconUrl: a.iconUrl ? String(a.iconUrl) : null,
        });
      }
    }

    // 6. Persistência idempotente no repositório de catálogo
    const charsCount = await this.repository.saveCharacters(validCharacters);
    const weapsCount = await this.repository.saveWeapons(validWeapons);
    const matsCount = await this.repository.saveMaterials(validMaterials);
    const artsCount = await this.repository.saveArtifactSets(validArtifacts);

    // 7. Gravação de metadados de versão e integridade
    const schemaVersion = payload.schemaVersion || '1.0';
    const resolvedContentVersion = contentVersion;
    const catalogState: CatalogState = payload.catalogState || 'development';
    const generatedAt = payload.generatedAt || payload.updatedAt || new Date().toISOString();
    const now = payload.updatedAt || new Date().toISOString();

    await this.repository.setCatalogMetadata('schema_version', schemaVersion);
    await this.repository.setCatalogMetadata('content_version', resolvedContentVersion);
    await this.repository.setCatalogMetadata('catalog_version', resolvedContentVersion); // compatibilidade
    await this.repository.setCatalogMetadata('source_provider', payload.sourceProvider);
    await this.repository.setCatalogMetadata('catalog_state', catalogState);
    await this.repository.setCatalogMetadata('generated_at', generatedAt);
    await this.repository.setCatalogMetadata('catalog_updated_at', now);
    await this.repository.setCatalogMetadata('characters_count', String(charsCount));
    await this.repository.setCatalogMetadata('weapons_count', String(weapsCount));
    await this.repository.setCatalogMetadata('materials_count', String(matsCount));
    await this.repository.setCatalogMetadata('artifact_sets_count', String(artsCount));
    if (payload.rosterCoverage) {
      await this.repository.setCatalogMetadata('roster_coverage', payload.rosterCoverage);
    }

    const categoryStates: CategoryCompleteness = {
      characters: payload.categoryStates?.characters || (charsCount >= 90 ? 'complete' : catalogState),
      weapons: payload.categoryStates?.weapons || (weapsCount >= 200 ? 'complete' : catalogState),
      materials: payload.categoryStates?.materials || catalogState,
      artifactSets: payload.categoryStates?.artifactSets || catalogState,
    };

    await this.repository.setCatalogMetadata('category_state_characters', categoryStates.characters);
    await this.repository.setCatalogMetadata('category_state_weapons', categoryStates.weapons);
    await this.repository.setCatalogMetadata('category_state_materials', categoryStates.materials);
    await this.repository.setCatalogMetadata('category_state_artifact_sets', categoryStates.artifactSets);

    return {
      success: true,
      schemaVersion,
      contentVersion: resolvedContentVersion,
      version: resolvedContentVersion,
      sourceProvider: payload.sourceProvider,
      catalogState,
      categoryStates,
      charactersImported: charsCount,
      weaponsImported: weapsCount,
      materialsImported: matsCount,
      artifactSetsImported: artsCount,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

export const defaultCatalogImporter: ICatalogImporter = new CatalogImporter();
