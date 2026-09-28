import type { TravelerGender } from './types';

export function travelerIdentity(id: string): TravelerGender | null {
  const key = id.trim().toLowerCase().replace(/^(character_|char_)/, '');
  if (key === 'aether' || key === '10000005') return 'aether';
  if (key === 'lumine' || key === '10000007') return 'lumine';
  return null;
}

export function isAvailableTraveler(id: string, selected: TravelerGender | null | undefined): boolean {
  const traveler = travelerIdentity(id);
  return !traveler || !selected || traveler === selected;
}

export function validateBannerGoalTarget(type: string, id: string, name: string): void {
  if (type === 'character' && (travelerIdentity(id) || travelerIdentity(name))) {
    throw new Error('Aether e Lumine não estão disponíveis em banners e não podem ser metas de banner.');
  }
}
