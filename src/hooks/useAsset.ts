import { useEffect, useState } from 'react';
import type { AssetRef, AssetVariant } from '../domain/catalog';
import { defaultAssetProvider } from '../infrastructure/providers';

export function useAsset(
  entityType?: 'character' | 'weapon' | 'material' | 'artifact',
  entityId?: string,
  variant: AssetVariant = 'icon'
): { asset: AssetRef | null; isLoading: boolean; error: Error | null } {
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [asset, setAsset] = useState<AssetRef | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const requestKey = entityType && entityId ? `${entityType}:${entityId}:${variant}` : null;
  const isLoading = Boolean(requestKey && loadedKey !== requestKey);

  useEffect(() => {
    if (!requestKey || !entityType || !entityId) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        let res: AssetRef;
        if (entityType === 'character') {
          res = await defaultAssetProvider.getCharacterAsset(entityId, variant);
        } else if (entityType === 'weapon') {
          res = await defaultAssetProvider.getWeaponAsset(entityId, variant);
        } else if (entityType === 'material') {
          res = await defaultAssetProvider.getMaterialAsset(entityId, variant);
        } else {
          res = await defaultAssetProvider.getArtifactAsset(entityId, variant);
        }

        if (isMounted) {
          setAsset(res);
          setError(null);
          setLoadedKey(requestKey);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoadedKey(requestKey);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [requestKey, entityType, entityId, variant]);

  return {
    asset: requestKey && loadedKey === requestKey ? asset : null,
    isLoading,
    error,
  };
}
