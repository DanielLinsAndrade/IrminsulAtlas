/**
 * Motor determinístico de cálculo de evolução, resina e agregação de farm.
 * Conforme SPEC.md (Seção 16), ARCHITECTURE.md e Referência Genshin Center.
 */

import {
  CHARACTER_ASCENSION_PHASES,
  NATURAL_RESIN_PER_DAY,
  RESIN_YIELDS,
  TALENT_LEVEL_COSTS,
  getCharacterExpBetweenLevels,
  getCharacterLevelUpMora,
} from './tables';
import type {
  AggregatedEvolutionSummary,
  CharacterEvolutionCalculation,
  CharacterEvolutionPlanInput,
  MaterialCostItem,
  MaterialProgressItem,
} from './types';

/**
 * Mapeamento dos materiais específicos por personagem (Gemas, Boss, Especialidade, Livro de Talento, Boss Semanal, Drop Comum).
 */
export interface CharacterMaterialMapping {
  gemSliverId: string;
  gemFragmentId: string;
  gemChunkId: string;
  gemstoneId: string;
  gemName: string;
  bossDropId?: string;
  bossDropName?: string;
  localSpecialtyId?: string;
  localSpecialtyName?: string;
  commonT1Id: string;
  commonT2Id: string;
  commonT3Id: string;
  commonName: string;
  talentTeachingsId: string;
  talentGuideId: string;
  talentPhilosophiesId: string;
  talentBookName: string;
  domainDays?: string[];
  weeklyBossId?: string;
  weeklyBossName?: string;
}

