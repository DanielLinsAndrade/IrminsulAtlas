/**
 * Tipos e interfaces do motor de planejamento de evolução (Genshin Center Reference).
 * Conforme SPEC.md (Seção 16), ARCHITECTURE.md (Seção 2 e 5).
 */

import type { Element, MaterialCategory, Rarity, WeaponType } from '../catalog';

export interface EvolutionLevelGoal {
  currentLevel: number;
  targetLevel: number;
  currentAscension: number;
  targetAscension: number;
}

export interface EvolutionTalentGoal {
  currentNormalAttack: number;
  targetNormalAttack: number;
  currentElementalSkill: number;
  targetElementalSkill: number;
  currentElementalBurst: number;
  targetElementalBurst: number;
}

export interface EvolutionWeaponGoal {
  weaponId: string;
  weaponName: string;
  rarity: Rarity;
  weaponType: WeaponType;
  iconUrl: string | null;
  currentLevel: number;
  targetLevel: number;
  currentAscension: number;
  targetAscension: number;
}

export interface CharacterEvolutionPlanInput {
  characterId: string;
  characterName: string;
  element: Element;
  rarity: 4 | 5;
  iconUrl: string | null;
  farmEnabled: boolean;
  levelGoal: EvolutionLevelGoal;
  talentGoal: EvolutionTalentGoal;
  weaponGoal?: EvolutionWeaponGoal | null;
}

export interface MaterialCostItem {
  materialId: string;
  gameKey: string;
  namePtBr: string;
  category: MaterialCategory;
  rarity: Rarity | null;
  iconUrl: string | null;
  amount: number;
  domainDays?: string[] | null;
  domainName?: string | null;
}

export interface MaterialProgressItem extends MaterialCostItem {
  have: number;
  need: number;
  missing: number;
}

export interface CharacterEvolutionCalculation {
  characterId: string;
  characterName: string;
  element: Element;
  rarity: 4 | 5;
  iconUrl: string | null;
  farmEnabled: boolean;
  levelGoal: EvolutionLevelGoal;
  talentGoal: EvolutionTalentGoal;
  weaponGoal?: EvolutionWeaponGoal | null;
  // Detalhamento de custos
  characterAscensionMaterials: MaterialCostItem[];
  characterLevelUpCost: { mora: number; exp: number; herosWitEquivalent: number };
  talentMaterials: MaterialCostItem[];
  talentMoraCost: number;
  weaponMaterials: MaterialCostItem[];
  weaponLevelUpCost: { mora: number; exp: number; mysticOreEquivalent: number };
  // Lista unificada com Tenho / Preciso / Falta
  materials: MaterialProgressItem[];
  // Estimativa de Resina e Tempo
  estimatedResin: number;
  estimatedDays: number; // estimatedResin / 180
}

export interface AggregatedEvolutionSummary {
  totalCharactersCount: number;
  activeFarmCharactersCount: number;
  totalEstimatedResin: number;
  totalEstimatedDays: number; // totalEstimatedResin / 180
  materials: MaterialProgressItem[];
}
