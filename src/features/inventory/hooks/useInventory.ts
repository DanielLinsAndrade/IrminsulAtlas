import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type {
  InventoryItem,
  InventoryItemWithDetails,
  ProfileResources,
  UpdateProfileResourcesInput,
  WishEquivalences,
} from '../../../domain/inventory';
import {
  calculateWishEquivalences,
  createDefaultResources,
  isWishResourceMaterialId,
} from '../../../domain/inventory';
import type { MaterialData } from '../../../domain/catalog';
import { defaultGameDataProvider, inventoryRepository } from '../../../infrastructure';

export function useInventory() {
  const { activeProfile } = useShell();
  const profileId = activeProfile?.id ?? null;

  const [resources, setResources] = useState<ProfileResources | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Carrega recursos do perfil e catálogo de materiais
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!profileId) {
        if (isMounted) {
          setResources(null);
          setInventory([]);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }
      try {
        await defaultGameDataProvider.ensureCatalogLoaded();
        const [res, inv, mats] = await Promise.all([
          inventoryRepository.getResources(profileId),
          inventoryRepository.getInventory(profileId),
          defaultGameDataProvider.getAllMaterials(),
        ]);

        if (isMounted) {
          setResources(res);
          setInventory(inv);
          setMaterials(mats);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar recursos e inventário.';
          setError(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profileId, reloadKey]);

  // Equivalências de tiros calculadas pelo serviço de domínio
  const equivalences = useMemo<WishEquivalences>(() => {
    return calculateWishEquivalences(resources);
  }, [resources]);

  // Inventário enriquecido com os detalhes do catálogo de materiais
  const inventoryWithDetails = useMemo<InventoryItemWithDetails[]>(() => {
    const quantityMap = new Map<string, { quantity: number; updatedAt: string }>();
    for (const item of inventory) {
      quantityMap.set(item.materialId, {
        quantity: item.quantity,
        updatedAt: item.updatedAt,
      });
    }

    // Filtra recursos de desejos para que profile_resources seja a única fonte de verdade
    const evolutionMaterials = materials.filter((mat) => !isWishResourceMaterialId(mat.id));

    return evolutionMaterials.map((mat) => {
      const recorded = quantityMap.get(mat.id);
      return {
        materialId: mat.id,
        gameKey: mat.gameKey,
        namePtBr: mat.namePtBr,
        category: mat.category,
        rarity: mat.rarity ?? null,
        region: mat.region ?? null,
        iconUrl: mat.iconUrl ?? null,
        quantity: recorded ? recorded.quantity : 0,
        updatedAt: recorded ? recorded.updatedAt : '',
      };
    });
  }, [materials, inventory]);

  // Atualiza recursos de desejos
  const updateResources = useCallback(
    async (input: UpdateProfileResourcesInput) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setError(null);
      try {
        const updated = await inventoryRepository.saveResources(profileId, input);
        setResources(updated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar recursos.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Define a quantidade de um material no inventário
  const setItemQuantity = useCallback(
    async (materialId: string, quantity: number) => {
      if (!profileId) throw new Error('Nenhum perfil ativo selecionado.');

      setIsSaving(true);
      setError(null);
      try {
        const updatedItem = await inventoryRepository.setInventoryItem(profileId, materialId, quantity);
        setInventory((prev) => {
          const index = prev.findIndex((i) => i.materialId === materialId);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedItem;
            return next;
          }
          return [...prev, updatedItem];
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar item do inventário.';
        setError(msg);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [profileId]
  );

  // Incrementa ou decrementa a quantidade de um material
  const adjustItemQuantity = useCallback(
    async (materialId: string, delta: number) => {
      const current = inventory.find((i) => i.materialId === materialId)?.quantity ?? 0;
      const nextQuantity = Math.max(0, current + delta);
      await setItemQuantity(materialId, nextQuantity);
    },
    [inventory, setItemQuantity]
  );

  const refresh = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  return {
    profileId,
    activeProfile,
    resources: resources ?? (profileId ? createDefaultResources(profileId) : null),
    equivalences,
    inventory,
    materials,
    inventoryWithDetails,
    isLoading,
    isSaving,
    error,
    updateResources,
    setItemQuantity,
    adjustItemQuantity,
    refresh,
  };
}
