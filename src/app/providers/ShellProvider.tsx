import React, { useCallback, useEffect, useRef, useState } from 'react';
import { findRouteById, type RouteId } from '../routes/routes';
import { ShellContext, type ShellContextValue } from './shellContextDef';
import { appSettingsRepository, profilesRepository } from '../../infrastructure/db';
import type { CreateProfileInput, Profile, UpdateProfileInput } from '../../domain/profiles';

export interface ShellProviderProps {
  children: React.ReactNode;
  initialRoute?: RouteId;
}

export const ShellProvider: React.FC<ShellProviderProps> = ({
  children,
  initialRoute = 'dashboard',
}) => {
  const [currentRoute, setCurrentRoute] = useState<RouteId>(initialRoute);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 1000);
  const [navigationTarget, setNavigationTarget] = useState<ShellContextValue['navigationTarget']>();
  const sidebarTouched = useRef(false);
  useEffect(() => {
    let cancelled = false;
    void appSettingsRepository.getSetting('ui.compact_density').then(value => {
      if (!cancelled) document.documentElement.dataset.density = value === 'true' ? 'compact' : 'comfortable';
    }).catch(cause => console.error('Não foi possível carregar a densidade da interface:', cause));
    return () => { cancelled = true; };
  }, []);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const clearDbError = useCallback(() => {
    setDbError(null);
  }, []);

  const reloadProfiles = useCallback(async () => {
    try {
      const active = await profilesRepository.getActiveProfile();
      const all = await profilesRepository.getAllProfiles();
      setActiveProfile(active);
      setProfiles(all);
      setDbError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Erro ao carregar perfis do SQLite:', err);
      setDbError(msg);
      throw err;
    }
  }, []);

  useEffect(() => {
    const changed = () => { void reloadProfiles().catch(cause => console.error('Falha ao atualizar o perfil:', cause)); };
    window.addEventListener('wishlog-characters-changed', changed);
    return () => window.removeEventListener('wishlog-characters-changed', changed);
  }, [reloadProfiles]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        setIsLoadingProfiles(true);
        // Assegura conexão ativa com o banco SQLite e conclusão de migrações
        const active = await profilesRepository.getActiveProfile();
        const all = await profilesRepository.getAllProfiles();
        if (isMounted) {
          setActiveProfile(active);
          setProfiles(all);
          setDbError(null);
          setIsLoadingProfiles(false);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Erro ao carregar perfis do SQLite:', err);
        if (isMounted) {
          setDbError(msg);
          setIsLoadingProfiles(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void appSettingsRepository.getSetting('ui.sidebar_collapsed').then(value => {
      if (!cancelled && !sidebarTouched.current && value !== null) setIsSidebarCollapsed(value === 'true');
    }).catch(err => setDbError(`Não foi possível ler a preferência do menu: ${String(err)}`));
    return () => { cancelled = true; };
  }, []);

  const navigateTo: ShellContextValue['navigateTo'] = (route, target) => {
    setCurrentRoute(route);
    setNavigationTarget(target ? { ...target, route, sequence: Date.now() } : undefined);
  };

  const toggleSidebar = () => {
    sidebarTouched.current = true;
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    void appSettingsRepository.setSetting('ui.sidebar_collapsed', String(next))
      .catch(err => setDbError(`Não foi possível salvar a preferência do menu: ${String(err)}`));
  };

  const switchProfile = async (profileId: string) => {
    await profilesRepository.setActiveProfileId(profileId);
    await reloadProfiles();
  };

  const createProfile = async (input: CreateProfileInput): Promise<Profile> => {
    const created = await profilesRepository.createProfile(input);
    await reloadProfiles();
    return created;
  };

  const updateProfile = async (id: string, input: UpdateProfileInput): Promise<Profile> => {
    const updated = await profilesRepository.updateProfile(id, input);
    await reloadProfiles();
    return updated;
  };

  const deleteProfile = async (id: string): Promise<boolean> => {
    const success = await profilesRepository.deleteProfile(id);
    await reloadProfiles();
    return success;
  };

  const currentRouteMeta = findRouteById(currentRoute);

  const activeProfileName = activeProfile?.name || 'Nenhum perfil';
  const activeProfileTitle = activeProfile
    ? `AR ${activeProfile.adventureRank ?? '—'} • ${activeProfile.server || 'América'}`
    : 'Clique para criar seu perfil';

  return (
    <ShellContext.Provider
      value={{
        currentRoute,
        navigateTo,
        navigationTarget,
        isSidebarCollapsed,
        toggleSidebar,
        activeProfile,
        profiles,
        isLoadingProfiles,
        dbError,
        clearDbError,
        switchProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        reloadProfiles,
        activeProfileName,
        activeProfileTitle,
        currentRouteMeta,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
};
