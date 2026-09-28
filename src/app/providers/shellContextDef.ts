import { createContext } from 'react';
import type { RouteId, NavRoute } from '../routes/routes';
import type { CreateProfileInput, Profile, UpdateProfileInput } from '../../domain/profiles';

export interface ShellContextValue {
  currentRoute: RouteId;
  navigateTo: (route: RouteId, target?: { id: string; query: string }) => void;
  navigationTarget?: { route: RouteId; id: string; query: string; sequence: number };
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeProfile: Profile | null;
  profiles: Profile[];
  isLoadingProfiles: boolean;
  dbError: string | null;
  clearDbError: () => void;
  switchProfile: (profileId: string) => Promise<void>;
  createProfile: (input: CreateProfileInput) => Promise<Profile>;
  updateProfile: (id: string, input: UpdateProfileInput) => Promise<Profile>;
  deleteProfile: (id: string) => Promise<boolean>;
  reloadProfiles: () => Promise<void>;
  activeProfileName: string;
  activeProfileTitle: string;
  currentRouteMeta?: NavRoute;
}

export const ShellContext = createContext<ShellContextValue | null>(null);
