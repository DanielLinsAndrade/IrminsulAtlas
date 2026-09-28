/**
 * Tabelas normativas e constantes oficiais de evolução e custos (Genshin Impact).
 * Conforme SPEC.md (Seções 14 e 16), ARCHITECTURE.md e Referência Genshin Center.
 */

// 180 Resinas Originais por 24 horas (1 a cada 8 minutos)
export const NATURAL_RESIN_PER_DAY = 180;

/**
 * Tabela de EXP acumulada por nível de personagem (1 a 90).
 * Índice corresponde ao nível (0 não utilizado, 1 = 0 EXP, 90 = 8.362.650 EXP).
 */
export const CHARACTER_CUMULATIVE_EXP: number[] = [
  0,
  0, 1000, 2325, 4025, 6150, 8725, 11775, 15325, 19400, 24050, // 1-10
  29275, 35125, 41600, 48750, 56575, 65125, 74400, 84425, 95225, 106825, // 11-20
  120175, 134425, 149600, 165725, 182825, 200950, 220125, 240375, 261725, 284225, // 21-30
  307900, 332800, 358950, 386400, 415175, 445325, 476900, 509925, 544450, 580525, // 31-40
  618200, 657525, 698525, 741250, 785750, 832050, 880200, 930250, 982250, 1036275, // 41-50
  1092350, 1150525, 1210850, 1273350, 1338100, 1405125, 1474500, 1546250, 1620450, 1697150, // 51-60
  1776400, 1858250, 1942750, 2030000, 2120050, 2212975, 2308850, 2407725, 2509650, 2614725, // 61-70
  2723000, 2834550, 2949425, 3067700, 3189425, 3314675, 3443525, 3576025, 3712250, 3852300, // 71-80
  3996225, 4144125, 4296075, 4452150, 4612425, 4776975, 4945875, 5119200, 5297025, 8362650  // 81-90
];

/**
 * Retorna o EXP necessário para evoluir do nível inicial ao nível alvo.
 */
export function getCharacterExpBetweenLevels(fromLevel: number, toLevel: number): number {
  const from = Math.max(1, Math.min(90, fromLevel));
  const to = Math.max(from, Math.min(90, toLevel));
  return CHARACTER_CUMULATIVE_EXP[to] - CHARACTER_CUMULATIVE_EXP[from];
}

/**
 * Custo de Mora para subir nível usando livros de EXP (1 Mora por 5 EXP).
 */
export function getCharacterLevelUpMora(exp: number): number {
  return Math.round(exp * 0.2);
}

export interface CharacterAscensionCost {
  phase: number;
  minLevel: number;
  mora: number;
  sliver: number; // 2★
  fragment: number; // 3★
  chunk: number; // 4★
  gemstone: number; // 5★
  bossDrop: number;
  localSpecialty: number;
  commonT1: number; // 1★
  commonT2: number; // 2★
  commonT3: number; // 3★
}

export const CHARACTER_ASCENSION_PHASES: CharacterAscensionCost[] = [
  { phase: 1, minLevel: 20, mora: 20000, sliver: 1, fragment: 0, chunk: 0, gemstone: 0, bossDrop: 0, localSpecialty: 3, commonT1: 3, commonT2: 0, commonT3: 0 },
  { phase: 2, minLevel: 40, mora: 40000, sliver: 0, fragment: 3, chunk: 0, gemstone: 0, bossDrop: 2, localSpecialty: 10, commonT1: 15, commonT2: 0, commonT3: 0 },
  { phase: 3, minLevel: 50, mora: 60000, sliver: 0, fragment: 6, chunk: 0, gemstone: 0, bossDrop: 4, localSpecialty: 20, commonT1: 0, commonT2: 12, commonT3: 0 },
  { phase: 4, minLevel: 60, mora: 80000, sliver: 0, fragment: 0, chunk: 3, gemstone: 0, bossDrop: 8, localSpecialty: 30, commonT1: 0, commonT2: 18, commonT3: 0 },
  { phase: 5, minLevel: 70, mora: 100000, sliver: 0, fragment: 0, chunk: 6, gemstone: 0, bossDrop: 12, localSpecialty: 45, commonT1: 0, commonT2: 0, commonT3: 12 },
  { phase: 6, minLevel: 80, mora: 120000, sliver: 0, fragment: 0, chunk: 0, gemstone: 6, bossDrop: 20, localSpecialty: 60, commonT1: 0, commonT2: 0, commonT3: 24 },
];

export interface TalentLevelCost {
  level: number; // Alvo
  mora: number;
  teachings: number; // 2★
  guide: number; // 3★
  philosophies: number; // 4★
  commonT1: number;
  commonT2: number;
  commonT3: number;
  weeklyBoss: number;
  crown: number;
}