export function calculateCharacterEvolutionRequirements(
  plan: CharacterEvolutionPlanInput,
  mapping: CharacterMaterialMapping,
  inventoryMap: Map<string, number>
): CharacterEvolutionCalculation {
  const { levelGoal, talentGoal, weaponGoal } = plan;

  // 1. Nível de Personagem e EXP
  const expNeeded = getCharacterExpBetweenLevels(levelGoal.currentLevel, levelGoal.targetLevel);
  const characterLevelUpMora = getCharacterLevelUpMora(expNeeded);
  const herosWitEquivalent = Math.ceil(expNeeded / 20000);

  // 2. Ascensões de Personagem
  let ascensionMora = 0;
  let slivers = 0;
  let fragments = 0;
  let chunks = 0;
  let gemstones = 0;
  let bossDrops = 0;
  let localSpecialties = 0;
  let charCommonT1 = 0;
  let charCommonT2 = 0;
  let charCommonT3 = 0;

  for (const phaseCost of CHARACTER_ASCENSION_PHASES) {
    if (phaseCost.phase > levelGoal.currentAscension && phaseCost.phase <= levelGoal.targetAscension) {
      ascensionMora += phaseCost.mora;
      slivers += phaseCost.sliver;
      fragments += phaseCost.fragment;
      chunks += phaseCost.chunk;
      gemstones += phaseCost.gemstone;
      bossDrops += phaseCost.bossDrop;
      localSpecialties += phaseCost.localSpecialty;
      charCommonT1 += phaseCost.commonT1;
      charCommonT2 += phaseCost.commonT2;
      charCommonT3 += phaseCost.commonT3;
    }
  }

  const characterAscensionMaterials: MaterialCostItem[] = [];

  if (slivers > 0) {
    characterAscensionMaterials.push({
      materialId: mapping.gemSliverId,
      gameKey: mapping.gemSliverId,
      namePtBr: `Lasca de ${mapping.gemName}`,
      category: 'character_ascension',
      rarity: 2,
      iconUrl: null,
      amount: slivers,
    });
  }
  if (fragments > 0) {
    characterAscensionMaterials.push({
      materialId: mapping.gemFragmentId,
      gameKey: mapping.gemFragmentId,
      namePtBr: `Fragmento de ${mapping.gemName}`,
      category: 'character_ascension',
      rarity: 3,
      iconUrl: null,
      amount: fragments,
    });
  }
  if (chunks > 0) {
    characterAscensionMaterials.push({
      materialId: mapping.gemChunkId,
      gameKey: mapping.gemChunkId,
      namePtBr: `Pedaço de ${mapping.gemName}`,
      category: 'character_ascension',
      rarity: 4,
      iconUrl: null,
      amount: chunks,
    });
  }
  if (gemstones > 0) {
    characterAscensionMaterials.push({
      materialId: mapping.gemstoneId,
      gameKey: mapping.gemstoneId,
      namePtBr: `Gema de ${mapping.gemName}`,
      category: 'character_ascension',
      rarity: 5,
      iconUrl: null,
      amount: gemstones,
    });
  }
  if (bossDrops > 0 && mapping.bossDropId) {
    characterAscensionMaterials.push({
      materialId: mapping.bossDropId,
      gameKey: mapping.bossDropId,
      namePtBr: mapping.bossDropName || 'Material de Chefe',
      category: 'boss',
      rarity: 4,
      iconUrl: null,
      amount: bossDrops,
    });
  }
  if (localSpecialties > 0 && mapping.localSpecialtyId) {
    characterAscensionMaterials.push({
      materialId: mapping.localSpecialtyId,
      gameKey: mapping.localSpecialtyId,
      namePtBr: mapping.localSpecialtyName || 'Especialidade Local',
      category: 'local_specialty',
      rarity: 1,
      iconUrl: null,
      amount: localSpecialties,
    });
  }

  // 3. Talentos (Ataque Normal, Habilidade Elemental, Supremo)
  let talentMora = 0;
  let teachings = 0;
  let guide = 0;
  let philosophies = 0;
  let talentCommonT1 = 0;
  let talentCommonT2 = 0;
  let talentCommonT3 = 0;
  let weeklyBoss = 0;
  let crowns = 0;

  const talentGoals = [
    { current: talentGoal.currentNormalAttack, target: talentGoal.targetNormalAttack },
    { current: talentGoal.currentElementalSkill, target: talentGoal.targetElementalSkill },
    { current: talentGoal.currentElementalBurst, target: talentGoal.targetElementalBurst },
  ];

  for (const t of talentGoals) {
    for (const cost of TALENT_LEVEL_COSTS) {
      if (cost.level > t.current && cost.level <= t.target) {
        talentMora += cost.mora;
        teachings += cost.teachings;
        guide += cost.guide;
        philosophies += cost.philosophies;
        talentCommonT1 += cost.commonT1;
        talentCommonT2 += cost.commonT2;
        talentCommonT3 += cost.commonT3;
        weeklyBoss += cost.weeklyBoss;
        crowns += cost.crown;
      }
    }
  }

  const talentMaterials: MaterialCostItem[] = [];

  if (teachings > 0) {
    talentMaterials.push({
      materialId: mapping.talentTeachingsId,
      gameKey: mapping.talentTeachingsId,
      namePtBr: `Ensinamentos da ${mapping.talentBookName}`,
      category: 'talent',
      rarity: 2,
      iconUrl: null,
      amount: teachings,
      domainDays: mapping.domainDays,
    });
  }
  if (guide > 0) {
    talentMaterials.push({
      materialId: mapping.talentGuideId,
      gameKey: mapping.talentGuideId,
      namePtBr: `Guia da ${mapping.talentBookName}`,
      category: 'talent',
      rarity: 3,
      iconUrl: null,
      amount: guide,
      domainDays: mapping.domainDays,
    });
  }
  if (philosophies > 0) {
    talentMaterials.push({
      materialId: mapping.talentPhilosophiesId,
      gameKey: mapping.talentPhilosophiesId,
      namePtBr: `Filosofia da ${mapping.talentBookName}`,
      category: 'talent',
      rarity: 4,
      iconUrl: null,
      amount: philosophies,
      domainDays: mapping.domainDays,
    });
  }
  if (weeklyBoss > 0 && mapping.weeklyBossId) {
    talentMaterials.push({
      materialId: mapping.weeklyBossId,
      gameKey: mapping.weeklyBossId,
      namePtBr: mapping.weeklyBossName || 'Material de Chefe Semanal',
      category: 'boss',
      rarity: 5,
      iconUrl: null,
      amount: weeklyBoss,
    });
  }
  if (crowns > 0) {
    talentMaterials.push({
      materialId: 'material_crown_of_insight',
      gameKey: 'CrownOfInsight',
      namePtBr: 'Coroa da Sabedoria',
      category: 'talent',
      rarity: 5,
      iconUrl: null,
      amount: crowns,
    });
  }

  // 4. Consolidação de drops comuns e Mora
  const totalCommonT1 = charCommonT1 + talentCommonT1;
  const totalCommonT2 = charCommonT2 + talentCommonT2;
  const totalCommonT3 = charCommonT3 + talentCommonT3;

  const commonMaterials: MaterialCostItem[] = [];
  if (totalCommonT1 > 0) {
    commonMaterials.push({
      materialId: mapping.commonT1Id,
      gameKey: mapping.commonT1Id,
      namePtBr: `${mapping.commonName} (1★)`,
      category: 'common',
      rarity: 1,
      iconUrl: null,
      amount: totalCommonT1,
    });
  }
  if (totalCommonT2 > 0) {
    commonMaterials.push({
      materialId: mapping.commonT2Id,
      gameKey: mapping.commonT2Id,
      namePtBr: `${mapping.commonName} (2★)`,
      category: 'common',
      rarity: 2,
      iconUrl: null,
      amount: totalCommonT2,
    });
  }
  if (totalCommonT3 > 0) {
    commonMaterials.push({
      materialId: mapping.commonT3Id,
      gameKey: mapping.commonT3Id,
      namePtBr: `${mapping.commonName} (3★)`,
      category: 'common',
      rarity: 3,
      iconUrl: null,
      amount: totalCommonT3,
    });
  }

  const totalMora = characterLevelUpMora + ascensionMora + talentMora;

  // 5. Agrupamento em lista unificada com Have / Need / Missing
  const aggregatedNeedMap = new Map<string, MaterialCostItem>();

  // Mora
  if (totalMora > 0) {
    aggregatedNeedMap.set('material_mora', {
      materialId: 'material_mora',
      gameKey: 'Mora',
      namePtBr: 'Mora',
      category: 'currency',
      rarity: 3,
      iconUrl: null,
      amount: totalMora,
    });
  }

  // Livros EXP
  if (herosWitEquivalent > 0) {
    aggregatedNeedMap.set('material_hero_wit', {
      materialId: 'material_hero_wit',
      gameKey: 'HerosWit',
      namePtBr: 'Sagacidade do Herói (~EXP)',
      category: 'other',
      rarity: 4,
      iconUrl: null,
      amount: herosWitEquivalent,
    });
  }

  for (const item of [...characterAscensionMaterials, ...talentMaterials, ...commonMaterials]) {
    const existing = aggregatedNeedMap.get(item.materialId);
    if (existing) {
      existing.amount += item.amount;
    } else {
      aggregatedNeedMap.set(item.materialId, { ...item });
    }
  }

  const progressMaterials: MaterialProgressItem[] = Array.from(aggregatedNeedMap.values()).map(
    (item) => {
      const have = inventoryMap.get(item.materialId) ?? 0;
      const need = item.amount;
      const missing = Math.max(need - have, 0);
      return {
        ...item,
        have,
        need,
        missing,
      };
    }
  );

  // 6. Cálculo de Resina Estimada e Dias Naturais (180 Resina / Dia)
  // Fórmula baseada no rendimento médio (WL 6+):
  let estimatedResin = 0;

  // Chefe de Mundo: ~2.55 drops por 40 resina
  if (bossDrops > 0) {
    estimatedResin += Math.ceil((bossDrops / RESIN_YIELDS.worldBoss.averageDrops) * RESIN_YIELDS.worldBoss.resinCost);
  }

  // Livros de talento: equivalência em Filosofias
  const equivalentPhilosophies = philosophies + guide / 3 + teachings / 9;
  if (equivalentPhilosophies > 0) {
    estimatedResin += Math.ceil(
      (equivalentPhilosophies / RESIN_YIELDS.talentDomain.equivalentPhilosophiesPerRun) *
        RESIN_YIELDS.talentDomain.resinCost
    );
  }

  // Boss Semanal: 30 resina por boss semanal necessário
  if (weeklyBoss > 0) {
    estimatedResin += Math.ceil((weeklyBoss / RESIN_YIELDS.weeklyBoss.averageDrops) * RESIN_YIELDS.weeklyBoss.resinCost);
  }

  // Tempo natural: 180 resinas por dia
  const estimatedDays = Number((estimatedResin / NATURAL_RESIN_PER_DAY).toFixed(2));

  return {
    characterId: plan.characterId,
    characterName: plan.characterName,
    element: plan.element,
    rarity: plan.rarity,
    iconUrl: plan.iconUrl,
    farmEnabled: plan.farmEnabled,
    levelGoal,
    talentGoal,
    weaponGoal: weaponGoal ?? null,
    characterAscensionMaterials,
    characterLevelUpCost: {
      mora: characterLevelUpMora,
      exp: expNeeded,
      herosWitEquivalent,
    },
    talentMaterials,
    talentMoraCost: talentMora,
    weaponMaterials: [],
    weaponLevelUpCost: { mora: 0, exp: 0, mysticOreEquivalent: 0 },
    materials: progressMaterials,
    estimatedResin,
    estimatedDays,
  };
}

