import { getProfileCharacters } from '../../../infrastructure/db/travelerRepository';
import { useCharacterChanges } from '../../../hooks/useCharacterChanges';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type { CharacterData } from '../../../domain/catalog';
import type {
  AccountCharacterWithDetails,
  CharacterFilterOptions,
  UpdateAccountCharacterInput,
} from '../../../domain/characters/types';
import {
  matchesCharacterFilters,
} from '../../../domain/characters/validation';
import { defaultGameDataProvider, charactersRepository } from '../../../infrastructure';

const DEFAULT_FILTERS: CharacterFilterOptions = {
  search: '',
  element: 'all',
  weaponType: 'all',
  rarity: 'all',
  owned: 'all',
  constellation: 'all',
};

export function useCharacters() {
  const { activeProfile, navigationTarget } = useShell();
  const profileId = activeProfile?.id ?? null;

  const [catalogCharacters, setCatalogCharacters] = useState<CharacterData[]>([]);
  const [characters, setCharacters] = useState<AccountCharacterWithDetails[]>([]);
  const [filters, setFilters] = useState<CharacterFilterOptions>(() => ({ ...DEFAULT_FILTERS, search: navigationTarget?.route === 'characters' ? navigationTarget.query : '' }));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  useCharacterChanges(profileId, setReloadKey);

  // Carrega catálogo global e registros de conta do perfil ativo
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!profileId) {
        if (isMounted) {
          setCatalogCharacters([]);
          setCharacters([]);
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
        const [catalogChars, accountChars] = await Promise.all([
          getProfileCharacters(profileId),
          charactersRepository.getAccountCharacters(profileId),
        ]);

        if (!isMounted) return;

        setCatalogCharacters(catalogChars);

        const catMap = new Map<string, (typeof catalogChars)[0]>();
        for (const cat of catalogChars) {
          catMap.set(cat.id, cat);
          if (cat.gameKey) catMap.set(cat.gameKey, cat);
        }

        // Separação estrita: na coleção da conta, entram SOMENTE os que o usuário possui (owned === true), na ordem de aquisição
        const ownedList: AccountCharacterWithDetails[] = [];
        for (const ac of accountChars) {
          if (!ac.owned) continue;
          const cat = catMap.get(ac.characterId);
          if (cat) {
            ownedList.push({
              id: ac.id,
              profileId,
              characterId: cat.id,
              owned: true,
              constellation: ac.constellation,
              level: ac.level,
              ascension: ac.ascension,
              friendship: ac.friendship,
              notes: ac.notes,
              combatStats: ac.combatStats,
              createdAt: ac.createdAt,
              updatedAt: ac.updatedAt,
              gameKey: cat.gameKey,
              namePtBr: cat.namePtBr,
              rarity: cat.rarity,
              element: cat.element,
              weaponType: cat.weaponType,
              releaseVersionId: cat.releaseVersionId ?? null,
              iconUrl: cat.iconUrl ?? null,
              splashUrl: cat.splashUrl ?? null,
              region: cat.region ?? null,
              maxConstellation: cat.maxConstellation ?? 6,
              supportsFriendship: cat.supportsFriendship ?? true,
            });
          }
        }

        setCharacters(ownedList);
        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar coleção de personagens.';
          setLoadError(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profileId, activeProfile?.travelerGender, reloadKey]);

  // Personagens filtrados e ordenados na tela de coleção
  const filteredCharacters = useMemo(() => {
    const list = characters.filter((c) => matchesCharacterFilters(c, filters));
    const sortBy = filters.sortBy ?? 'rarity';

    return [...list].sort((a, b) => {
      if (sortBy === 'acquisition') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id);
      }
      if (sortBy === 'name') {
        return a.namePtBr.localeCompare(b.namePtBr);
      }
      if (sortBy === 'level') {
        if (b.level !== a.level) return b.level - a.level;
        if (b.ascension !== a.ascension) return b.ascension - a.ascension;
        return a.namePtBr.localeCompare(b.namePtBr);
      }
      // 'rarity' (padrão): 5★ primeiro, depois 4★, depois nome alfabético
      if (a.rarity !== b.rarity) return b.rarity - a.rarity;
      return a.namePtBr.localeCompare(b.namePtBr);
    });
  }, [characters, filters]);

  // Set para verificação rápida de personagens obtidos
  const ownedCharacterIds = useMemo(() => {
    return new Set(characters.map((c) => c.characterId));
  }, [characters]);

  // Estatísticas da coleção
  const stats = useMemo(() => {
    const total = catalogCharacters.length;
    let owned = 0;
    let c6 = 0;
    let fiveStar = 0;
    let fourStar = 0;

    for (const c of characters) {
      if (c.owned) {
        owned++;
        if (c.constellation === 6) c6++;
        if (c.rarity === 5) fiveStar++;
        if (c.rarity === 4) fourStar++;
      }
    }

    return {
      totalCount: total,
      ownedCount: owned,
      c6Count: c6,
      fiveStarCount: fiveStar,
      fourStarCount: fourStar,
    };
  }, [characters, catalogCharacters]);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  // Adicionar personagem ao perfil (owned = true)
  const addCharacterToAccount = useCallback(
    async (characterId: string) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        const updated = await charactersRepository.upsertAccountCharacter(profileId, characterId, {
          owned: true,
        });
        const cat = catalogCharacters.find((c) => c.id === characterId);
        if (!cat) return;

        const newChar: AccountCharacterWithDetails = {
          id: updated.id,
          profileId,
          characterId,
          owned: true,
          constellation: updated.constellation,
          level: updated.level,
          ascension: updated.ascension,
          friendship: updated.friendship,
          notes: updated.notes,
          combatStats: updated.combatStats,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          gameKey: cat.gameKey,
          namePtBr: cat.namePtBr,
          rarity: cat.rarity,
          element: cat.element,
          weaponType: cat.weaponType,
          releaseVersionId: cat.releaseVersionId ?? null,
          iconUrl: cat.iconUrl ?? null,
          splashUrl: cat.splashUrl ?? null,
          region: cat.region ?? null,
          maxConstellation: cat.maxConstellation ?? 6,
          supportsFriendship: cat.supportsFriendship ?? true,
        };

        setCharacters((prev) => {
          const filtered = prev.filter((c) => c.characterId !== characterId);
          const next = [...filtered, newChar];
          next.sort((a, b) => {
            if (a.rarity !== b.rarity) return b.rarity - a.rarity;
            return a.namePtBr.localeCompare(b.namePtBr);
          });
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao adicionar personagem à conta.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId, catalogCharacters]
  );

  // Remover personagem da conta sem apagar do catálogo global
  const removeCharacterFromAccount = useCallback(
    async (characterId: string) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        await charactersRepository.upsertAccountCharacter(profileId, characterId, {
          owned: false,
        });
        setCharacters((prev) => prev.filter((c) => c.characterId !== characterId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao remover personagem da conta.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Alternar posse (compatibilidade)
  const toggleOwned = useCallback(
    async (characterId: string) => {
      if (ownedCharacterIds.has(characterId)) {
        await removeCharacterFromAccount(characterId);
      } else {
        await addCharacterToAccount(characterId);
      }
    },
    [ownedCharacterIds, addCharacterToAccount, removeCharacterFromAccount]
  );

  // Definir constelação (C0..C6)
  const setConstellation = useCallback(
    async (characterId: string, constellation: number) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      const target = characters.find((c) => c.characterId === characterId);
      const maxC = target?.maxConstellation ?? 6;
      const boundedConstellation = Math.max(0, Math.min(constellation, maxC));

      setIsSaving(true);
      setActionError(null);
      try {
        const updated = await charactersRepository.setConstellation(
          profileId,
          characterId,
          boundedConstellation
        );
        setCharacters((prev) =>
          prev.map((c) => {
            if (c.characterId === characterId) {
              return {
                ...c,
                owned: updated.owned,
                constellation: updated.constellation,
                updatedAt: updated.updatedAt,
              };
            }
            return c;
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar constelação.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [characters, profileId]
  );

  // Atualização detalhada (nível, ascensão, constelação, amizade, notas)
  const updateCharacter = useCallback(
    async (characterId: string, input: UpdateAccountCharacterInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      const target = characters.find((c) => c.characterId === characterId);
      const sanitizedInput: UpdateAccountCharacterInput = { ...input };

      if (target?.supportsFriendship === false) {
        sanitizedInput.friendship = null;
      }

      if (target?.maxConstellation !== undefined && sanitizedInput.constellation !== undefined) {
        sanitizedInput.constellation = Math.min(sanitizedInput.constellation, target.maxConstellation);
      }

      setIsSaving(true);
      setActionError(null);
      try {
        const updated = await charactersRepository.upsertAccountCharacter(
          profileId,
          characterId,
          sanitizedInput
        );
        setCharacters((prev) =>
          prev.map((c) => {
            if (c.characterId === characterId) {
              return {
                ...c,
                owned: updated.owned,
                constellation: updated.constellation,
                level: updated.level,
                ascension: updated.ascension,
                friendship: updated.friendship,
                notes: updated.notes,
                combatStats: updated.combatStats,
                updatedAt: updated.updatedAt,
              };
            }
            return c;
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar dados do personagem.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [characters, profileId]
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
    characters,
    filteredCharacters,
    catalogCharacters,
    ownedCharacterIds,
    filters,
    stats,
    isLoading,
    isSaving,
    error: loadError,
    actionError,
    clearActionError,
    setFilters,
    resetFilters,
    addCharacterToAccount,
    removeCharacterFromAccount,
    toggleOwned,
    setConstellation,
    updateCharacter,
    refresh,
  };
}
