import { isAvailableTraveler } from '../../domain/profiles/traveler';
import { getDatabase } from './client';
import { appSettingsRepository } from './appSettingsRepository';
import type { ProfileRow } from './types';
import type { CreateProfileInput, Profile, UpdateProfileInput } from '../../domain/profiles';

function mapRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    uid: row.uid,
    server: row.server ?? 'América',
    adventureRank: row.adventure_rank,
    worldLevel: row.world_level,
    travelerGender: (row.traveler_gender as Profile['travelerGender']) ?? null,
    avatarCharacterId: row.avatar_character_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at,
  };
}

export class ProfilesRepository {
  public async getAllProfiles(): Promise<Profile[]> {
    const db = await getDatabase();
    const rows = await db.select<ProfileRow[]>(
      'SELECT * FROM profiles ORDER BY last_opened_at DESC, updated_at DESC'
    );
    return rows.map(mapRowToProfile);
  }

  public async getProfileById(id: string): Promise<Profile | null> {
    const db = await getDatabase();
    const rows = await db.select<ProfileRow[]>(
      'SELECT * FROM profiles WHERE id = $1',
      [id]
    );
    if (rows.length === 0) return null;
    return mapRowToProfile(rows[0]);
  }

  public async createProfile(input: CreateProfileInput): Promise<Profile> {
    const db = await getDatabase();
    const existing = await this.getAllProfiles();

    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `prof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const now = new Date().toISOString();
    const profile: Profile = {
      id,
      name: input.name.trim(),
      uid: input.uid?.trim() || null,
      server: input.server?.trim() || 'América',
      adventureRank: input.adventureRank ?? null,
      worldLevel: input.worldLevel ?? null,
      travelerGender: input.travelerGender ?? null,
      avatarCharacterId: input.avatarCharacterId || null,
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };

    await db.execute(
      `INSERT INTO profiles (
        id, name, uid, server, adventure_rank, world_level,
        traveler_gender, avatar_character_id, notes, created_at, updated_at, last_opened_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        profile.id,
        profile.name,
        profile.uid,
        profile.server,
        profile.adventureRank,
        profile.worldLevel,
        profile.travelerGender,
        profile.avatarCharacterId,
        profile.notes,
        profile.createdAt,
        profile.updatedAt,
        profile.lastOpenedAt,
      ]
    );

    // Se for o primeiro perfil (ou não houver ativo registrado), torna-o ativo automaticamente
    const currentActiveId = await this.getActiveProfileId();
    if (existing.length === 0 || !currentActiveId) {
      await this.setActiveProfileId(profile.id);
    }

    return profile;
  }

  public async updateProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
    const existing = await this.getProfileById(id);
    if (!existing) {
      throw new Error(`Perfil com ID "${id}" não foi encontrado.`);
    }

    const db = await getDatabase();
    const now = new Date().toISOString();

    const updated: Profile = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      uid: input.uid !== undefined ? (input.uid?.trim() || null) : existing.uid,
      server: input.server !== undefined ? (input.server?.trim() || 'América') : existing.server,
      adventureRank: input.adventureRank !== undefined ? input.adventureRank : existing.adventureRank,
      worldLevel: input.worldLevel !== undefined ? input.worldLevel : existing.worldLevel,
      travelerGender: input.travelerGender !== undefined ? input.travelerGender : existing.travelerGender,
      avatarCharacterId: input.avatarCharacterId !== undefined ? (input.avatarCharacterId || null) : existing.avatarCharacterId,
      notes: input.notes !== undefined ? (input.notes?.trim() || null) : existing.notes,
      updatedAt: now,
    };

    if (updated.avatarCharacterId && !isAvailableTraveler(updated.avatarCharacterId, updated.travelerGender)) updated.avatarCharacterId = updated.travelerGender ? 'character_' + updated.travelerGender : null;

    await db.execute(
      `UPDATE profiles SET
        name = $1, uid = $2, server = $3, adventure_rank = $4,
        world_level = $5, traveler_gender = $6, avatar_character_id = $7,
        notes = $8, updated_at = $9
      WHERE id = $10`,
      [
        updated.name,
        updated.uid,
        updated.server,
        updated.adventureRank,
        updated.worldLevel,
        updated.travelerGender,
        updated.avatarCharacterId,
        updated.notes,
        updated.updatedAt,
        id,
      ]
    );

    return updated;
  }

  public async touchProfileLastOpened(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.execute('UPDATE profiles SET last_opened_at = $1 WHERE id = $2', [now, id]);
  }

  public async deleteProfile(id: string): Promise<boolean> {
    const db = await getDatabase();
    const res = await db.execute('DELETE FROM profiles WHERE id = $1', [id]);

    const activeId = await this.getActiveProfileId();
    if (activeId === id) {
      const remaining = await this.getAllProfiles();
      if (remaining.length > 0) {
        await this.setActiveProfileId(remaining[0].id);
      } else {
        await appSettingsRepository.deleteSetting('active_profile_id');
      }
    }

    return res.rowsAffected > 0;
  }

  public async getActiveProfileId(): Promise<string | null> {
    return appSettingsRepository.getSetting('active_profile_id');
  }

  public async setActiveProfileId(id: string): Promise<void> {
    await appSettingsRepository.setSetting('active_profile_id', id);
    await this.touchProfileLastOpened(id);
  }

  public async getActiveProfile(): Promise<Profile | null> {
    const profiles = await this.getAllProfiles();
    if (profiles.length === 0) {
      return null;
    }

    const activeId = await this.getActiveProfileId();
    if (activeId) {
      const found = profiles.find((p) => p.id === activeId);
      if (found) {
        return found;
      }
    }

    // Se não havia active_profile_id ou apontava para perfil deletado, seleciona o primeiro
    const fallback = profiles[0];
    await this.setActiveProfileId(fallback.id);
    return fallback;
  }
}

export const profilesRepository = new ProfilesRepository();
