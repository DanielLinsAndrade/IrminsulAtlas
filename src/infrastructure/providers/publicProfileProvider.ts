import { invoke, isTauri } from '@tauri-apps/api/core';
import { appSettingsRepository } from '../db/appSettingsRepository';
import pictures from './enkaPictures.json';
import catalog from '../importers/datasets/defaultCatalog.json';
export interface PublicProfile { uid: string; nickname: string; signature: string; adventureRank: number; worldLevel: number; avatarId: string | null; achievements: number | null; syncedAt: string; expiresAt: number; profilePictureId?: string | null; profileCostumeId?: string | null; namecardId?: number | null; abyssFloor?: number | null; abyssChamber?: number | null; theaterAct?: number | null }
export function resolveProfilePicture(picture: { id?: unknown; avatarId?: unknown; costumeId?: unknown } | undefined): string | null {
  // ProfilePictureExcelConfigData: 11/21 are the CWXR costumes, not new avatars.
  // https://gitlab.com/Dimbreath/AnimeGameData/-/raw/master/ExcelBinOutput/ProfilePictureExcelConfigData.json
  const travelerPictures: Record<string, string> = { '1': '10000005', '11': '10000005', '2': '10000007', '21': '10000007' };
  const traveler = travelerPictures[String(picture?.id)];
  if (traveler) return traveler;
  // Compatibility explicitly supplied by the owner for their current picture;
  // upstream Enka pfps snapshot does not yet include 11800 (Odette).
  if (String(picture?.id) === '11800') return '10000150';
  const path = (pictures.pictures as Record<string, { iconPath?: string }>)[String(picture?.id)]?.iconPath;
  if (path) {
    const icon = path.replace(/_Circle$/, '');
    const match = catalog.characters.find(c => c.iconUrl?.includes(icon + '.png'));
    if (match?.sourceEntryId) return match.sourceEntryId;
  }
  return picture?.avatarId ? String(picture.avatarId) : null;
}
/** Never match missing external IDs: upcoming entries may also have a null ID. */
export function resolveProfileAvatar(avatarId: string | null | undefined): string | null {
  if (!avatarId) return null;
  const matches = catalog.characters.filter(character => character.sourceEntryId === avatarId);
  return matches.length === 1 ? matches[0].id : null;
}
export function normalizePublicProfile(uid: string, raw: unknown, now = Date.now()): PublicProfile {
  if (!raw || typeof raw !== 'object') throw new Error('Perfil público inválido.');
  const data = raw as { playerInfo?: Record<string, unknown>; ttl?: unknown };
  const info = data.playerInfo;
  if (!info || typeof info.nickname !== 'string' || !Number.isInteger(info.level) || Number(info.level) < 1 || Number(info.level) > 60 || !Number.isInteger(info.worldLevel) || Number(info.worldLevel) < 0 || Number(info.worldLevel) > 9) throw new Error('Dados públicos incompletos.');
  const picture = info.profilePicture as { id?: unknown; avatarId?: unknown; costumeId?: unknown } | undefined;
  const optionalNumber = (value: unknown) => Number.isInteger(value) ? Number(value) : null;
  const ttl = typeof data.ttl === 'number' && Number.isFinite(data.ttl) && data.ttl >= 0 ? data.ttl : 300;
  return { uid, nickname: info.nickname, signature: typeof info.signature === 'string' ? info.signature : '', adventureRank: Number(info.level), worldLevel: Number(info.worldLevel), avatarId: resolveProfilePicture(picture), profilePictureId: picture?.id ? String(picture.id) : null, profileCostumeId: picture?.costumeId ? String(picture.costumeId) : null, namecardId: optionalNumber(info.nameCardId ?? info.namecardId), abyssFloor: optionalNumber(info.towerFloorIndex), abyssChamber: optionalNumber(info.towerLevelIndex), theaterAct: optionalNumber(info.theaterActIndex), achievements: optionalNumber(info.finishAchievementNum), syncedAt: new Date(now).toISOString(), expiresAt: now + ttl * 1000 };
}
export async function getCachedPublicProfile(uid: string): Promise<PublicProfile | null> {
  const text = await appSettingsRepository.getSetting(`public_profile:${uid}`);
  if (!text) return null;
  const profile = JSON.parse(text) as PublicProfile;
  return { ...profile, avatarId: resolveProfilePicture({ id: profile.profilePictureId, avatarId: profile.avatarId }) };
}
const pending = new Map<string, Promise<{ profile: PublicProfile; stale: boolean }>>();
export function lookupPublicProfile(uid: string): Promise<{ profile: PublicProfile; stale: boolean }> {
  const existing = pending.get(uid);
  if (existing) return existing;
  const request = fetchPublicProfile(uid).finally(() => pending.delete(uid));
  pending.set(uid, request);
  return request;
}
async function fetchPublicProfile(uid: string): Promise<{ profile: PublicProfile; stale: boolean }> {
  if (!/^\d{9,10}$/.test(uid)) throw new Error('UID inválido: use 9 ou 10 dígitos.');
  const cached = await getCachedPublicProfile(uid);
  if (cached && cached.expiresAt > Date.now()) return { profile: cached, stale: false };
  try {
    let raw: unknown;
    if (isTauri()) raw = await invoke('fetch_public_profile', { uid });
    else { const response = await fetch(`https://enka.network/api/uid/${uid}?info`, { signal: AbortSignal.timeout(15000) }); if (!response.ok) throw new Error(`Enka HTTP ${response.status}`); raw = await response.json(); }
    const profile = normalizePublicProfile(uid, raw);
    await appSettingsRepository.setSetting(`public_profile:${uid}`, JSON.stringify(profile));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('wishlog-public-profile-changed'));
    return { profile, stale: false };
  } catch (cause) {
    if (cached) return { profile: cached, stale: true };
    throw new Error(cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : 'Consulta indisponível; mantenha os dados manuais.', { cause });
  }
}
