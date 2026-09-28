import { getProfileCharacters } from '../../../infrastructure/db/travelerRepository';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type { CharacterData, WeaponData } from '../../../domain/catalog';
import type {
  AccountWeaponWithDetails,
  CreateAccountWeaponInput,
  UpdateAccountWeaponInput,
  WeaponFilterOptions,
} from '../../../domain/weapons/types';
import { matchesWeaponFilters } from '../../../domain/weapons/validation';
import {
  defaultGameDataProvider,
  weaponsRepository,
} from '../../../infrastructure';

const DEFAULT_FILTERS: WeaponFilterOptions = {
  search: '',
  weaponType: 'all',
  rarity: 'all',
  refinement: 'all',
  equipped: 'all',
  favoriteOnly: false,
};

export function useWeapons() {
  const { activeProfile, navigationTarget } = useShell();
  const profileId = activeProfile?.id ?? null;

  const [weapons, setWeapons] = useState<AccountWeaponWithDetails[]>([]);
  const [catalogWeapons, setCatalogWeapons] = useState<WeaponData[]>([]);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [filters, setFilters] = useState<WeaponFilterOptions>(() => ({ ...DEFAULT_FILTERS, search: navigationTarget?.route === 'weapons' ? navigationTarget.query : '' }));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Carrega catálogo e armas possuídas do perfil ativo
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!profileId) {
        if (isMounted) {
          setWeapons([]);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        await defaultGameDataProvider.ensureCatalogLoaded();
        const [catWeapons, catChars, accWeapons] = await Promise.all([
          defaultGameDataProvider.getAllWeapons(),
          getProfileCharacters(profileId),
          weaponsRepository.getAccountWeapons(profileId),
        ]);

        const weaponMap = new Map<string, WeaponData>();
        for (const w of catWeapons) {
          weaponMap.set(w.id, w);
        }

        const charMap = new Map<string, CharacterData>();
        for (const c of catChars) {
          charMap.set(c.id, c);
        }

        const enriched: AccountWeaponWithDetails[] = accWeapons.map((aw) => {
          const cat = weaponMap.get(aw.weaponId);
          const equippedChar = aw.equippedCharacterId ? charMap.get(aw.equippedCharacterId) : null;

          return {
            ...aw,
            gameKey: cat?.gameKey ?? aw.weaponId,
            namePtBr: cat?.namePtBr ?? 'Arma Desconhecida',
            rarity: cat?.rarity ?? 4,
            weaponType: cat?.weaponType ?? 'sword',
            releaseVersionId: cat?.releaseVersionId ?? null,
            iconUrl: cat?.iconUrl ?? null,
            equippedCharacterName: equippedChar?.namePtBr ?? null,
            equippedCharacterIconUrl: equippedChar?.iconUrl ?? null,
          };
        });

        // Ordenação padrão: Favoritos primeiro, raridade desc, nível desc, refinamento desc, nome asc
        enriched.sort((a, b) => {
          if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
          if (a.rarity !== b.rarity) return b.rarity - a.rarity;
          if (a.level !== b.level) return b.level - a.level;
          if (a.refinement !== b.refinement) return b.refinement - a.refinement;
          return a.namePtBr.localeCompare(b.namePtBr);
        });

        if (isMounted) {
          setWeapons(enriched);
          setCatalogWeapons(uniqueCatalogEntries(catWeapons, 'weapon'));
          setCharacters(catChars);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar armas da conta.';
          setLoadError(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profileId, activeProfile?.travelerGender, reloadKey]);

  // Armas filtradas
  const filteredWeapons = useMemo(() => {
    return weapons.filter((w) => matchesWeaponFilters(w, filters));
  }, [weapons, filters]);

  // Estatísticas da coleção de armas
  const stats = useMemo(() => {
    const total = weapons.length;
    let fiveStar = 0;
    let fourStar = 0;
    let r5 = 0;
    let equipped = 0;

    for (const w of weapons) {
      if (w.rarity === 5) fiveStar++;
      if (w.rarity === 4) fourStar++;
      if (w.refinement === 5) r5++;
      if (w.equippedCharacterId) equipped++;
    }

    return {
      totalCount: total,
      fiveStarCount: fiveStar,
      fourStarCount: fourStar,
      r5Count: r5,
      equippedCount: equipped,
    };
  }, [weapons]);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  // Criar nova cópia de arma
  const createWeapon = useCallback(
    async (input: CreateAccountWeaponInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        await weaponsRepository.createAccountWeapon(profileId, input);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao adicionar arma.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Atualizar arma existente
  const updateWeapon = useCallback(
    async (id: string, input: UpdateAccountWeaponInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        await weaponsRepository.updateAccountWeapon(id, input);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar dados da arma.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Remover cópia de arma
  const deleteWeapon = useCallback(
    async (id: string) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        await weaponsRepository.deleteAccountWeapon(id);
        setWeapons((prev) => prev.filter((w) => w.id !== id));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao remover arma.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Alternar favorito
  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        const updated = await weaponsRepository.toggleFavorite(id);
        setWeapons((prev) =>
          prev.map((w) => (w.id === id ? { ...w, favorite: updated.favorite } : w))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao alternar favorito.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const refresh = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  return {
    profileId,
    activeProfile,
    weapons,
    filteredWeapons,
    catalogWeapons,
    characters,
    filters,
    stats,
    isLoading,
    isSaving,
    error: loadError,
    actionError,
    clearActionError,
    setFilters,
    resetFilters,
    createWeapon,
    updateWeapon,
    deleteWeapon,
    toggleFavorite,
    refresh,
  };
}
import { uniqueCatalogEntries } from '../../../domain/catalog/identity';
