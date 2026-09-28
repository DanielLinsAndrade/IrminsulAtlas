import type { CreateProfileInput, UpdateProfileInput } from './types';
import { PROFILE_LIMITS } from '../constants/limits';

export interface ProfileValidationErrors {
  name?: string;
  uid?: string;
  adventureRank?: string;
  worldLevel?: string;
}

export function validateProfileInput(
  input: CreateProfileInput | UpdateProfileInput,
  isCreate = true
): { isValid: boolean; errors: ProfileValidationErrors } {
  const errors: ProfileValidationErrors = {};

  if (isCreate || input.name !== undefined) {
    const trimmed = (input.name ?? '').trim();
    if (!trimmed) {
      errors.name = 'O nome do perfil é obrigatório.';
    } else if (trimmed.length > 50) {
      errors.name = 'O nome do perfil não pode exceder 50 caracteres.';
    }
  }

  if (input.uid !== undefined && input.uid !== null && input.uid.trim() !== '') {
    const trimmedUid = input.uid.trim();
    if (!PROFILE_LIMITS.UID_REGEX.test(trimmedUid)) {
      errors.uid = 'O UID deve conter entre 8 e 10 dígitos numéricos.';
    }
  }

  if (input.adventureRank !== undefined && input.adventureRank !== null) {
    const ar = input.adventureRank;
    if (
      isNaN(ar) ||
      ar < PROFILE_LIMITS.ADVENTURE_RANK.MIN ||
      ar > PROFILE_LIMITS.ADVENTURE_RANK.MAX ||
      !Number.isInteger(ar)
    ) {
      errors.adventureRank = `O Rank de Aventura (AR) deve ser um número inteiro entre ${PROFILE_LIMITS.ADVENTURE_RANK.MIN} e ${PROFILE_LIMITS.ADVENTURE_RANK.MAX}.`;
    }
  }

  if (input.worldLevel !== undefined && input.worldLevel !== null) {
    const wl = input.worldLevel;
    if (
      isNaN(wl) ||
      wl < PROFILE_LIMITS.WORLD_LEVEL.MIN ||
      wl > PROFILE_LIMITS.WORLD_LEVEL.MAX ||
      !Number.isInteger(wl)
    ) {
      errors.worldLevel = `O Nível de Mundo deve ser um número inteiro entre ${PROFILE_LIMITS.WORLD_LEVEL.MIN} e ${PROFILE_LIMITS.WORLD_LEVEL.MAX}.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
