import { useCharacterChanges } from '../../../hooks/useCharacterChanges';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type {
  CreateWishGoalInput,
  GoalStatus,
  UpdateWishGoalInput,
  WishGoal,
  WishGoalSimulation,
} from '../../../domain/wishes/goalTypes';
import { calculatePityProgression } from '../../../domain/wishes/pityEngine';
import { simulateGoalRequirements } from '../../../domain/wishes/simulationEngine';
import { deriveCaptureState } from '../../../domain/wishes/capturingRadiance';
import { appSettingsRepository } from '../../../infrastructure/db/appSettingsRepository';
import { charactersRepository } from '../../../infrastructure/db/charactersRepository';
import { defaultGameDataProvider } from '../../../infrastructure/providers';
import type { BannerCurrentPity, BannerType, PityState, WishEntry } from '../../../domain/wishes/types';
import type { ProfileResources, WishEquivalences } from '../../../domain/inventory';
import { calculateWishEquivalences, createDefaultResources } from '../../../domain/inventory';
import {
  inventoryRepository,
  wishGoalsRepository,
  wishesRepository,
} from '../../../infrastructure/db';

export function useWishPlanner() {
  const { activeProfile } = useShell();
  const profileId = activeProfile?.id ?? null;

  const [goals, setGoals] = useState<WishGoal[]>([]);
  const [wishes, setWishes] = useState<WishEntry[]>([]);
  const [currentBannerPity, setCurrentBannerPity] = useState<Record<BannerType, BannerCurrentPity> | null>(null);
  const [resources, setResources] = useState<ProfileResources | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  useCharacterChanges(profileId, setReloadKey);
  const [captureOverride, setCaptureOverride] = useState<number | null>(null);
  const [constellations, setConstellations] = useState<Record<string, number>>({});
  const captureDerived = useMemo(() => deriveCaptureState(wishes), [wishes]);
  const capturePoints = captureOverride ?? captureDerived.points;

  // Carrega metas, tiros e recursos do perfil ativo
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!profileId) {
        if (isMounted) {
          setGoals([]);
          setWishes([]);
          setResources(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const [loadedGoals, loadedWishes, loadedResources, loadedCurrentPity, savedCapture, owned] = await Promise.all([
          wishGoalsRepository.getGoalsByProfile(profileId),
          wishesRepository.getWishesByProfile(profileId),
          inventoryRepository.getResources(profileId),
          wishesRepository.getBannerCurrentPity(profileId),
          appSettingsRepository.getSetting(`capturing_radiance:${profileId}`),
          charactersRepository.getAccountCharacters(profileId),
        ]);
        const ranks: Record<string, number> = {};
        for (const character of owned.filter(item => item.owned)) {
          const canonical = await defaultGameDataProvider.getCharacter(character.characterId);
          ranks[character.characterId] = character.constellation;
          if (canonical) { ranks[canonical.id] = character.constellation; ranks[canonical.gameKey] = character.constellation; }
        }
        const override = savedCapture === null ? null : Number(savedCapture);
        if (override !== null && (!Number.isInteger(override) || override < 0 || override > 4)) throw new Error('Ajuste de Captura de Esplendor inválido.');

        if (isMounted) {
          setGoals(loadedGoals);
          setWishes(loadedWishes);
          setResources(loadedResources);
          setCurrentBannerPity(loadedCurrentPity);
          setCaptureOverride(override);
          setConstellations(ranks);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar planejador de metas.';
          setError(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profileId, reloadKey]);

  // Equivalências de tiros disponíveis
  const equivalences = useMemo<WishEquivalences>(() => {
    if (!resources) {
      return calculateWishEquivalences(createDefaultResources(profileId ?? ''));
    }
    return calculateWishEquivalences(resources);
  }, [resources, profileId]);

  const totalSavingsPulls = equivalences.totalPromotionalPulls;

  // Estados de pity para personagens e armas (com pity atual independente da conta integrado)
  const characterPity = useMemo<PityState>(() => {
    const base = calculatePityProgression(wishes, 'character');
    if (currentBannerPity?.character) {
      return {
        ...base,
        current5StarPity: currentBannerPity.character.current5StarPity,
        current4StarPity: currentBannerPity.character.current4StarPity,
      };
    }
    return base;
  }, [wishes, currentBannerPity]);

  const weaponPity = useMemo<PityState>(() => {
    const base = calculatePityProgression(wishes, 'weapon');
    if (currentBannerPity?.weapon) {
      return {
        ...base,
        current5StarPity: currentBannerPity.weapon.current5StarPity,
        current4StarPity: currentBannerPity.weapon.current4StarPity,
      };
    }
    return base;
  }, [wishes, currentBannerPity]);

  // Simulações para cada meta
  const simulations = useMemo<WishGoalSimulation[]>(() => {
    return goals.map((goal) => {
      const pity = goal.targetType === 'weapon' ? weaponPity : characterPity;
      return simulateGoalRequirements(goal, totalSavingsPulls, pity, goal.targetType === 'character' ? { capturingRadiancePoints: capturePoints, currentConstellation: constellations[goal.targetId] ?? null } : undefined);
    });
  }, [goals, totalSavingsPulls, characterPity, weaponPity, capturePoints, constellations]);

  // Métricas agregadas
  const aggregated = useMemo(() => {
    const activeSims = simulations.filter(
      (s) => s.goal.status !== 'completed' && s.goal.status !== 'canceled'
    );

    const totalWorstCasePullsNeeded = activeSims.reduce(
      (acc, curr) => acc + curr.pullsRequiredWorstCase,
      0
    );
    const totalExpectedPullsNeeded = activeSims.reduce(
      (acc, curr) => acc + curr.pullsRequiredExpected,
      0
    );

    const overallWorstCaseBalance = totalSavingsPulls - totalWorstCasePullsNeeded;
    const overallExpectedBalance = totalSavingsPulls - totalExpectedPullsNeeded;

    return {
      totalGoalsCount: goals.length,
      activeGoalsCount: activeSims.length,
      completedGoalsCount: goals.filter((g) => g.status === 'completed').length,
      totalWorstCasePullsNeeded,
      totalExpectedPullsNeeded,
      overallWorstCaseBalance,
      overallExpectedBalance,
      isFullyGuaranteed: overallWorstCaseBalance >= 0,
    };
  }, [simulations, goals, totalSavingsPulls]);

  // Ações de persistência
  const createGoal = useCallback(
    async (input: CreateWishGoalInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setError(null);
      try {
        const created = await wishGoalsRepository.createGoal(profileId, input);
        setReloadKey((k) => k + 1);
        return created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao criar meta.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  const updateGoal = useCallback(
    async (id: string, input: UpdateWishGoalInput) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await wishGoalsRepository.updateGoal(id, input);
        setReloadKey((k) => k + 1);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar meta.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      setIsSaving(true);
      setError(null);
      try {
        await wishGoalsRepository.deleteGoal(id);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao excluir meta.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const markCompleted = useCallback(
    async (id: string) => {
      setIsSaving(true);
      setError(null);
      try {
        await wishGoalsRepository.markGoalCompleted(id);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao marcar meta como obtida.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const toggleStatus = useCallback(
    async (id: string, currentStatus: GoalStatus) => {
      const nextStatus: GoalStatus = currentStatus === 'planning' ? 'reserved' : 'planning';
      await updateGoal(id, { status: nextStatus });
    },
    [updateGoal]
  );

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const reorderGoals = useCallback(async (ids: string[]) => {
    if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
    setIsSaving(true);
    setError(null);
    try {
      await wishGoalsRepository.reorderGoals(profileId, ids);
      setReloadKey(key => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reordenar metas.');
    } finally {
      setIsSaving(false);
    }
  }, [profileId]);

  return {
    capturePoints,
    captureOverride,
    captureReliable: captureDerived.reliable,
    saveCaptureOverride: async (points: number | null) => {
      if (!profileId) return;
      setIsSaving(true); setError(null);
      try {
        if (points !== null && (!Number.isInteger(points) || points < 0 || points > 4)) throw new Error('Pontos devem estar entre 0 e 4.');
        if (points === null) await appSettingsRepository.deleteSetting(`capturing_radiance:${profileId}`);
        else await appSettingsRepository.setSetting(`capturing_radiance:${profileId}`, String(points));
        setCaptureOverride(points);
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar os pontos.'); }
      finally { setIsSaving(false); }
    },
    goals,
    simulations,
    resources,
    equivalences,
    totalSavingsPulls,
    characterPity,
    weaponPity,
    aggregated,
    isLoading,
    isSaving,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    markCompleted,
    toggleStatus,
    refresh,
    reorderGoals,
  };
}
