import type { WeaponData, WeaponType } from '../catalog';
import type { AccountWeapon } from './types';
import { resolveCatalogEntry, uniqueCatalogEntries } from '../catalog/identity';

export const COLLECTION_TYPES: Record<WeaponType, string> = { sword: 'Espada', claymore: 'Espadão', polearm: 'Lança', catalyst: 'Catalisador', bow: 'Arco' };
export type WeaponCollectionTargets = Partial<Record<WeaponType, number>>;
// ForgeExcelConfigData snapshot, 2026-09-19. IDs are game IDs, never display names.
// https://gitlab.com/Dimbreath/AnimeGameData/-/raw/master/ExcelBinOutput/ForgeExcelConfigData.json
export const REGIONAL_FORGE_IDS: Record<string, readonly number[]> = {
  Mondstadt: [12407, 14407, 15407, 12411, 14412, 13409],
  Liyue: [11406, 11407, 12406, 13402, 13403, 14406, 15406],
  Inazuma: [11414, 12414, 13414, 14414, 15414],
  Sumeru: [11417, 12417, 13417, 14417, 15417],
  Fontaine: [11425, 12425, 13425, 14425, 15425],
  Natlan: [11431, 12431, 13431, 14431, 15431],
  'Nod-Krai': [11433, 12433, 13433, 14433, 15433],
  // Version 7.0 forgeables, matched to bundled game IDs (KQM Snezhnaya overview).
  // https://keqingmains.com/misc/snezhnaya/
  Snezhnaya: [11436, 12436, 13436, 14436, 15436],
};
export function validateCollectionTargets(value: unknown): WeaponCollectionTargets {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Metas de armas inválidas.');
  const result: WeaponCollectionTargets = {};
  for (const [key, count] of Object.entries(value)) {
    if (!Object.prototype.hasOwnProperty.call(COLLECTION_TYPES, key) || typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0 || count > 99999) throw new Error('Use metas inteiras entre 0 e 99999.');
    result[key as WeaponType] = count;
  }
  return result;
}
export type BilletStock = Partial<Record<WeaponType, number>>;
export function validateBilletStock(value: unknown): BilletStock {
  try { return validateCollectionTargets(value); }
  catch { throw new Error('Use quantidades inteiras de protótipos entre 0 e 99999.'); }
}
export function forgeableDebt(refinement: number | null): number {
  if (refinement === null) return 5;
  if (!Number.isInteger(refinement) || refinement < 1 || refinement > 5) throw new Error('Refinamento inválido.');
  return 5 - refinement;
}
export function regionalWeaponCollection(catalog: WeaponData[], collection: AccountWeapon[], profileId: string) {
  const actual = collection.filter(item => item.profileId === profileId);
  const canonical = uniqueCatalogEntries(catalog, 'weapon');
  return Object.entries(REGIONAL_FORGE_IDS).map(([region, ids]) => ({
    region,
    weapons: canonical.filter(item => ids.includes(Number(item.sourceEntryId))).map(item => {
      const copies = actual.filter(copy => resolveCatalogEntry(catalog, copy.weaponId, 'weapon')?.sourceEntryId === item.sourceEntryId)
        .sort((a, b) => b.refinement - a.refinement || a.instanceNo - b.instanceNo);
      return { ...item, owned: copies.length > 0, copies, refinement: copies[0]?.refinement ?? null, debt: forgeableDebt(copies[0]?.refinement ?? null) };
    }),
  }));
}
export function weaponCollectionSummary(catalog: WeaponData[], collection: AccountWeapon[], stock: BilletStock, profileId: string) {
  const weapons = regionalWeaponCollection(catalog, collection, profileId).flatMap(group => group.weapons);
  return (Object.keys(COLLECTION_TYPES) as WeaponType[]).map(type => {
    const need = weapons.filter(item => item.weaponType === type).reduce((total, item) => total + item.debt, 0);
    const have = stock[type] ?? 0;
    return { type, need, have, missing: Math.max(need - have, 0), surplus: Math.max(have - need, 0) };
  });
}
