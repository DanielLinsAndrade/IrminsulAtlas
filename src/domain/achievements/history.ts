import type { AchievementWithStatus, SeelieImportPreview } from './types';
import { CATALOG_IDS } from './seedData';

export function exportAchievementHistory(items: AchievementWithStatus[]) {
  return JSON.stringify({ format: 'wishlog_achievements', schemaVersion: 1, exportedAt: new Date().toISOString(),
    entries: items.filter(item => CATALOG_IDS.has(item.id)).map(item => ({ id: item.id, completed: item.completed, completedAt: item.completedAt })) }, null, 2);
}

export function previewAchievementHistory(input: unknown, current: AchievementWithStatus[]): SeelieImportPreview {
  if (!input || typeof input !== 'object') throw new Error('Arquivo inválido.');
  const data = input as Record<string, unknown>;
  if (data.format !== 'wishlog_achievements' || data.schemaVersion !== 1 || !Array.isArray(data.entries)) throw new Error('Formato ou versão de conquistas incompatível.');
  const known = new Map(current.map(item => [item.id, item]));
  const seen = new Set<string>();
  const preview: SeelieImportPreview = { totalFound: data.entries.length, recognizedCount: 0, alreadyDoneCount: 0, toMarkDoneCount: 0, toUnmarkCount: 0, unknownIds: [], entriesToApply: [] };
  for (const raw of data.entries) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || typeof raw.completed !== 'boolean' || (raw.completedAt !== null && (typeof raw.completedAt !== 'string' || !Number.isFinite(Date.parse(raw.completedAt))))) throw new Error('Entrada de conquista inválida.');
    if (seen.has(raw.id)) throw new Error('IDs duplicados no arquivo.');
    seen.add(raw.id);
    const existing = known.get(raw.id);
    if (!existing || !CATALOG_IDS.has(raw.id)) { preview.unknownIds.push(raw.id); continue; }
    preview.recognizedCount++;
    if (existing.completed === raw.completed && existing.completedAt === raw.completedAt) { if (raw.completed) preview.alreadyDoneCount++; continue; }
    if (raw.completed) preview.toMarkDoneCount++; else preview.toUnmarkCount++;
    preview.entriesToApply.push({ achievementId: raw.id, completed: raw.completed, completedAt: raw.completed ? raw.completedAt : null });
  }
  return preview;
}