/**
 * Consolida múltiplos planos de evolução ativos (farmEnabled === true)
 * somando as necessidades totais sem duplicar ou misturar o inventário do perfil.
 */
export function aggregateEvolutionPlans(
  calculations: CharacterEvolutionCalculation[],
  inventoryMap?: Map<string, number>
): AggregatedEvolutionSummary {
  const inv = inventoryMap ?? new Map<string, number>();
  const activePlans = calculations.filter((c) => c.farmEnabled);

  const combinedNeedMap = new Map<string, MaterialCostItem>();
  let totalEstimatedResin = 0;

  for (const plan of activePlans) {
    totalEstimatedResin += plan.estimatedResin;

    for (const mat of plan.materials) {
      const existing = combinedNeedMap.get(mat.materialId);
      if (existing) {
        existing.amount += mat.need;
      } else {
        combinedNeedMap.set(mat.materialId, {
          materialId: mat.materialId,
          gameKey: mat.gameKey,
          namePtBr: mat.namePtBr,
          category: mat.category,
          rarity: mat.rarity,
          iconUrl: mat.iconUrl,
          amount: mat.need,
          domainDays: mat.domainDays,
          domainName: mat.domainName,
        });
      }
    }
  }

  const aggregatedMaterials: MaterialProgressItem[] = Array.from(combinedNeedMap.values()).map(
    (item) => {
      const have = inv.get(item.materialId) ?? 0;
      const need = item.amount;
      const missing = Math.max(need - have, 0);
      return {
        ...item,
        have,
        need,
        missing,
      };
    }
  );

  // Ordenação: primeiro Faltantes (missing > 0), depois categoria, depois raridade desc
  aggregatedMaterials.sort((a, b) => {
    if ((a.missing > 0) !== (b.missing > 0)) {
      return a.missing > 0 ? -1 : 1;
    }
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return (b.rarity ?? 0) - (a.rarity ?? 0);
  });

  const totalEstimatedDays = Number((totalEstimatedResin / NATURAL_RESIN_PER_DAY).toFixed(2));

  return {
    totalCharactersCount: calculations.length,
    activeFarmCharactersCount: activePlans.length,
    totalEstimatedResin,
    totalEstimatedDays,
    materials: aggregatedMaterials,
  };
}

