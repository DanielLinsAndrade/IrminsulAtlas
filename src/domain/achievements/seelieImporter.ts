import { resolveAchievementId } from './seedData';
import type { SeelieImportPreview } from './types';

/**
 * Representa a estrutura de payload esperada de um backup do Seelie.
 */
export interface SeelieBackup {
  achievements?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Valida e extrai o dicionário de conquistas de uma string JSON ou objeto parseado do Seelie.
 * Ignora estritamente todos os campos fora de `achievements` (ex: inventory, goals, etc).
 */
export function parseSeeliePayload(input: string | Record<string, unknown>): Record<string, unknown> {
  let parsed: unknown = input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('O conteúdo fornecido está vazio.');
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('Formato JSON inválido: não foi possível interpretar o arquivo de backup.');
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Formato inválido: o backup do Seelie deve ser um objeto JSON.');
  }

  const payload = parsed as SeelieBackup;

  if (!payload.achievements || typeof payload.achievements !== 'object' || Array.isArray(payload.achievements)) {
    throw new Error('Backup incompatível: nenhuma seção de "achievements" foi encontrada no arquivo.');
  }

  return payload.achievements;
}

/**
 * Normaliza um valor de conquista do Seelie (que pode vir como `{ done: true }`, `{ done: false }`, `true`, `false`, etc).
 * Retorna boolean (true/false) ou null caso seja irreconhecível.
 */
export function normalizeSeelieEntry(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'done' in value) {
    const doneVal = (value as { done: unknown }).done;
    if (typeof doneVal === 'boolean') {
      return doneVal;
    }
    if (doneVal === 'true' || doneVal === 1) return true;
    if (doneVal === 'false' || doneVal === 0) return false;
  }

  return null;
}

/**
 * Analisa as conquistas brutas do Seelie contra o catálogo de IDs conhecidos e o status atual do perfil,
 * gerando um preview transacional e seguro antes da aplicação definitiva.
 */
export function buildSeelieImportPreview(
  rawAchievements: Record<string, unknown>,
  knownIds: Set<string>,
  currentStatuses: Map<string, boolean>
): SeelieImportPreview {
  let totalFound = 0;
  let recognizedCount = 0;
  let alreadyDoneCount = 0;
  let toMarkDoneCount = 0;
  let toUnmarkCount = 0;
  const unknownIds: string[] = [];
  const entriesToApply: { achievementId: string; completed: boolean }[] = [];

  for (const [rawId, rawValue] of Object.entries(rawAchievements)) {
    const normalized = normalizeSeelieEntry(rawValue);
    if (normalized === null) {
      continue;
    }

    totalFound++;
    const resolvedId = resolveAchievementId(rawId);
    const isKnown = knownIds.has(resolvedId) || knownIds.has(rawId);
    const effectiveId = knownIds.has(resolvedId) ? resolvedId : rawId;

    if (!isKnown) {
      unknownIds.push(rawId);
      continue;
    }

    recognizedCount++;
    const currentCompleted = currentStatuses.get(effectiveId) ?? false;

    if (normalized === true) {
      if (currentCompleted) {
        alreadyDoneCount++;
      } else {
        toMarkDoneCount++;
        entriesToApply.push({ achievementId: effectiveId, completed: true });
      }
    } else {
      // normalized === false
      if (currentCompleted) {
        toUnmarkCount++;
        entriesToApply.push({ achievementId: effectiveId, completed: false });
      }
    }
  }

  return {
    totalFound,
    recognizedCount,
    alreadyDoneCount,
    toMarkDoneCount,
    toUnmarkCount,
    unknownIds,
    entriesToApply,
  };
}
