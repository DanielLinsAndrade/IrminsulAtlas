import icons from '../../infrastructure/providers/achievementIcons.json';

// Presentation order observed at https://seelie.me/achievements on 2026-09-18.
// Explicit group identities; neither database insertion nor translated alphabet determines order.
export const CATEGORY_GROUP_ORDER = [0,17,1,22,32,43,57,65,71,2,3,4,5,6,36,7,8,14,15,20,29,34,39,40,49,59,9,10,11,12,13,21,33,44,53,64,72,16,18,19,23,24,26,27,25,28,30,31,35,38,37,41,42,45,46,47,48,50,52,51,55,54,56,61,58,60,62,63,66,67,68,69,70] as const;
const groupNames = new Map(Object.entries(icons.categories).map(([name, entry]) => [entry.groupId, name]));
export const CATEGORY_ORDER = CATEGORY_GROUP_ORDER.map(id => groupNames.get(id)!);
const rank = new Map(CATEGORY_ORDER.map((name, index) => [name, index]));
export function compareAchievementCategories(a: string, b: string) {
  return (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity) || a.localeCompare(b, 'pt-BR');
}
