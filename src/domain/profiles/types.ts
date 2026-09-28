export type GameServer = 'América' | 'Europa' | 'Ásia' | 'TW/HK/MO';

export type TravelerGender = 'lumine' | 'aether';

export interface Profile {
  id: string;
  name: string;
  uid: string | null;
  server: GameServer | string;
  adventureRank: number | null;
  worldLevel: number | null;
  travelerGender: TravelerGender | null;
  avatarCharacterId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}

export interface CreateProfileInput {
  name: string;
  uid?: string | null;
  server?: GameServer | string | null;
  adventureRank?: number | null;
  worldLevel?: number | null;
  travelerGender?: TravelerGender | null;
  avatarCharacterId?: string | null;
  notes?: string | null;
}

export interface UpdateProfileInput {
  name?: string;
  uid?: string | null;
  server?: GameServer | string | null;
  adventureRank?: number | null;
  worldLevel?: number | null;
  travelerGender?: TravelerGender | null;
  avatarCharacterId?: string | null;
  notes?: string | null;
}
