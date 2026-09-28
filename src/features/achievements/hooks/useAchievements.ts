import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type {
  AchievementOverallSummary,
  AchievementWithStatus,
} from '../../../domain/achievements/types';
import { achievementsRepository } from '../../../infrastructure/db';
import { resolveTravelerText } from '../../../domain/shared/travelerText';

export function useAchievements() {
  const { activeProfile, navigationTarget } = useShell();
  const profileId = activeProfile?.id ?? null;

  const [rawAchievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const achievements = useMemo(() => rawAchievements.map(item => ({ ...item,
    namePtBr: resolveTravelerText(item.namePtBr, activeProfile?.travelerGender),
    descriptionPtBr: resolveTravelerText(item.descriptionPtBr, activeProfile?.travelerGender),
  })), [rawAchievements, activeProfile?.travelerGender]);
  const [summary, setSummary] = useState<AchievementOverallSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>(navigationTarget?.route === 'achievements' ? navigationTarget.query : '');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'pending' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Carrega lista de conquistas e resumo do perfil ativo
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!profileId) {
        if (isMounted) {
          setAchievements([]);
          setSummary(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const [loadedList, loadedSummary] = await Promise.all([
          achievementsRepository.getAchievementsWithStatus(profileId),
          achievementsRepository.getAchievementSummary(profileId),
        ]);

        if (isMounted) {
          setAchievements(loadedList);
          setSummary(loadedSummary);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar conquistas.';
          setError(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profileId, reloadKey]);

  // Lista de categorias distintas disponíveis
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of achievements) {
      set.add(a.category);
    }
    return Array.from(set).sort();
  }, [achievements]);

  // Conquistas filtradas por categoria, pesquisa e status
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (selectedCategory !== 'all' && a.category !== selectedCategory) {
        return false;
      }

      if (filterCompleted === 'completed' && !a.completed) return false;
      if (filterCompleted === 'pending' && a.completed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          a.namePtBr.toLowerCase().includes(q) ||
          a.descriptionPtBr.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [achievements, selectedCategory, filterCompleted, searchQuery]);

  // Alterna o estado de conclusão de uma conquista
  const toggleAchievement = useCallback(
    async (achievementId: string, explicitCompleted?: boolean) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      // Atualização otimista
      setAchievements((prev) =>
        prev.map((a) => {
          if (a.id === achievementId) {
            const nextCompleted = explicitCompleted !== undefined ? explicitCompleted : !a.completed;
            return {
              ...a,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : null,
            };
          }
          return a;
        })
      );

      try {
        await achievementsRepository.toggleAchievement(profileId, achievementId, explicitCompleted);
        // Atualiza resumo
        const updatedSummary = await achievementsRepository.getAchievementSummary(profileId);
        setSummary(updatedSummary);
      } catch (err) {
        // Rollback em caso de erro
        setReloadKey((k) => k + 1);
        throw err;
      }
    },
    [profileId]
  );

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return {
    achievements,
    filteredAchievements,
    summary,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filterCompleted,
    setFilterCompleted,
    isLoading,
    error,
    toggleAchievement,
    refresh,
  };
}
