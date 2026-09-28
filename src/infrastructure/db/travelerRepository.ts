import { travelerIdentity, isAvailableTraveler } from '../../domain/profiles/traveler';
import { profilesRepository } from './profilesRepository';
import { defaultGameDataProvider } from '../providers';

export async function requireProfileTraveler(profileId: string, characterId: string): Promise<void> {
  const identity = travelerIdentity(characterId);
  if (!identity) return;
  const profile = await profilesRepository.getProfileById(profileId);
  if (!profile) throw new Error('Perfil não encontrado.');
  if (!isAvailableTraveler(characterId, profile.travelerGender)) {
    throw new Error('Este protagonista não pertence ao perfil. Altere a escolha nas configurações.');
  }
}

export async function getProfileCharacters(profileId: string) {
  const [characters, profile] = await Promise.all([
    defaultGameDataProvider.getAllCharacters(), profilesRepository.getProfileById(profileId),
  ]);
  return characters.filter(character => isAvailableTraveler(character.id, profile?.travelerGender));
}
