import { getProfileCharacters } from '../../../infrastructure/db/travelerRepository';
import { useCharacterChanges } from '../../../hooks/useCharacterChanges';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type { ArtifactSetData, CharacterData, WeaponData } from '../../../domain/catalog';
import type {
  ArtifactSlotKey,
  BuildFilterOptions,
  CharacterBuildWithDetails,
  UpdateArtifactSlotInput,
  UpdateCharacterBuildInput,
} from '../../../domain/builds/types';
import {
  computeBuildIndicators,
  matchesBuildFilters,
} from '../../../domain/builds/validation';
import type { AccountCharacter } from '../../../domain/characters/types';
import type { AccountWeapon } from '../../../domain/weapons/types';
import {
  buildsRepository,
  charactersRepository,
  defaultGameDataProvider,
  weaponsRepository,
} from '../../../infrastructure';

const DEFAULT_FILTERS: BuildFilterOptions = {
  search: '',
  status: 'all',
  farmStatus: 'all',
  element: 'all',
  weaponType: 'all',
  ownedOnly: false,
};

export function useBuilds() {
  const { activeProfile } = useShell();
  const profileId = activeProfile?.id ?? null;

  const [builds, setBuilds] = useState<CharacterBuildWithDetails[]>([]);
  const [catalogCharacters, setCatalogCharacters] = useState<CharacterData[]>([]);
  const [catalogWeapons, setCatalogWeapons] = useState<WeaponData[]>([]);
  const [catalogArtifactSets, setCatalogArtifactSets] = useState<ArtifactSetData[]>([]);
  const [accountWeapons, setAccountWeapons] = useState<AccountWeapon[]>([]);
  const [filters, setFilters] = useState<BuildFilterOptions>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  useCharacterChanges(profileId, setReloadKey);

  // Carrega catálogo e builds do perfil ativo
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!profileId) {
        if (isMounted) {
          setBuilds([]);
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
        const [
          chars,
          weps,
          arts,
          accChars,
          accWeps,
          profileBuilds,
        ] = await Promise.all([
          getProfileCharacters(profileId),
          defaultGameDataProvider.getAllWeapons(),
          defaultGameDataProvider.getAllArtifactSets(),
          charactersRepository.getAccountCharacters(profileId),
          weaponsRepository.getAccountWeapons(profileId),
          buildsRepository.getProfileBuilds(profileId),
        ]);

        if (!isMounted) return;

        const weaponMap = new Map<string, WeaponData>();
        for (const w of weps) {
          weaponMap.set(w.id, w);
          if (w.gameKey) weaponMap.set(w.gameKey, w);
        }

        const accCharMap = new Map<string, AccountCharacter>();
        for (const ac of accChars) accCharMap.set(ac.characterId, ac);

        const accWepMap = new Map<string, AccountWeapon>();
        for (const aw of accWeps) accWepMap.set(aw.id, aw);

        const buildMap = new Map<string, typeof profileBuilds[0]>();
        for (const b of profileBuilds) buildMap.set(b.characterId, b);

        // Separação estrita: builds listam SOMENTE personagens pertencentes à conta (owned === true)
        const ownedChars = chars.filter((char) => {
          const ac = accCharMap.get(char.id);
          return Boolean(ac && ac.owned);
        });

        const enriched: CharacterBuildWithDetails[] = ownedChars.map((char) => {
          const accChar = accCharMap.get(char.id)!;
          const existingBuild = buildMap.get(char.id);

          const defaultStatus = existingBuild?.status ?? 'sem_build';
          const defaultFarmEnabled = existingBuild?.farmEnabled ?? true;
          const defaultFarmPriority = existingBuild?.farmPriority ?? 0;
          const defaultFarmStatus = existingBuild?.farmStatus ?? 'active';
          const defaultWeaponTarget = existingBuild?.weaponTargetLevel ?? 90;
          const defaultWeaponAscTarget = existingBuild?.weaponTargetAscension ?? 6;
          const defaultCharTarget = existingBuild?.characterTargetLevel ?? 90;
          const defaultCharAscTarget = existingBuild?.characterTargetAscension ?? 6;

          const rawBuild = existingBuild ?? {
            id: `build_${profileId}_${char.id}`,
            profileId,
            characterId: char.id,
            status: defaultStatus,
            farmEnabled: defaultFarmEnabled,
            farmPriority: defaultFarmPriority,
            farmStatus: defaultFarmStatus,
            accountWeaponId: null,
            weaponTargetLevel: defaultWeaponTarget,
            weaponTargetAscension: defaultWeaponAscTarget,
            characterTargetLevel: defaultCharTarget,
            characterTargetAscension: defaultCharAscTarget,
            normalAttackLevel: 1,
            normalAttackTarget: 8,
            elementalSkillLevel: 1,
            elementalSkillTarget: 8,
            elementalBurstLevel: 1,
            elementalBurstTarget: 8,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            artifactSlots: {
              flower: {
                id: `slot_temp_flower`,
                buildId: `build_${profileId}_${char.id}`,
                slotKey: 'flower',
                setId: null,
                mainStat: 'Vida (HP)',
                level: 0,
                targetLevel: 20,
                isEquipped: false,
                rarity: 5,
                notes: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              plume: {
                id: `slot_temp_plume`,
                buildId: `build_${profileId}_${char.id}`,
                slotKey: 'plume',
                setId: null,
                mainStat: 'Ataque (ATK)',
                level: 0,
                targetLevel: 20,
                isEquipped: false,
                rarity: 5,
                notes: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              sands: {
                id: `slot_temp_sands`,
                buildId: `build_${profileId}_${char.id}`,
                slotKey: 'sands',
                setId: null,
                mainStat: null,
                level: 0,
                targetLevel: 20,
                isEquipped: false,
                rarity: 5,
                notes: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              goblet: {
                id: `slot_temp_goblet`,
                buildId: `build_${profileId}_${char.id}`,
                slotKey: 'goblet',
                setId: null,
                mainStat: null,
                level: 0,
                targetLevel: 20,
                isEquipped: false,
                rarity: 5,
                notes: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              circlet: {
                id: `slot_temp_circlet`,
                buildId: `build_${profileId}_${char.id}`,
                slotKey: 'circlet',
                setId: null,
                mainStat: null,
                level: 0,
                targetLevel: 20,
                isEquipped: false,
                rarity: 5,
                notes: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          };

          // Arma associada à build
          let equippedAccWep: AccountWeapon | null = null;
          if (rawBuild.accountWeaponId) {
            equippedAccWep = accWepMap.get(rawBuild.accountWeaponId) ?? null;
          }
          if (!equippedAccWep) {
            for (const aw of accWeps) {
              if (aw.equippedCharacterId === char.id) {
                equippedAccWep = aw;
                break;
              }
            }
          }

          const catWeapon = equippedAccWep ? weaponMap.get(equippedAccWep.weaponId) : null;
          const charLevel = accChar.level;
          const wepLevel = equippedAccWep?.level ?? null;

          const indicators = computeBuildIndicators(rawBuild, charLevel, wepLevel);

          return {
            ...rawBuild,
            characterName: char.namePtBr,
            characterElement: char.element,
            characterRarity: char.rarity,
            characterWeaponType: char.weaponType,
            characterIconUrl: char.iconUrl ?? null,
            characterLevel: charLevel,
            characterAscension: accChar.ascension,
            characterConstellation: accChar.constellation,
            isCharacterOwned: true,
            weaponId: catWeapon?.id ?? null,
            weaponName: catWeapon?.namePtBr ?? null,
            plannedWeaponName: rawBuild.plannedWeaponId ? weaponMap.get(rawBuild.plannedWeaponId)?.namePtBr ?? rawBuild.plannedWeaponId : null,
            weaponRarity: catWeapon?.rarity ?? null,
            weaponLevel: wepLevel,
            weaponRefinement: equippedAccWep?.refinement ?? null,
            weaponIconUrl: catWeapon?.iconUrl ?? null,
            indicators,
            status: indicators.effectiveStatus,
            configuredStatus: rawBuild.status,
            statusReason: indicators.statusReason,
            canBeComplete: indicators.canBeComplete,
            missingForComplete: indicators.missingForComplete,
          };
        });

        // Ordenação inteligente: Farm ativo primeiro, depois completude/status, raridade desc, nome asc
        const statusWeight: Record<string, number> = {
          completa: 5,
          utilizavel: 4,
          precisa_melhorar: 3,
          incompleta: 2,
          sem_build: 1,
        };

        enriched.sort((a, b) => {
          if (a.farmEnabled !== b.farmEnabled) return a.farmEnabled ? -1 : 1;
          if (a.farmPriority !== b.farmPriority) return a.farmPriority - b.farmPriority;
          const weightA = statusWeight[a.status] || 0;
          const weightB = statusWeight[b.status] || 0;
          if (weightA !== weightB) return weightB - weightA;
          if (a.characterRarity !== b.characterRarity) return b.characterRarity - a.characterRarity;
          return a.characterName.localeCompare(b.characterName);
        });

        setBuilds(enriched);
        setCatalogCharacters(chars);
        setCatalogWeapons(weps);
        setCatalogArtifactSets(arts);
        setAccountWeapons(accWeps);
        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar builds de personagens.';
          setLoadError(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profileId, activeProfile?.travelerGender, reloadKey]);

  // Filtros aplicados
  const filteredBuilds = useMemo(() => {
    return builds.filter((b) => matchesBuildFilters(b, filters));
  }, [builds, filters]);

  // Estatísticas das builds do perfil
  const stats = useMemo(() => {
    let totalBuilds = 0;
    let complete = 0;
    let usable = 0;
    let needsImprovement = 0;
    let incomplete = 0;
    let noBuild = 0;
    let farmActiveCount = 0;

    for (const b of builds) {
      if (b.farmEnabled) farmActiveCount++;
      if (b.status === 'completa') {
        complete++;
        totalBuilds++;
      } else if (b.status === 'utilizavel') {
        usable++;
        totalBuilds++;
      } else if (b.status === 'precisa_melhorar') {
        needsImprovement++;
        totalBuilds++;
      } else if (b.status === 'incompleta') {
        incomplete++;
        totalBuilds++;
      } else {
        noBuild++;
      }
    }

    return {
      totalCharacters: builds.length,
      activeBuildsCount: totalBuilds,
      farmActiveCount,
      completeCount: complete,
      usableCount: usable,
      needsImprovementCount: needsImprovement,
      incompleteCount: incomplete,
      noBuildCount: noBuild,
      completeRatio: builds.length > 0 ? complete / builds.length : 0,
    };
  }, [builds]);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Alternar Farm Ativo
  const toggleFarmEnabled = useCallback(
    async (characterId: string) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        const updated = await buildsRepository.toggleFarmEnabled(profileId, characterId);
        setBuilds((prev) =>
          prev.map((b) => {
            if (b.characterId === characterId) {
              return {
                ...b,
                farmEnabled: updated.farmEnabled,
                updatedAt: updated.updatedAt,
              };
            }
            return b;
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao alternar farm da build.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Atualizar build do personagem
  const updateBuild = useCallback(
    async (characterId: string, input: UpdateCharacterBuildInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        await buildsRepository.upsertCharacterBuild(profileId, characterId, input);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar build do personagem.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Atualizar slot individual de artefato
  const updateArtifactSlot = useCallback(
    async (buildId: string, slotKey: ArtifactSlotKey, input: UpdateArtifactSlotInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        await buildsRepository.updateArtifactSlot(buildId, slotKey, input);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar artefato da build.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Salvar build completa e artefatos em uma única operação sem recarregar a tela inteira
  const saveFullBuild = useCallback(
    async (
      characterId: string,
      buildInput: UpdateCharacterBuildInput,
      slotsInput: Record<ArtifactSlotKey, UpdateArtifactSlotInput>
    ) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setActionError(null);
      try {
        const savedBuild = await buildsRepository.saveFullBuild(
          profileId,
          characterId,
          buildInput,
          slotsInput
        );

        // Atualização reativa em memória sem substituir a tela por LoadingState
        setBuilds((prev) => {
          return prev.map((b) => {
            if (b.characterId !== characterId) return b;

            let wepId = b.weaponId;
            let wepLevel = b.weaponLevel;
            let wepName = b.weaponName;
            let wepRarity = b.weaponRarity;
            let wepRefinement = b.weaponRefinement;
            let wepIconUrl = b.weaponIconUrl;

            if (savedBuild.accountWeaponId !== b.accountWeaponId) {
              const aw = accountWeapons.find((w) => w.id === savedBuild.accountWeaponId);
              if (aw) {
                wepLevel = aw.level;
                wepRefinement = aw.refinement;
                const catWep = catalogWeapons.find((cw) => cw.id === aw.weaponId || (cw.gameKey && cw.gameKey === aw.weaponId));
                wepId = catWep?.id ?? aw.weaponId;
                wepName = catWep?.namePtBr ?? aw.weaponId;
                wepRarity = catWep?.rarity ?? null;
                wepIconUrl = catWep?.iconUrl ?? null;
              } else {
                wepId = null;
                wepLevel = null;
                wepRefinement = null;
                wepName = null;
                wepRarity = null;
                wepIconUrl = null;
              }
            }

            const indicators = computeBuildIndicators(savedBuild, b.characterLevel, wepLevel);

            return {
              ...b,
              ...savedBuild,
              weaponId: wepId,
              weaponName: wepName,
              plannedWeaponName: savedBuild.plannedWeaponId ? catalogWeapons.find(w => w.id === savedBuild.plannedWeaponId)?.namePtBr ?? savedBuild.plannedWeaponId : null,
              weaponRarity: wepRarity,
              weaponLevel: wepLevel,
              weaponRefinement: wepRefinement,
              weaponIconUrl: wepIconUrl,
              indicators,
              status: indicators.effectiveStatus,
              configuredStatus: savedBuild.status,
              statusReason: indicators.statusReason,
              canBeComplete: indicators.canBeComplete,
              missingForComplete: indicators.missingForComplete,
            };
          });
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar build.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId, accountWeapons, catalogWeapons]
  );

  const updateFarmPriority = useCallback(
    async (characterId: string, priority: number) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setActionError(null);
      try {
        await buildsRepository.updateFarmPriority(profileId, characterId, priority);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar prioridade de farm.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  const updateFarmStatus = useCallback(
    async (characterId: string, status: 'active' | 'paused' | 'completed') => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setActionError(null);
      try {
        await buildsRepository.updateFarmStatus(profileId, characterId, status);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar status de farm.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  const reorderFarmPriorities = useCallback(
    async (characterIdsInOrder: string[]) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');
      setIsSaving(true);
      setActionError(null);

      // Atualização otimista imediata na UI
      setBuilds((prev) => {
        const priorityMap = new Map<string, number>();
        characterIdsInOrder.forEach((id, idx) => priorityMap.set(id, idx));
        return prev.map((b) => {
          if (priorityMap.has(b.characterId)) {
            return { ...b, farmPriority: priorityMap.get(b.characterId)! };
          }
          return b;
        });
      });

      try {
        await buildsRepository.reorderFarmPriorities(profileId, characterIdsInOrder);
        setReloadKey((k) => k + 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao reordenar prioridades de farm.';
        setActionError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  const refresh = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  return {
    profileId,
    activeProfile,
    builds,
    filteredBuilds,
    catalogCharacters,
    catalogWeapons,
    catalogArtifactSets,
    accountWeapons,
    filters,
    stats,
    isLoading,
    isSaving,
    error: loadError,
    actionError,
    clearActionError,
    setFilters,
    resetFilters,
    toggleFarmEnabled,
    updateFarmPriority,
    updateFarmStatus,
    reorderFarmPriorities,
    updateBuild,
    updateArtifactSlot,
    saveFullBuild,
    refresh,
  };
}
