import { getProfileCharacters } from '../../infrastructure/db/travelerRepository';
import { MAIN_ROUTES, type RouteId } from '../routes/routes';
import { defaultGameDataProvider } from '../../infrastructure/providers';
import { achievementsRepository, wishGoalsRepository } from '../../infrastructure/db';

export interface SearchEntry {
  id: string;
  label: string;
  group: string;
  route: RouteId;
  description?: string;
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function searchEntries(entries: SearchEntry[], query: string): SearchEntry[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    const text = normalizeSearch(`${entry.label} ${entry.description ?? ''}`);
    return terms.every(term => text.includes(term));
  }).sort((a, b) => a.group.localeCompare(b.group, 'pt-BR') || a.label.localeCompare(b.label, 'pt-BR'));
}

export async function loadSearchIndex(profileId?: string): Promise<SearchEntry[]> {
  const [characters, weapons, materials, achievements, goals] = await Promise.all([
    profileId ? getProfileCharacters(profileId) : defaultGameDataProvider.getAllCharacters(),
    defaultGameDataProvider.getAllWeapons(),
    defaultGameDataProvider.getAllMaterials(),
    profileId ? achievementsRepository.getAchievementsWithStatus(profileId) : Promise.resolve([]),
    profileId ? wishGoalsRepository.getGoalsByProfile(profileId) : Promise.resolve([]),
  ]);
  return [
    ...MAIN_ROUTES.map(r => ({ id: r.id, label: r.label, description: r.description, group: 'Páginas', route: r.id })),
    ...characters.map(c => ({ id: c.id, label: c.namePtBr, group: 'Personagens', route: 'characters' as const })),
    ...weapons.map(w => ({ id: w.id, label: w.namePtBr, group: 'Armas', route: 'weapons' as const })),
    ...materials.map(m => ({ id: m.id, label: m.namePtBr, group: 'Materiais', route: 'inventory' as const })),
    ...achievements.map(a => ({ id: a.id, label: a.namePtBr, description: a.category, group: 'Conquistas', route: 'achievements' as const })),
    ...goals.map(g => ({ id: g.id, label: g.targetName, description: g.notes ?? '', group: 'Metas', route: 'banners' as const })),
  ];
}
