import { travelerIdentity, isAvailableTraveler } from '../profiles/traveler';
import type { ProfileBackupData } from './types';

export function sanitizeTravelerBackup(data: ProfileBackupData): ProfileBackupData {
  if (data.profile.travelerGender != null && !['aether','lumine'].includes(data.profile.travelerGender)) throw new Error('Protagonista inválido no backup.');
  if (data.travelerArchive !== undefined && !Array.isArray(data.travelerArchive)) throw new Error('Arquivo de protagonistas inválido no backup.');
  const identities = new Set([...(data.characters ?? []).map(c => travelerIdentity(c.characterId)), ...(data.builds ?? []).map(b => travelerIdentity(b.characterId))].filter(Boolean));
  const gender = data.profile.travelerGender ?? (identities.size === 1 ? [...identities][0]! : null);
  const allowed = (id: string) => !travelerIdentity(id) || (gender !== null && isAvailableTraveler(id, gender));
  const characters = (data.characters ?? []).filter(c => !allowed(c.characterId));
  const builds = (data.builds ?? []).filter(b => !allowed(b.characterId));
  const weapons = (data.weapons ?? []).filter(w => w.equippedCharacterId && !allowed(w.equippedCharacterId));
  const goals = (data.goals ?? []).filter(g => g.targetType === 'character' && (travelerIdentity(g.targetId) || travelerIdentity(g.targetName)));
  const travelerArchive = [...(data.travelerArchive ?? [])];
  if (characters.length || builds.length || weapons.length || goals.length) travelerArchive.push({ archivedAt: new Date().toISOString(), source: 'backup-import', characters, builds, weapons, goals });
  return {
    ...data, travelerArchive,
    profile: { ...data.profile, travelerGender: gender, avatarCharacterId: data.profile.avatarCharacterId && !allowed(data.profile.avatarCharacterId) ? null : data.profile.avatarCharacterId },
    characters: (data.characters ?? []).filter(c => allowed(c.characterId)),
    builds: (data.builds ?? []).filter(b => allowed(b.characterId)),
    weapons: (data.weapons ?? []).map(w => weapons.includes(w) ? { ...w, equippedCharacterId: null } : w),
    goals: (data.goals ?? []).filter(g => !goals.includes(g)),
  };
}
