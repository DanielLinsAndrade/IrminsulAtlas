import type { Achievement } from './types';
import catalog from './catalog.generated.json';

export const CATALOG_IDS = new Set(catalog.entries.map(entry => entry.id));
export const SEED_ACHIEVEMENTS: Omit<Achievement, 'createdAt'>[] = catalog.entries;
export const ACHIEVEMENT_CATALOG_INFO = { count: catalog.entries.length, source: catalog.source, retrievedAt: catalog.retrievedAt };

/** Only Seelie's external numeric namespace is normalized; old Irminsul Atlas IDs are not aliases. */
export function resolveAchievementId(id: string): string {
  return CATALOG_IDS.has(`gi_${id}`) ? `gi_${id}` : id;
}
