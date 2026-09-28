import type { Element, WeaponType } from '../catalog';

export type BuildStatus =
  | 'sem_build'
  | 'incompleta'
  | 'utilizavel'
  | 'precisa_melhorar'
  | 'completa';

export type ArtifactSlotKey = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';

export interface ArtifactSlot {
  substats?: import('./substats').ArtifactSubstat[];
  substatValues?: import('./substats').ArtifactSubstatValues;
  id: string;
  buildId: string;
  slotKey: ArtifactSlotKey;
  setId: string | null;
  mainStat: string | null;
  level: number;
  targetLevel: number;
  isEquipped: boolean;
  rarity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterBuild {
  id: string;
  profileId: string;
  characterId: string;
  status: BuildStatus;
  farmEnabled: boolean;
  farmPriority: number;
  farmStatus: 'active' | 'paused' | 'completed';
  accountWeaponId: string | null;
  plannedWeaponId?: string | null;
  weaponTargetLevel: number;
  weaponTargetAscension: number;
  characterTargetLevel: number;
  characterTargetAscension: number;
  normalAttackLevel: number;
  normalAttackTarget: number;
  elementalSkillLevel: number;
  elementalSkillTarget: number;
  elementalBurstLevel: number;
  elementalBurstTarget: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  artifactSlots: Record<ArtifactSlotKey, ArtifactSlot>;
}

export interface BuildProgressIndicators {
  weaponReady: boolean;
  characterLevelReady: boolean;
  talentsReady: boolean;
  artifactsReady: boolean;
  equippedArtifactsCount: number;
  maxedArtifactsCount: number;
  progressPercent: number;
  suggestedStatus: BuildStatus;
  effectiveStatus: BuildStatus;
  canBeComplete: boolean;
  missingForComplete: string[];
  statusReason: string;
}

export interface CharacterBuildWithDetails extends CharacterBuild {
  characterName: string;
  characterElement: Element;
  characterRarity: number;
  characterWeaponType: WeaponType;
  characterIconUrl: string | null;
  characterLevel: number;
  characterAscension: number;
  characterConstellation: number;
  isCharacterOwned: boolean;
  weaponId: string | null;
  weaponName: string | null;
  plannedWeaponName?: string | null;
  weaponRarity: number | null;
  weaponLevel: number | null;
  weaponRefinement: number | null;
  weaponIconUrl: string | null;
  indicators: BuildProgressIndicators;
  configuredStatus: BuildStatus;
  statusReason: string;
  canBeComplete: boolean;
  missingForComplete: string[];
}

export interface UpdateCharacterBuildInput {
  status?: BuildStatus;
  farmEnabled?: boolean;
  farmPriority?: number;
  farmStatus?: 'active' | 'paused' | 'completed';
  accountWeaponId?: string | null;
  plannedWeaponId?: string | null;
  weaponTargetLevel?: number;
  weaponTargetAscension?: number;
  characterTargetLevel?: number;
  characterTargetAscension?: number;
  normalAttackLevel?: number;
  normalAttackTarget?: number;
  elementalSkillLevel?: number;
  elementalSkillTarget?: number;
  elementalBurstLevel?: number;
  elementalBurstTarget?: number;
  notes?: string | null;
}

export interface UpdateArtifactSlotInput {
  substats?: import('./substats').ArtifactSubstat[];
  substatValues?: import('./substats').ArtifactSubstatValues;
  setId?: string | null;
  mainStat?: string | null;
  level?: number;
  targetLevel?: number;
  isEquipped?: boolean;
  rarity?: number;
  notes?: string | null;
}

export interface BuildFilterOptions {
  search?: string;
  status?: BuildStatus | 'all';
  farmStatus?: 'all' | 'active' | 'paused';
  element?: Element | 'all';
  weaponType?: WeaponType | 'all';
  ownedOnly?: boolean;
}
