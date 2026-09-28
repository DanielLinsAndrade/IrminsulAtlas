import type { Profile } from '../profiles/types';
import {
  BACKUP_FORMAT_IDENTIFIER,
  CURRENT_BACKUP_SCHEMA_VERSION,
  type BackupImportPreview,
  type ProfileBackupData,
  type ProfilePreviewSummary,
  type WishLogBackup,
} from './types';

export function createWishLogBackup(
  profilesData: ProfileBackupData[],
  appVersion = '0.1.0'
): WishLogBackup {
  return {
    metadata: {
      format: BACKUP_FORMAT_IDENTIFIER,
      schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      appVersion,
      exportedAt: new Date().toISOString(),
      generator: 'Irminsul Atlas Desktop',
    },
    profiles: profilesData,
  };
}

export function validateBackupPayload(raw: unknown): {
  valid: boolean;
  backup: WishLogBackup | null;
  errors: string[];
} {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, backup: null, errors: ['O arquivo selecionado não contém um objeto JSON válido.'] };
  }

  const obj = raw as Record<string, unknown>;

  if (!obj.metadata || typeof obj.metadata !== 'object') {
    errors.push('Metadados do backup ausentes ou inválidos.');
  } else {
    const meta = obj.metadata as Record<string, unknown>;
    if (meta.format !== BACKUP_FORMAT_IDENTIFIER) {
      errors.push(`Formato incompatível: esperado "${BACKUP_FORMAT_IDENTIFIER}", encontrado "${String(meta.format)}".`);
    }
    const schemaVer = Number(meta.schemaVersion);
    if (Number.isNaN(schemaVer) || schemaVer < 1) {
      errors.push('Versão de schema ausente ou inválida nos metadados.');
    } else if (schemaVer > CURRENT_BACKUP_SCHEMA_VERSION) {
      errors.push(`Versão de schema ${schemaVer} é superior à suportada por esta versão do aplicativo (${CURRENT_BACKUP_SCHEMA_VERSION}). Atualize o Irminsul Atlas.`);
    }
  }

  if (!Array.isArray(obj.profiles)) {
    errors.push('Campo "profiles" ausente ou não é uma lista.');
  } else if (obj.profiles.length === 0) {
    errors.push('O backup não contém nenhum perfil para restaurar.');
  } else {
    obj.profiles.forEach((p, index) => {
      if (!p || typeof p !== 'object') {
        errors.push(`Perfil no índice ${index} é inválido.`);
        return;
      }
      const profData = p as Record<string, unknown>;
      if (!profData.profile || typeof profData.profile !== 'object') {
        errors.push(`Perfil no índice ${index} não possui dados de perfil válidos.`);
      } else {
        const innerProfile = profData.profile as Record<string, unknown>;
        if (!innerProfile.id || !innerProfile.name) {
          errors.push(`Perfil no índice ${index} não possui "id" ou "name".`);
        }
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, backup: null, errors };
  }

  return { valid: true, backup: raw as WishLogBackup, errors: [] };
}

export function buildBackupPreview(
  backup: WishLogBackup,
  existingProfiles: Profile[]
): BackupImportPreview {
  const existingIds = new Set(existingProfiles.map((p) => p.id));
  const existingNames = new Set(existingProfiles.map((p) => p.name.toLowerCase()));
  const existingUids = new Set(existingProfiles.map((p) => p.uid).filter(Boolean));

  let totalWishes = 0;
  const warnings: string[] = [];

  const profileSummaries: ProfilePreviewSummary[] = backup.profiles.map((pData) => {
    const prof = pData.profile;
    const wishesCount = pData.wishes?.length ?? 0;
    totalWishes += wishesCount;

    const idExists = existingIds.has(prof.id);
    const nameExists = existingNames.has(prof.name.toLowerCase());
    const uidExists = prof.uid ? existingUids.has(prof.uid) : false;
    const alreadyExists = idExists || nameExists || uidExists;

    if (idExists) {
      warnings.push(`O perfil "${prof.name}" possui o mesmo ID de um perfil já cadastrado.`);
    } else if (nameExists) {
      warnings.push(`Já existe um perfil com o nome "${prof.name}".`);
    } else if (uidExists) {
      warnings.push(`Já existe um perfil com o UID "${prof.uid}".`);
    }

    return {
      profileId: prof.id,
      profileName: prof.name,
      uid: prof.uid ?? null,
      server: prof.server ?? null,
      adventureRank: prof.adventureRank ?? null,
      wishesCount,
      charactersCount: pData.characters?.length ?? 0,
      weaponsCount: pData.weapons?.length ?? 0,
      buildsCount: pData.builds?.length ?? 0,
      goalsCount: pData.goals?.length ?? 0,
      achievementsCount: pData.achievements?.length ?? 0,
      alreadyExists,
    };
  });

  return {
    valid: true,
    format: backup.metadata.format,
    schemaVersion: backup.metadata.schemaVersion,
    exportedAt: backup.metadata.exportedAt,
    profiles: profileSummaries,
    totalProfiles: backup.profiles.length,
    totalWishes,
    warnings,
    errors: [],
  };
}