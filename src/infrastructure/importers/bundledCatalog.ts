import type { GameCatalogPayload } from '../../domain/catalog';
import defaultCatalogJson from './datasets/defaultCatalog.json';

/**
 * Catálogo padrão embutido na aplicação para bootstrapping inicial e operação offline.
 * Os dados estáticos residem isolados em `datasets/defaultCatalog.json`, permitindo
 * atualizações por pipelines externos sem alteração de lógica de código.
 */
export const BUNDLED_GAME_CATALOG: GameCatalogPayload = defaultCatalogJson as unknown as GameCatalogPayload;
