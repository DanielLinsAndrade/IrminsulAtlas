export type CatalogEntity = 'character' | 'weapon' | 'material' | 'artifact';
const prefixes: Record<CatalogEntity, RegExp> = { character: /^(character_|char_)/, weapon: /^(weapon_|wpn_)/, material: /^(material_|mat_)/, artifact: /^(artifact_|set_)/ };
export function catalogIdentityKey(value: string, entity: CatalogEntity): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(prefixes[entity], '').replace(/[^a-z0-9]/g, '');
}

/** Só resolve identidade técnica; nomes traduzidos não são usados para mesclar registros. */
export function resolveCatalogEntry<T extends { id: string; gameKey: string }>(entries: readonly T[], value: string, entity: CatalogEntity): T | null {
  const direct = entries.find(entry => entry.id === value || entry.gameKey === value);
  if (direct) return direct;
  const key = catalogIdentityKey(value, entity);
  const matches = entries.filter(entry => catalogIdentityKey(entry.id, entity) === key || catalogIdentityKey(entry.gameKey, entity) === key);
  const identities = new Set(matches.map(entry => catalogIdentityKey(entry.gameKey, entity)));
  return identities.size === 1 ? matches[0] : null;
}

export function uniqueCatalogEntries<T extends { id: string; gameKey: string }>(entries: readonly T[], entity: CatalogEntity): T[] {
  const unique = new Map<string, T>();
  for (const entry of entries) {
    const key = catalogIdentityKey(entry.gameKey, entity);
    if (!unique.has(key)) unique.set(key, entry);
  }
  return [...unique.values()];
}
