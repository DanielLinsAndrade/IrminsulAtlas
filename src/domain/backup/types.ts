import type { Profile } from '../profiles/types';
import type { ProfileResources, InventoryItem } from '../inventory/types';
import type { AccountCharacter } from '../characters/types';
import type { AccountWeapon } from '../weapons/types';
import type { CharacterBuild } from '../builds/types';
import type { BannerCurrentPity, BannerType, WishEntry } from '../wishes/types';
import type { WishGoal } from '../wishes/goalTypes';

export const CURRENT_BACKUP_SCHEMA_VERSION = 1;
export const BACKUP_FORMAT_IDENTIFIER = 'wishlog_backup';

export interface WishLogBackupMetadata {
  format: 'wishlog_backup';
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  generator: string;
}

export interface ProfileAchievementBackup {
  achievementId: string;
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
}

export interface ProfileBackupData {
  travelerArchive?: unknown[];
  weaponBilletStock?: import('../weapons/collection').BilletStock;
  weaponCollectionTargets?: import('../weapons/collection').WeaponCollectionTargets;
  capturingRadianceOverride?: number | null;
  profile: Profile;
  resources: ProfileResources | null;
  inventory: InventoryItem[];
  characters: AccountCharacter[];
  weapons: AccountWeapon[];
  builds: CharacterBuild[];
  wishes: WishEntry[];
  bannerCurrentPity: Record<BannerType, BannerCurrentPity> | null;
  goals: WishGoal[];
  achievements: ProfileAchievementBackup[];
}

export interface WishLogBackup {
  metadata: WishLogBackupMetadata;
  profiles: ProfileBackupData[];
}

export interface ProfilePreviewSummary {
  profileId: string;
  profileName: string;
  uid: string | null;
  server: string | null;
  adventureRank: number | null;
  wishesCount: number;
  charactersCount: number;
  weaponsCount: number;
  buildsCount: number;
  goalsCount: number;
  achievementsCount: number;
  alreadyExists: boolean;
}

export interface BackupImportPreview {
  valid: boolean;
  format: string;
  schemaVersion: number;
  exportedAt: string;
  profiles: ProfilePreviewSummary[];
  totalProfiles: number;
  totalWishes: number;
  warnings: string[];
  errors: string[];
}

export type RestoreConflictStrategy = 'overwrite' | 'create_copy' | 'skip';

export interface RestoreProfileResult {
  originalProfileId: string;
  finalProfileId: string;
  profileName: string;
  action: 'created' | 'overwritten' | 'skipped';
  counts: {
    wishes: number;
    characters: number;
    weapons: number;
    builds: number;
    goals: number;
    achievements: number;
  };
}

export interface RestoreBackupResult {
  success: boolean;
  strategyUsed: RestoreConflictStrategy;
  restoredAt: string;
  profiles: RestoreProfileResult[];
  errors: string[];
}
