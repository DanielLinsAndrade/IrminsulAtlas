import { DEFAULT_RULE_SETS, type BannerType, type WishEntry } from './types';
import { validateWeaponFate, validateWeaponPath } from './weaponFate';

export type PortableWish = Omit<WishEntry, 'profileId' | 'createdAt' | 'updatedAt'>;
export interface WishCatalogItem { id: string; namePtBr: string; rarity: number }
export function exportWishHistory(wishes: WishEntry[]): string {
  return JSON.stringify({ format: 'wishlog_wishes', schemaVersion: 1, exportedAt: new Date().toISOString(), entries: [...wishes].sort((a,b) => a.sequenceNo - b.sequenceNo).map(w => ({ id: w.id, occurredAt: w.occurredAt, gameVersionId: w.gameVersionId, bannerType: w.bannerType, bannerName: w.bannerName, itemType: w.itemType, itemId: w.itemId, itemName: w.itemName, rarity: w.rarity, pityIndex: w.pityIndex, sequenceNo: w.sequenceNo, isFeatured: w.isFeatured, wonPityRate: w.bannerType === 'standard' ? false : w.wonPityRate, ruleSetId: w.ruleSetId, notes: w.notes, ...(w.weaponFateState ? { weaponFateState: w.weaponFateState } : {}), ...(w.weaponPathResult ? { weaponPathResult: w.weaponPathResult } : {}) })) }, null, 2);
}
export function parseWishHistory(text: string, characters: WishCatalogItem[], weapons: WishCatalogItem[]): PortableWish[] {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Arquivo inválido.');
  const envelope = data as Record<string, unknown>;
  if (envelope.format !== 'wishlog_wishes' || envelope.schemaVersion !== 1 || !Array.isArray(envelope.entries) || envelope.entries.length > 10000) throw new Error('Formato/versão inválido ou limite de 10.000 registros excedido.');
  const ids = new Set<string>();
  return envelope.entries.map((raw: unknown, index) => {
    const fail = (reason: string): never => { throw new Error(`Registro ${index + 1}: ${reason}`); };
    if (!raw || typeof raw !== 'object') return fail('objeto inválido');
    const row = raw as Record<string, unknown>;
    if (typeof row.id !== 'string' || !row.id.trim() || row.id.length > 200 || ids.has(row.id)) return fail('ID ausente ou duplicado');
    ids.add(row.id);
    if (!['character', 'weapon', 'standard', 'chronicled'].includes(String(row.bannerType))) return fail('banner inválido');
    if (row.itemType !== 'character' && row.itemType !== 'weapon') return fail('tipo de item inválido');
    const item = (row.itemType === 'character' ? characters : weapons).find(i => i.id === row.itemId);
    if (!item) return fail('item desconhecido no catálogo local');
    if (![3,4,5].includes(Number(row.rarity)) || row.rarity !== item.rarity) return fail('raridade incompatível com o item');
    const bannerType = row.bannerType as BannerType;
    validateWeaponFate(bannerType, row.weaponFateState);
    validateWeaponPath(bannerType, row.weaponPathResult);
    const max = row.rarity === 5 ? DEFAULT_RULE_SETS[bannerType].hardPity5Star : row.rarity === 4 ? 10 : 1;
    if (!Number.isInteger(row.pityIndex) || Number(row.pityIndex) < 1 || Number(row.pityIndex) > max) return fail('pity fora dos limites');
    if (row.gameVersionId != null && (typeof row.gameVersionId !== 'string' || !/^\d+\.\d+$/.test(row.gameVersionId))) return fail('versão deve usar major.minor');
    if (row.occurredAt != null && row.occurredAt !== '' && (typeof row.occurredAt !== 'string' || !Number.isFinite(Date.parse(row.occurredAt)))) return fail('data inválida');
    if (typeof row.isFeatured !== 'boolean' || typeof row.wonPityRate !== 'boolean') return fail('resultado/garantia devem ser booleanos');
    if (row.wonPityRate && (!row.isFeatured || row.rarity !== 5 || bannerType === 'standard')) return fail('resultado 50/50 inconsistente');
    if (row.rarity === 5 && ((bannerType === 'character' && row.itemType !== 'character') || (bannerType === 'weapon' && row.itemType !== 'weapon'))) return fail('item 5★ incompatível com o banner');
    for (const key of ['notes','bannerName','ruleSetId']) if (row[key] != null && (typeof row[key] !== 'string' || String(row[key]).length > 10000)) return fail(`${key} inválido`);
    return { id: row.id, occurredAt: typeof row.occurredAt === 'string' ? row.occurredAt : '', gameVersionId: row.gameVersionId as string | null ?? null,
      bannerType, bannerName: row.bannerName as string | null ?? null, itemType: row.itemType, itemId: item.id, itemName: item.namePtBr,
      rarity: item.rarity, pityIndex: Number(row.pityIndex), sequenceNo: index + 1, isFeatured: row.isFeatured, wonPityRate: row.wonPityRate,
      ruleSetId: row.ruleSetId as string | null ?? null, notes: row.notes as string | null ?? null,
      ...(row.weaponFateState != null ? { weaponFateState: row.weaponFateState } : {}),
      ...(row.weaponPathResult != null ? { weaponPathResult: row.weaponPathResult } : {}) };
  });
}

export function previewWishHistory(incoming: PortableWish[], existing: WishEntry[], profileId: string) {
  const known = new Set(existing.map(item => item.id));
  const nextSequence = Math.max(0, ...existing.map(item => item.sequenceNo));
  const entries = incoming.filter(item => !known.has(item.id) && !known.has(`import:${profileId}:${item.id}`))
    .map((item, index) => ({ ...item, id: `import:${profileId}:${item.id}`, sequenceNo: nextSequence + index + 1 }));
  return { entries, skipped: incoming.length - entries.length };
}
