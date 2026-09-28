import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import {
  calculateBannerStatistics,
  calculateWishSummary,
} from '../../../domain/wishes/statisticsEngine';
import { calculatePityProgression } from '../../../domain/wishes/pityEngine';
import type {
  BannerCurrentPity,
  BannerStatistics,
  BannerType,
  CreateWishInput,
  PityState,
  SetBannerCurrentPityInput,
  UpdateWishInput,
  WishEntry,
  WishRuleSet,
  WishSummaryStatistics,
} from '../../../domain/wishes/types';
import { wishesRepository } from '../../../infrastructure/db';
import { matchesVersion } from '../../../domain/shared/versionFilter';

const defaultCurrentPity: Record<BannerType, BannerCurrentPity> = {
  character: { id: '', profileId: '', bannerType: 'character', current5StarPity: 0, current4StarPity: 0, updatedAt: '' },
  weapon: { id: '', profileId: '', bannerType: 'weapon', current5StarPity: 0, current4StarPity: 0, updatedAt: '' },
  standard: { id: '', profileId: '', bannerType: 'standard', current5StarPity: 0, current4StarPity: 0, updatedAt: '' },
  chronicled: { id: '', profileId: '', bannerType: 'chronicled', current5StarPity: 0, current4StarPity: 0, updatedAt: '' },
};

export function useWishes() {
  const { activeProfile } = useShell();
  const profileId = activeProfile?.id ?? null;

  const [wishes, setWishes] = useState<WishEntry[]>([]);
  const [ruleSets, setRuleSets] = useState<WishRuleSet[]>([]);
  const [currentBannerPity, setCurrentBannerPity] = useState<Record<BannerType, BannerCurrentPity>>(defaultCurrentPity);
  const [selectedBanner, setSelectedBanner] = useState<BannerType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<number | 'all'>('all');
  const [versionFilter, setVersionFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Carrega histórico, regras e pity atual dos banners do banco
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!profileId) {
        if (isMounted) {
          setWishes([]);
          setCurrentBannerPity(defaultCurrentPity);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const [loadedWishes, loadedRuleSets, loadedCurrentPity] = await Promise.all([
          wishesRepository.getWishesByProfile(profileId),
          wishesRepository.getRuleSets(),
          wishesRepository.getBannerCurrentPity(profileId),
        ]);

        if (isMounted) {
          setWishes(loadedWishes);
          setRuleSets(loadedRuleSets);
          setCurrentBannerPity(loadedCurrentPity);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar histórico de orações.';
          setError(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profileId, reloadKey]);

  // Estados de Pity por banner
  const pityStates = useMemo(() => {
    const result: Record<BannerType, PityState> = {
      character: calculatePityProgression(wishes, 'character'),
      weapon: calculatePityProgression(wishes, 'weapon'),
      standard: calculatePityProgression(wishes, 'standard'),
      chronicled: calculatePityProgression(wishes, 'chronicled'),
    };
    return result;
  }, [wishes]);

  // Estatísticas por banner e consolidadas
  const bannerStats = useMemo(() => {
    const result: Record<BannerType, BannerStatistics> = {
      character: calculateBannerStatistics(wishes, 'character', currentBannerPity.character.current5StarPity),
      weapon: calculateBannerStatistics(wishes, 'weapon', currentBannerPity.weapon.current5StarPity),
      standard: calculateBannerStatistics(wishes, 'standard', currentBannerPity.standard.current5StarPity),
      chronicled: calculateBannerStatistics(wishes, 'chronicled', currentBannerPity.chronicled.current5StarPity),
    };
    return result;
  }, [wishes, currentBannerPity]);

  const summaryStats: WishSummaryStatistics = useMemo(() => {
    return calculateWishSummary(wishes, Object.fromEntries(Object.entries(currentBannerPity).map(([banner, pity]) => [banner, pity.current5StarPity])));
  }, [wishes, currentBannerPity]);

  // Desejos filtrados para a tabela
  const filteredWishes = useMemo(() => {
    return wishes.filter((w) => {
      if (selectedBanner !== 'all' && w.bannerType !== selectedBanner) return false;
      if (rarityFilter !== 'all' && w.rarity !== rarityFilter) return false;
      if (!matchesVersion(w.gameVersionId, versionFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          w.itemName.toLowerCase().includes(q) ||
          (w.bannerName && w.bannerName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [wishes, selectedBanner, rarityFilter, versionFilter, searchQuery]);

  // Adicionar tiro
  const addWish = useCallback(
    async (input: CreateWishInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setError(null);
      try {
        const created = await wishesRepository.insertWish(profileId, input);
        setReloadKey((k) => k + 1);
        return created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao registrar oração.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Atualizar tiro
  const updateWish = useCallback(
    async (id: string, input: UpdateWishInput) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await wishesRepository.updateWish(id, input);
        if (updated && profileId) {
          // Recalcula pity do banner caso raridade ou tipo tenham mudado
          await wishesRepository.recalculateAndSavePity(profileId, updated.bannerType);
        }
        setReloadKey((k) => k + 1);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar oração.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Deletar tiro
  const deleteWish = useCallback(
    async (id: string) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setError(null);
      try {
        const selected = wishes.find(wish => wish.id === id && wish.profileId === profileId);
        if (!selected) throw new Error('Registro não encontrado no perfil ativo.');
        if (!await wishesRepository.deleteWish(id)) throw new Error('O registro já não existe. Atualize o histórico.');
        // Pity registrado e sequência são dados históricos, não campos derivados.
        setWishes(previous => previous.filter(wish => wish.id !== id));
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao excluir oração.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId, wishes]
  );

  // Recalcular pity manualmente
  const recalculateBannerPity = useCallback(
    async (bannerType: BannerType) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setError(null);
      try {
        await wishesRepository.recalculateAndSavePity(profileId, bannerType);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao recalcular pity.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Atualizar pity atual do banner diretamente (persistência independente)
  const updateBannerCurrentPity = useCallback(
    async (bannerType: BannerType, input: SetBannerCurrentPityInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setError(null);
      try {
        const updated = await wishesRepository.setBannerCurrentPity(profileId, bannerType, input);
        setCurrentBannerPity((prev) => ({
          ...prev,
          [bannerType]: updated,
        }));
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar pity atual do banner.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return {
    wishes,
    filteredWishes,
    ruleSets,
    pityStates,
    currentBannerPity,
    bannerStats,
    summaryStats,
    selectedBanner,
    setSelectedBanner,
    rarityFilter,
    setRarityFilter,
    versionFilter,
    setVersionFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSaving,
    error,
    addWish,
    updateWish,
    deleteWish,
    recalculateBannerPity,
    updateBannerCurrentPity,
    refresh,
  };
}
