import { resolveCatalogEntry } from '../../domain/catalog/identity';
import { MATERIAL_ALIASES } from '../../domain/catalog/materialAliases';
import type { InventoryItem } from '../../domain/inventory';
import { BUNDLED_GAME_CATALOG } from '../importers/bundledCatalog';

export function canonicalMaterialId(id: string): string {
  return MATERIAL_ALIASES[id] ?? resolveCatalogEntry(BUNDLED_GAME_CATALOG.materials, id, 'material')?.id ?? id;
}

export function mergeInventoryAliases(items: readonly InventoryItem[]): InventoryItem[] {
  const grouped = new Map<string, InventoryItem>();
  for (const item of items) {
    const materialId = canonicalMaterialId(item.materialId);
    const key = `${item.profileId}:${materialId}`;
    const previous = grouped.get(key);
    grouped.set(key, { ...item, materialId, quantity: item.quantity + (previous?.quantity ?? 0), updatedAt: previous && previous.updatedAt > item.updatedAt ? previous.updatedAt : item.updatedAt });
  }
  return [...grouped.values()];
}
