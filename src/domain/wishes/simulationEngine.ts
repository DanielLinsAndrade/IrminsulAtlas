import type { WishGoal, WishGoalSimulation } from './goalTypes';
import type { PityState } from './types';
import { simulateCharacterGoal } from './capturingRadiance';

/**
 * Calcula a simulação de tiros necessários para atingir uma meta de banner.
 */
export function simulateGoalRequirements(
  goal: WishGoal,
  currentSavingsPulls: number,
  pityState: PityState,
  characterOptions: { capturingRadiancePoints: number; currentConstellation: number | null } = { capturingRadiancePoints: 0, currentConstellation: null },
): WishGoalSimulation {
  const isCharacter = goal.targetType === 'character';
  if (isCharacter) {
    const copiesNeeded = Math.max(0, goal.targetRank - (characterOptions.currentConstellation ?? -1));
    const simulation = simulateCharacterGoal({ copiesNeeded, currentPity: pityState.current5StarPity, guaranteed: pityState.is5StarGuaranteed, capturingRadiancePoints: characterOptions.capturingRadiancePoints });
    const balance = currentSavingsPulls - simulation.estimatedPulls;
    return { goal, currentSavingsPulls, pullsRequiredWorstCase: simulation.estimatedPulls, pullsRequiredExpected: simulation.estimatedPulls,
      surplusOrDeficitWorstCase: balance, surplusOrDeficitExpected: balance, isGuaranteed: pityState.is5StarGuaranteed,
      canGuaranteeWorstCase: balance >= 0, canGuaranteeExpected: balance >= 0 };
  }
  const hardPity = isCharacter ? 90 : 80;
  const expectedPityPer5Star = isCharacter ? 76 : 65;

  // Quantidade de cópias necessárias
  const copiesNeeded = isCharacter
    ? Math.max(1, goal.targetRank + 1)
    : Math.max(1, goal.targetRank);

  // Pity atual restante para o primeiro 5★
  const pullsToFirst5StarWorstCase = Math.max(0, hardPity - pityState.current5StarPity);
  const pullsToFirst5StarExpected = Math.max(0, expectedPityPer5Star - pityState.current5StarPity);

  // Cenário Pior Caso (Worst-Case): perde todos os 50/50 possíveis e atinge o hard pity em todos
  let pullsWorstCase = 0;
  let guaranteed = pityState.is5StarGuaranteed;

  for (let copy = 0; copy < copiesNeeded; copy++) {
    const to5Star = copy === 0 ? pullsToFirst5StarWorstCase : hardPity;
    if (guaranteed) {
      pullsWorstCase += to5Star;
      guaranteed = false;
    } else {
      // Perde 50/50 (vai para pity), depois pega garantido no hard pity seguinte
      pullsWorstCase += to5Star + hardPity;
      guaranteed = false;
    }
  }

  // Cenário Esperado (Expected-Case): taxa esperada com soft pity e média de 50/50
  // Média de ~1.5 tentativas por cópia destacada caso não garantido, ou 1 se garantido
  let pullsExpected = 0;
  let expGuaranteed = pityState.is5StarGuaranteed;

  for (let copy = 0; copy < copiesNeeded; copy++) {
    const to5Star = copy === 0 ? pullsToFirst5StarExpected : expectedPityPer5Star;
    if (expGuaranteed) {
      pullsExpected += to5Star;
      expGuaranteed = false;
    } else {
      // 55% de vitória média após atualização 5.0 (Mecanismo "Capturando Luz Celestial")
      const avgPullsForCopy = to5Star + Math.round(expectedPityPer5Star * 0.45);
      pullsExpected += avgPullsForCopy;
      expGuaranteed = false;
    }
  }

  const surplusOrDeficitWorstCase = currentSavingsPulls - pullsWorstCase;
  const surplusOrDeficitExpected = currentSavingsPulls - pullsExpected;

  return {
    goal,
    currentSavingsPulls,
    pullsRequiredWorstCase: pullsWorstCase,
    pullsRequiredExpected: pullsExpected,
    surplusOrDeficitWorstCase,
    surplusOrDeficitExpected,
    isGuaranteed: pityState.is5StarGuaranteed,
    canGuaranteeWorstCase: surplusOrDeficitWorstCase >= 0,
    canGuaranteeExpected: surplusOrDeficitExpected >= 0,
  };
}
