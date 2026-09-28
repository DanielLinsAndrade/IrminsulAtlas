import { useShell } from '../app/providers';
import { getProfileCharacters } from '../infrastructure/db/travelerRepository';
import { useCallback, useEffect, useState } from 'react';
import type {
  ArtifactSetData,
  CatalogMetadata,
  CharacterData,
  MaterialData,
  WeaponData,
} from '../domain/catalog';
import { defaultGameDataProvider } from '../infrastructure/providers';

export function useCatalog(): {
  characters: CharacterData[];
  weapons: WeaponData[];
  materials: MaterialData[];
  artifactSets: ArtifactSetData[];
  metadata: CatalogMetadata | null;
  isLoading: boolean;
  refreshCatalog: () => Promise<void>;
} {
  const { activeProfile } = useShell();
  const profileId = activeProfile?.id;
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [weapons, setWeapons] = useState<WeaponData[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [artifactSets, setArtifactSets] = useState<ArtifactSetData[]>([]);
  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        await defaultGameDataProvider.ensureCatalogLoaded();
        const [c, w, m, a, meta] = await Promise.all([
          profileId ? getProfileCharacters(profileId) : defaultGameDataProvider.getAllCharacters(),
          defaultGameDataProvider.getAllWeapons(),
          defaultGameDataProvider.getAllMaterials(),
          defaultGameDataProvider.getAllArtifactSets(),
          defaultGameDataProvider.getCatalogMetadata(),
        ]);
        if (isMounted) {
          setCharacters(c);
          setWeapons(w);
          setMaterials(m);
          setArtifactSets(a);
          setMetadata(meta);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [reloadKey, profileId, activeProfile?.travelerGender]);

  const refreshCatalog = useCallback(async () => {
    setIsLoading(true);
    await defaultGameDataProvider.syncCatalog();
    setReloadKey((k) => k + 1);
  }, []);

  return {
    characters,
    weapons,
    materials,
    artifactSets,
    metadata,
    isLoading,
    refreshCatalog,
  };
}