/**
 * Gera um mapeamento canônico de materiais de ascensão e talentos a partir do elemento do personagem.
 */
export function getDefaultCharacterMaterialMapping(element: string, characterName?: string): CharacterMaterialMapping {
  const el = (element || '').toLowerCase();

  if (el.includes('anemo')) {
    return {
      gemSliverId: 'material_gem_anemo_sliver',
      gemFragmentId: 'material_gem_anemo_fragment',
      gemChunkId: 'material_gem_anemo_chunk',
      gemstoneId: 'material_gem_anemo_gemstone',
      gemName: 'Turquesa Vayuda',
      bossDropId: 'material_boss_hurricane_seed',
      bossDropName: characterName ? `Material de Chefe (${characterName})` : 'Semente de Furacão',
      localSpecialtyId: 'material_specialty_dandelion_seed',
      localSpecialtyName: 'Semente de Dente-de-Leão',
      commonT1Id: 'material_common_mask_t1',
      commonT2Id: 'material_common_mask_t2',
      commonT3Id: 'material_common_mask_t3',
      commonName: 'Máscaras Danificada / Manchada / Ominosa',
      talentTeachingsId: 'material_talent_ballad_teachings',
      talentGuideId: 'material_talent_ballad_guide',
      talentPhilosophiesId: 'material_talent_ballad_philosophies',
      talentBookName: 'Ensinamentos da Poesia',
      domainDays: ['Quarta', 'Sábado', 'Domingo'],
      weeklyBossId: 'material_weekly_dvalin_claw',
      weeklyBossName: 'Garra do Vento Oriental (Dvalin)',
    };
  }

  if (el.includes('geo')) {
    return {
      gemSliverId: 'material_gem_geo_sliver',
      gemFragmentId: 'material_gem_geo_fragment',
      gemChunkId: 'material_gem_geo_chunk',
      gemstoneId: 'material_gem_geo_gemstone',
      gemName: 'Topázio Prithiva',
      bossDropId: 'material_boss_basalt_pillar',
      bossDropName: characterName ? `Material de Chefe (${characterName})` : 'Pilar de Basalto',
      localSpecialtyId: 'material_specialty_cor_lapis',
      localSpecialtyName: 'Cor Lapis',
      commonT1Id: 'material_common_insignia_hoarder_t1',
      commonT2Id: 'material_common_insignia_hoarder_t2',
      commonT3Id: 'material_common_insignia_hoarder_t3',
      commonName: 'Insígnia dos Ladrões de Tesouro',
      talentTeachingsId: 'material_talent_prosperity_teachings',
      talentGuideId: 'material_talent_prosperity_guide',
      talentPhilosophiesId: 'material_talent_prosperity_philosophies',
      talentBookName: 'Ensinamentos da Prosperidade',
      domainDays: ['Segunda', 'Quinta', 'Domingo'],
      weeklyBossId: 'material_weekly_tail_of_boreas',
      weeklyBossName: 'Cauda de Boreas',
    };
  }

  if (el.includes('electro')) {
    return {
      gemSliverId: 'material_gem_electro_sliver',
      gemFragmentId: 'material_gem_electro_fragment',
      gemChunkId: 'material_gem_electro_chunk',
      gemstoneId: 'material_gem_electro_gemstone',
      gemName: 'Ametista Vajrada',
      bossDropId: 'material_boss_lightning_prism',
      bossDropName: characterName ? `Material de Chefe (${characterName})` : 'Prisma do Relâmpago',
      localSpecialtyId: 'material_specialty_sakura_bloom',
      localSpecialtyName: 'Pétala de Sakura',
      commonT1Id: 'material_common_handguard_t1',
      commonT2Id: 'material_common_handguard_t2',
      commonT3Id: 'material_common_handguard_t3',
      commonName: 'Protetor de Mão Antigo / Kageuchi / Famoso',
      talentTeachingsId: 'material_talent_transience_teachings',
      talentGuideId: 'material_talent_transience_guide',
      talentPhilosophiesId: 'material_talent_transience_philosophies',
      talentBookName: 'Ensinamentos da Transitoriedade',
      domainDays: ['Segunda', 'Quinta', 'Domingo'],
      weeklyBossId: 'material_weekly_mudra_of_the_malefic_general',
      weeklyBossName: 'Mudra da Shogun Malévola',
    };
  }

  if (el.includes('dendro')) {
    return {
      gemSliverId: 'material_gem_dendro_sliver',
      gemFragmentId: 'material_gem_dendro_fragment',
      gemChunkId: 'material_gem_dendro_chunk',
      gemstoneId: 'material_gem_dendro_gemstone',
      gemName: 'Esmeralda Nagadus',
      bossDropId: 'material_boss_quelled_creeper',
      bossDropName: characterName ? `Material de Chefe (${characterName})` : 'Trepadeira Contida',
      localSpecialtyId: 'material_specialty_kalpalata_lotus',
      localSpecialtyName: 'Lótus Kalpalata',
      commonT1Id: 'material_common_fungal_spores_t1',
      commonT2Id: 'material_common_fungal_spores_t2',
      commonT3Id: 'material_common_fungal_spores_t3',
      commonName: 'Esporo de Cogumelo Fluorescente',
      talentTeachingsId: 'material_talent_ingenuity_teachings',
      talentGuideId: 'material_talent_ingenuity_guide',
      talentPhilosophiesId: 'material_talent_ingenuity_philosophies',
      talentBookName: 'Ensinamentos da Engenhosidade',
      domainDays: ['Terça', 'Sexta', 'Domingo'],
      weeklyBossId: 'material_weekly_mirror_of_mushin',
      weeklyBossName: 'Espelho de Mushin',
    };
  }

  if (el.includes('hydro')) {
    return {
      gemSliverId: 'material_gem_hydro_sliver',
      gemFragmentId: 'material_gem_hydro_fragment',
      gemChunkId: 'material_gem_hydro_chunk',
      gemstoneId: 'material_gem_hydro_gemstone',
      gemName: 'Lazurita Varunada',
      bossDropId: 'material_boss_cleansing_heart',
      bossDropName: characterName ? `Material de Chefe (${characterName})` : 'Coração Purificador',
      localSpecialtyId: 'material_specialty_silk_flower',
      localSpecialtyName: 'Flor de Seda',
      commonT1Id: 'material_common_transoceanic_t1',
      commonT2Id: 'material_common_transoceanic_t2',
      commonT3Id: 'material_common_transoceanic_t3',
      commonName: 'Pérola Transoceânica',
      talentTeachingsId: 'material_talent_equity_teachings',
      talentGuideId: 'material_talent_equity_guide',
      talentPhilosophiesId: 'material_talent_equity_philosophies',
      talentBookName: 'Ensinamentos da Equidade',
      domainDays: ['Segunda', 'Quinta', 'Domingo'],
      weeklyBossId: 'material_weekly_lightless_mass',
      weeklyBossName: 'Massa Sem Luz',
    };
  }

  if (el.includes('cryo')) {
    return {
      gemSliverId: 'material_gem_cryo_sliver',
      gemFragmentId: 'material_gem_cryo_fragment',
      gemChunkId: 'material_gem_cryo_chunk',
      gemstoneId: 'material_gem_cryo_gemstone',
      gemName: 'Jade Shivada',
      bossDropId: 'material_boss_hoarfrost_core',
      bossDropName: characterName ? `Material de Chefe (${characterName})` : 'Núcleo de Geada',
      localSpecialtyId: 'material_specialty_small_lamp_grass',
      localSpecialtyName: 'Lâmpada de Grama',
      commonT1Id: 'material_common_arrowhead_t1',
      commonT2Id: 'material_common_arrowhead_t2',
      commonT3Id: 'material_common_arrowhead_t3',
      commonName: 'Ponta de Flecha Firme / Afiada / Manchada',
      talentTeachingsId: 'material_talent_resistance_teachings',
      talentGuideId: 'material_talent_resistance_guide',
      talentPhilosophiesId: 'material_talent_resistance_philosophies',
      talentBookName: 'Ensinamentos da Resistência',
      domainDays: ['Terça', 'Sexta', 'Domingo'],
      weeklyBossId: 'material_weekly_ring_of_boreas',
      weeklyBossName: 'Anel de Boreas',
    };
  }

  // Pyro (Padrão)
  return {
    gemSliverId: 'material_gem_pyro_sliver',
    gemFragmentId: 'material_gem_pyro_fragment',
    gemChunkId: 'material_gem_pyro_chunk',
    gemstoneId: 'material_gem_pyro_gemstone',
    gemName: 'Ágata Agnidus',
    bossDropId: 'material_boss_everflame_seed',
    bossDropName: characterName ? `Material de Chefe (${characterName})` : 'Semente de Fogo Eterno',
    localSpecialtyId: 'material_specialty_jueyun_chili',
    localSpecialtyName: 'Pimenta de Jueyun',
    commonT1Id: 'material_common_slime_t1',
    commonT2Id: 'material_common_slime_t2',
    commonT3Id: 'material_common_slime_t3',
    commonName: 'Condensado / Secreção / Essência de Slime',
    talentTeachingsId: 'material_talent_freedom_teachings',
    talentGuideId: 'material_talent_freedom_guide',
    talentPhilosophiesId: 'material_talent_freedom_philosophies',
    talentBookName: 'Ensinamentos da Liberdade',
    domainDays: ['Segunda', 'Quinta', 'Domingo'],
    weeklyBossId: 'material_weekly_dvalin_plume',
    weeklyBossName: 'Pluma do Vento Oriental (Dvalin)',
  };
}

/**
 * Função utilitária unificada para calcular os custos e progresso de evolução de um personagem,
 * utilizando o mapeamento canônico de materiais caso um mapping customizado não seja fornecido.
 */
export function calculateCharacterEvolution(
  plan: CharacterEvolutionPlanInput,
  inventoryMap?: Map<string, number>,
  customMapping?: CharacterMaterialMapping
): CharacterEvolutionCalculation {
  const mapping = customMapping ?? getDefaultCharacterMaterialMapping(plan.element, plan.characterName);
  const inv = inventoryMap ?? new Map<string, number>();
  return calculateCharacterEvolutionRequirements(plan, mapping, inv);
}

/**
 * Alias normativo para agregação de múltiplos cálculos de evolução.
 */
export const aggregateEvolutionCalculations = aggregateEvolutionPlans;

