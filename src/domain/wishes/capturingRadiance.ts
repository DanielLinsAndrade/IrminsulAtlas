import { sortWishesChronologically } from './pityEngine';
import type { WishEntry } from './types';

export interface CaptureState { points: number; guaranteed: boolean }
export type CaptureOutcome = 'loss' | 'win' | 'guaranteed' | 'capture';

export function advanceCapture(state: CaptureState, outcome: CaptureOutcome): CaptureState {
  if (outcome === 'loss') return { points: Math.min(4, state.points + 1), guaranteed: true };
  if (outcome === 'guaranteed') return { points: state.points, guaranteed: false };
  return { points: 0, guaranteed: false };
}

/** Regra de planejamento do Irminsul Atlas definida pelo responsável; não taxa probabilística. */
export function simulateCharacterGoal({ copiesNeeded, currentPity, guaranteed, capturingRadiancePoints, assumedFiveStarPity = 80 }: {
  copiesNeeded: number; currentPity: number; guaranteed: boolean; capturingRadiancePoints: number; assumedFiveStarPity?: number;
}) {
  if (!Number.isInteger(copiesNeeded) || copiesNeeded < 0 || copiesNeeded > 7 || !Number.isInteger(capturingRadiancePoints) || capturingRadiancePoints < 0 || capturingRadiancePoints > 4 || !Number.isFinite(currentPity) || currentPity < 0 || !Number.isFinite(assumedFiveStarPity) || assumedFiveStarPity <= 0) throw new Error('Parâmetros de simulação inválidos.');
  let state = { points: capturingRadiancePoints, guaranteed };
  let copies = 0;
  const sequence: { outcome: CaptureOutcome; pulls: number; points: number; copies: number }[] = [];
  while (copies < copiesNeeded) {
    const outcome: CaptureOutcome = state.guaranteed ? 'guaranteed' : state.points === 4 ? 'capture' : 'loss';
    const pulls = sequence.length ? assumedFiveStarPity : Math.max(0, assumedFiveStarPity - currentPity);
    state = advanceCapture(state, outcome);
    if (outcome !== 'loss') copies++;
    sequence.push({ outcome, pulls, points: state.points, copies });
  }
  return { estimatedPulls: sequence.reduce((sum, event) => sum + event.pulls, 0), sequence, finalCapturePoints: state.points, finalGuaranteeState: state.guaranteed };
}

/** Um reset observado permite inferir o estado sem presumir completude do histórico. */
export function deriveCaptureState(wishes: WishEntry[]) {
  let state: CaptureState = { points: 0, guaranteed: false };
  let reliable = false;
  for (const wish of sortWishesChronologically(wishes.filter(w => w.bannerType === 'character' && w.rarity === 5))) {
    if (!wish.isFeatured) state = advanceCapture(state, 'loss');
    else if (state.guaranteed) state = advanceCapture(state, 'guaranteed');
    else if (state.points === 4) { state = advanceCapture(state, 'capture'); reliable = true; }
    else if (!wish.wonPityRate) state = advanceCapture(state, 'guaranteed');
    else { state = advanceCapture(state, state.points === 4 ? 'capture' : 'win'); reliable = true; }
  }
  return { ...state, reliable };
}