export const TALENT_LEVEL_COSTS: TalentLevelCost[] = [
  { level: 2, mora: 12500, teachings: 3, guide: 0, philosophies: 0, commonT1: 6, commonT2: 0, commonT3: 0, weeklyBoss: 0, crown: 0 },
  { level: 3, mora: 17500, teachings: 0, guide: 2, philosophies: 0, commonT1: 0, commonT2: 3, commonT3: 0, weeklyBoss: 0, crown: 0 },
  { level: 4, mora: 25000, teachings: 0, guide: 4, philosophies: 0, commonT1: 0, commonT2: 4, commonT3: 0, weeklyBoss: 0, crown: 0 },
  { level: 5, mora: 30000, teachings: 0, guide: 6, philosophies: 0, commonT1: 0, commonT2: 6, commonT3: 0, weeklyBoss: 0, crown: 0 },
  { level: 6, mora: 37500, teachings: 0, guide: 9, philosophies: 0, commonT1: 0, commonT2: 9, commonT3: 0, weeklyBoss: 0, crown: 0 },
  { level: 7, mora: 120000, teachings: 0, guide: 0, philosophies: 4, commonT1: 0, commonT2: 0, commonT3: 4, weeklyBoss: 1, crown: 0 },
  { level: 8, mora: 260000, teachings: 0, guide: 0, philosophies: 6, commonT1: 0, commonT2: 0, commonT3: 6, weeklyBoss: 1, crown: 0 },
  { level: 9, mora: 450000, teachings: 0, guide: 0, philosophies: 12, commonT1: 0, commonT2: 0, commonT3: 9, weeklyBoss: 2, crown: 0 },
  { level: 10, mora: 700000, teachings: 0, guide: 0, philosophies: 16, commonT1: 0, commonT2: 0, commonT3: 12, weeklyBoss: 2, crown: 1 },
];

export interface WeaponAscensionCost {
  phase: number;
  mora: number;
  domainT1: number;
  domainT2: number;
  domainT3: number;
  domainT4: number;
  eliteT1: number;
  eliteT2: number;
  eliteT3: number;
  commonT1: number;
  commonT2: number;
  commonT3: number;
}

export const WEAPON_5STAR_ASCENSION_PHASES: WeaponAscensionCost[] = [
  { phase: 1, mora: 10000, domainT1: 5, domainT2: 0, domainT3: 0, domainT4: 0, eliteT1: 5, eliteT2: 0, eliteT3: 0, commonT1: 3, commonT2: 0, commonT3: 0 },
  { phase: 2, mora: 20000, domainT1: 0, domainT2: 5, domainT3: 0, domainT4: 0, eliteT1: 18, eliteT2: 0, eliteT3: 0, commonT1: 12, commonT2: 0, commonT3: 0 },
  { phase: 3, mora: 30000, domainT1: 0, domainT2: 9, domainT3: 0, domainT4: 0, eliteT1: 0, eliteT2: 9, eliteT3: 0, commonT1: 0, commonT2: 9, commonT3: 0 },
  { phase: 4, mora: 45000, domainT1: 0, domainT2: 0, domainT3: 5, domainT4: 0, eliteT1: 0, eliteT2: 18, eliteT3: 0, commonT1: 0, commonT2: 14, commonT3: 0 },
  { phase: 5, mora: 55000, domainT1: 0, domainT2: 0, domainT3: 9, domainT4: 0, eliteT1: 0, eliteT2: 0, eliteT3: 14, commonT1: 0, commonT2: 0, commonT3: 9 },
  { phase: 6, mora: 65000, domainT1: 0, domainT2: 0, domainT3: 0, domainT4: 6, eliteT1: 0, eliteT2: 0, eliteT3: 27, commonT1: 0, commonT2: 0, commonT3: 18 },
];

export const WEAPON_4STAR_ASCENSION_PHASES: WeaponAscensionCost[] = [
  { phase: 1, mora: 5000, domainT1: 3, domainT2: 0, domainT3: 0, domainT4: 0, eliteT1: 3, eliteT2: 0, eliteT3: 0, commonT1: 2, commonT2: 0, commonT3: 0 },
  { phase: 2, mora: 15000, domainT1: 0, domainT2: 3, domainT3: 0, domainT4: 0, eliteT1: 12, eliteT2: 0, eliteT3: 0, commonT1: 8, commonT2: 0, commonT3: 0 },
  { phase: 3, mora: 20000, domainT1: 0, domainT2: 6, domainT3: 0, domainT4: 0, eliteT1: 0, eliteT2: 6, eliteT3: 0, commonT1: 0, commonT2: 6, commonT3: 0 },
  { phase: 4, mora: 30000, domainT1: 0, domainT2: 0, domainT3: 3, domainT4: 0, eliteT1: 0, eliteT2: 12, eliteT3: 0, commonT1: 0, commonT2: 9, commonT3: 0 },
  { phase: 5, mora: 35000, domainT1: 0, domainT2: 0, domainT3: 6, domainT4: 0, eliteT1: 0, eliteT2: 0, eliteT3: 9, commonT1: 0, commonT2: 0, commonT3: 6 },
  { phase: 6, mora: 45000, domainT1: 0, domainT2: 0, domainT3: 0, domainT4: 4, eliteT1: 0, eliteT2: 0, eliteT3: 18, commonT1: 0, commonT2: 0, commonT3: 12 },
];

/**
 * Rendimentos Médios Oficiais de Resina (WL 6+ / AR 45+):
 */
export const RESIN_YIELDS = {
  worldBoss: {
    resinCost: 40,
    averageDrops: 2.55, // drops por 40 resina
  },
  weeklyBoss: {
    resinCost: 30, // primeiras 3 corridas
    averageDrops: 2.4,
  },
  talentDomain: {
    resinCost: 20,
    // Equivalente em Filosofias (4★) por 20 resina com síntese de alquimia:
    equivalentPhilosophiesPerRun: 0.65,
  },
  weaponDomain: {
    resinCost: 20,
    // Equivalente em material 4★ por 20 resina com síntese de alquimia:
    equivalentTier4PerRun: 0.88,
  },
  moraLeyLine: {
    resinCost: 20,
    moraPerRun: 60000,
  },
  expLeyLine: {
    resinCost: 20,
    expPerRun: 122500, // ~4-5 Hero's Wit + ~6-7 Adventurer's
  },
};
