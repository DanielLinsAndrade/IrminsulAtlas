import type {
  ArtifactSlot,
  ArtifactSlotKey,
  BuildFilterOptions,
  BuildProgressIndicators,
  BuildStatus,
  CharacterBuild,
  CharacterBuildWithDetails,
} from './types';
import {
  ARTIFACT_LIMITS,
  TALENT_LIMITS,
  getArtifactMaxLevelByRarity,
} from '../constants/limits';

export const VALID_BUILD_STATUSES: BuildStatus[] = [
  'sem_build',
  'incompleta',
  'utilizavel',
  'precisa_melhorar',
  'completa',
];

export const BUILD_STATUS_LABELS: Record<BuildStatus, string> = {
  sem_build: 'Sem Build',
  incompleta: 'Incompleta',
  utilizavel: 'Utilizável',
  precisa_melhorar: 'Precisa Melhorar',
  completa: 'Completa',
};

export const BUILD_STATUS_COLORS: Record<BuildStatus, { text: string; bg: string; border: string }> = {
  sem_build: {
    text: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
  },
  incompleta: {
    text: '#f87171',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  precisa_melhorar: {
    text: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  utilizavel: {
    text: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  completa: {
    text: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
  },
};

export const ARTIFACT_SLOT_KEYS: ArtifactSlotKey[] = [
  'flower',
  'plume',
  'sands',
  'goblet',
  'circlet',
];

export const ARTIFACT_SLOT_NAMES: Record<ArtifactSlotKey, { label: string; short: string; iconKey: ArtifactSlotKey }> = {
  flower: { label: 'Flor da Vida', short: 'Flor', iconKey: 'flower' },
  plume: { label: 'Pluma da Morte', short: 'Pena', iconKey: 'plume' },
  sands: { label: 'Areia do Tempo', short: 'Relógio', iconKey: 'sands' },
  goblet: { label: 'Cálice de Erátema', short: 'Cálice', iconKey: 'goblet' },
  circlet: { label: 'Tiara de Logos', short: 'Coroa', iconKey: 'circlet' },
};

export const ARTIFACT_SLOT_MAIN_STATS: Record<ArtifactSlotKey, string[]> = {
  flower: ['Vida (HP)'],
  plume: ['Ataque (ATK)'],
  sands: [
    'ATK%',
    'HP%',
    'DEF%',
    'Recarga de Energia%',
    'Proficiência Elemental',
  ],
  goblet: [
    'Bônus de Dano Pyro%',
    'Bônus de Dano Hydro%',
    'Bônus de Dano Cryo%',
    'Bônus de Dano Electro%',
    'Bônus de Dano Anemo%',
    'Bônus de Dano Geo%',
    'Bônus de Dano Dendro%',
    'Bônus de Dano Físico%',
    'ATK%',
    'HP%',
    'DEF%',
    'Proficiência Elemental',
  ],
  circlet: [
    'Taxa Crítica%',
    'Dano Crítico%',
    'Bônus de Cura%',
    'ATK%',
    'HP%',
    'DEF%',
    'Proficiência Elemental',
  ],
};

export const MIN_TALENT_LEVEL = TALENT_LIMITS.LEVEL.MIN;
export const MAX_TALENT_LEVEL = TALENT_LIMITS.LEVEL.MAX;
export const MIN_ARTIFACT_LEVEL = ARTIFACT_LIMITS.LEVEL.MIN;
export const MAX_ARTIFACT_LEVEL = ARTIFACT_LIMITS.LEVEL.MAX;

export function validateBuildStatus(status: unknown): BuildStatus {
  if (typeof status === 'string' && VALID_BUILD_STATUSES.includes(status as BuildStatus)) {
    return status as BuildStatus;
  }
  return 'sem_build';
}

export function validateTalentLevel(level: unknown, fieldName = 'talento'): number {
  if (level === undefined || level === null || level === '') {
    return 1;
  }
  const parsed = Number(level);
  if (!Number.isInteger(parsed)) {
    throw new Error(`O nível de ${fieldName} deve ser um número inteiro válido.`);
  }
  if (parsed < MIN_TALENT_LEVEL || parsed > MAX_TALENT_LEVEL) {
    throw new Error(`O nível de ${fieldName} deve estar entre ${MIN_TALENT_LEVEL} e ${MAX_TALENT_LEVEL}.`);
  }
  return parsed;
}

export function validateArtifactLevel(
  level: unknown,
  fieldName = 'artefato',
  rarity?: number | null
): number {
  if (level === undefined || level === null || level === '') {
    return 0;
  }
  const parsed = Number(level);
  if (!Number.isInteger(parsed)) {
    throw new Error(`O nível do ${fieldName} deve ser um número inteiro válido.`);
  }
  const maxAllowed = getArtifactMaxLevelByRarity(rarity);
  if (parsed < MIN_ARTIFACT_LEVEL || parsed > maxAllowed) {
    throw new Error(`O nível do ${fieldName} deve estar entre ${MIN_ARTIFACT_LEVEL} e ${maxAllowed}.`);
  }
  return parsed;
}

/**
 * Computa indicadores objetivos de progresso de uma build para evitar contradições
 * entre estado declarado e realidade dos dados.
 */
export function computeBuildIndicators(
  build: CharacterBuild,
  characterLevel: number,
  weaponLevel: number | null
): BuildProgressIndicators {
  // Arma atingiu o alvo configurado e está devidamente associada?
  const isWeaponAssociated = Boolean(build.accountWeaponId);
  const weaponReady =
    isWeaponAssociated && weaponLevel !== null && weaponLevel >= build.weaponTargetLevel;

  // Personagem atingiu o nível alvo?
  const characterLevelReady = characterLevel >= build.characterTargetLevel;

  // Talentos atingiram os alvos configurados?
  const normalAttackReady = build.normalAttackLevel >= build.normalAttackTarget;
  const skillReady = build.elementalSkillLevel >= build.elementalSkillTarget;
  const burstReady = build.elementalBurstLevel >= build.elementalBurstTarget;
  const talentsReady = normalAttackReady && skillReady && burstReady;

  // Contagem de slots de artefatos
  let equippedArtifactsCount = 0;
  let maxedArtifactsCount = 0;

  for (const key of ARTIFACT_SLOT_KEYS) {
    const slot: ArtifactSlot | undefined = build.artifactSlots?.[key];
    if (slot && (slot.isEquipped || Boolean(slot.setId) || slot.level > 0)) {
      equippedArtifactsCount++;
      if (slot.level >= slot.targetLevel && slot.targetLevel > 0) {
        maxedArtifactsCount++;
      }
    }
  }

  const artifactsReady = equippedArtifactsCount === 5 && maxedArtifactsCount === 5;

  // Lista detalhada de pendências objetivas para que uma build possa ser Completa
  const missingForComplete: string[] = [];
  if (!characterLevelReady) {
    missingForComplete.push(`Nível do personagem (${characterLevel}/${build.characterTargetLevel})`);
  }
  if (!isWeaponAssociated) {
    missingForComplete.push('Nenhuma arma associada');
  } else if (weaponLevel === null || weaponLevel < build.weaponTargetLevel) {
    missingForComplete.push(`Nível da arma (${weaponLevel ?? 1}/${build.weaponTargetLevel})`);
  }
  if (!talentsReady) {
    const tParts: string[] = [];
    if (!normalAttackReady) tParts.push(`ATK ${build.normalAttackLevel}/${build.normalAttackTarget}`);
    if (!skillReady) tParts.push(`E ${build.elementalSkillLevel}/${build.elementalSkillTarget}`);
    if (!burstReady) tParts.push(`Q ${build.elementalBurstLevel}/${build.elementalBurstTarget}`);
    missingForComplete.push(`Talentos abaixo da meta (${tParts.join(', ')})`);
  }
  if (equippedArtifactsCount < 5) {
    missingForComplete.push(`Faltam ${5 - equippedArtifactsCount} artefatos equipados`);
  } else if (maxedArtifactsCount < 5) {
    missingForComplete.push(`Faltam ${5 - maxedArtifactsCount} artefatos no nível alvo`);
  }

  // Apenas apta a ser completa se todos os critérios objetivos forem cumpridos
  const canBeComplete = characterLevelReady && weaponReady && talentsReady && artifactsReady;

  // Cálculo percentual ponderado de progresso (total 100%):
  // 1: Char level (10%)
  // 2: Weapon ready (15%)
  // 3..5: 3 Talentos (25% total)
  // 6..10: 5 Artefatos (50% total)
  let score = 0;
  if (characterLevelReady) {
    score += 10;
  } else {
    score += Math.min(10, (characterLevel / Math.max(1, build.characterTargetLevel)) * 10);
  }

  if (weaponReady) {
    score += 15;
  } else if (isWeaponAssociated && weaponLevel !== null && weaponLevel > 0) {
    score += Math.min(15, (weaponLevel / Math.max(1, build.weaponTargetLevel)) * 15);
  }

  if (talentsReady) {
    score += 25;
  } else {
    score += Math.min(8.33, (build.normalAttackLevel / Math.max(1, build.normalAttackTarget)) * 8.33);
    score += Math.min(8.33, (build.elementalSkillLevel / Math.max(1, build.elementalSkillTarget)) * 8.33);
    score += Math.min(8.34, (build.elementalBurstLevel / Math.max(1, build.elementalBurstTarget)) * 8.34);
  }

  if (artifactsReady) {
    score += 50;
  } else {
    for (const key of ARTIFACT_SLOT_KEYS) {
      const slot = build.artifactSlots?.[key];
      if (slot && (slot.isEquipped || slot.level > 0)) {
        const target = Math.max(1, slot.targetLevel);
        score += Math.min(10, (slot.level / target) * 10);
      }
    }
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round(score)));

  // Sugestão de status consistente e não contraditório
  let suggestedStatus: BuildStatus;
  if (canBeComplete) {
    suggestedStatus = 'completa';
  } else if (progressPercent >= 65 && isWeaponAssociated && equippedArtifactsCount >= 4) {
    suggestedStatus = 'utilizavel';
  } else if (progressPercent >= 25 || equippedArtifactsCount >= 2 || isWeaponAssociated) {
    suggestedStatus = 'incompleta';
  } else {
    suggestedStatus = 'sem_build';
  }

  // Derivação do STATUS EFETIVO (não pode produzir contradições)
  let effectiveStatus: BuildStatus;
  let statusReason: string;

  const configured = build.status;

  const hasNoData =
    !isWeaponAssociated &&
    equippedArtifactsCount === 0 &&
    characterLevel <= 1 &&
    build.normalAttackLevel === 1 &&
    build.elementalSkillLevel === 1 &&
    build.elementalBurstLevel === 1 &&
    !build.notes;

  if (configured === 'sem_build' || hasNoData) {
    effectiveStatus = 'sem_build';
    statusReason = hasNoData
      ? 'Sem planejamento ativo ou dados configurados'
      : 'Marcada manualmente como Sem Build';
  } else if (configured === 'completa') {
    if (canBeComplete) {
      effectiveStatus = 'completa';
      statusReason = 'Todas as metas atingidas e artefatos finalizados';
    } else {
      // REGRA DE CONSISTÊNCIA DE DOMÍNIO:
      // Não permite que a build seja marcada arbitrariamente como Completa
      // quando critérios objetivos obrigatórios ainda estão pendentes.
      if (progressPercent >= 65 && isWeaponAssociated && equippedArtifactsCount >= 4) {
        effectiveStatus = 'utilizavel';
        statusReason = `Critérios para Completa pendentes (${missingForComplete.join('; ')}). Status efetivo limitado a Utilizável.`;
      } else if (equippedArtifactsCount >= 3 && (characterLevelReady || weaponReady)) {
        effectiveStatus = 'precisa_melhorar';
        statusReason = `Critérios para Completa pendentes (${missingForComplete.join('; ')}). Status efetivo ajustado para Precisa Melhorar.`;
      } else {
        effectiveStatus = 'incompleta';
        statusReason = `Critérios objetivos não atingidos (${missingForComplete.join('; ')}). Status efetivo mantido como Incompleta.`;
      }
    }
  } else if (configured === 'precisa_melhorar') {
    effectiveStatus = 'precisa_melhorar';
    statusReason = 'Avaliação manual: artefatos ou atributos necessitam de ajuste fino';
  } else if (configured === 'utilizavel') {
    if (progressPercent >= 40 || equippedArtifactsCount >= 3 || (isWeaponAssociated && characterLevel >= 50)) {
      effectiveStatus = 'utilizavel';
      statusReason = 'Build em condições funcionais de uso';
    } else {
      effectiveStatus = 'incompleta';
      statusReason = 'Requisitos mínimos para combate ainda não atingidos. Mantida como Incompleta.';
    }
  } else {
    // configured === 'incompleta'
    effectiveStatus = 'incompleta';
    statusReason = 'Build em desenvolvimento';
  }

  return {
    weaponReady,
    characterLevelReady,
    talentsReady,
    artifactsReady,
    equippedArtifactsCount,
    maxedArtifactsCount,
    progressPercent,
    suggestedStatus,
    effectiveStatus,
    canBeComplete,
    missingForComplete,
    statusReason,
  };
}

export function matchesBuildFilters(
  item: CharacterBuildWithDetails,
  filters: BuildFilterOptions
): boolean {
  if (filters.search && filters.search.trim() !== '') {
    const term = filters.search.toLowerCase().trim();
    const charMatch = item.characterName.toLowerCase().includes(term);
    const idMatch = item.characterId.toLowerCase().includes(term);
    const weaponMatch = item.weaponName ? item.weaponName.toLowerCase().includes(term) : false;
    if (!charMatch && !idMatch && !weaponMatch) return false;
  }

  if (filters.status && filters.status !== 'all') {
    if (item.status !== filters.status) return false;
  }

  if (filters.farmStatus && filters.farmStatus !== 'all') {
    if (filters.farmStatus === 'active' && !item.farmEnabled) return false;
    if (filters.farmStatus === 'paused' && item.farmEnabled) return false;
  }

  if (filters.element && filters.element !== 'all') {
    if (item.characterElement !== filters.element) return false;
  }

  if (filters.weaponType && filters.weaponType !== 'all') {
    if (item.characterWeaponType !== filters.weaponType) return false;
  }

  if (filters.ownedOnly) {
    if (!item.isCharacterOwned) return false;
  }

  return true;
}
