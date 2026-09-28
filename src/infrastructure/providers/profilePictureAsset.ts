import type { AssetRef } from '../../domain/catalog';
import type { PublicProfile } from './publicProfileProvider';
const TRAVELER_PICTURES: Record<string, string> = {
  '1': 'PlayerBoy', '2': 'PlayerGirl', '11': 'PlayerBoyCostumeCWXR', '21': 'PlayerGirlCostumeCWXR',
};
/** Exact bundled profile art; identity fallback remains the regular portrait provider. */
export function profilePictureAsset(profile: Partial<Pick<PublicProfile, 'profilePictureId' | 'profileCostumeId' | 'avatarId'>> | null): AssetRef | undefined {
  const costume = profile?.avatarId === '10000005' && profile.profileCostumeId === '200501' ? 'PlayerBoyCostumeCWXR' : profile?.avatarId === '10000007' && profile.profileCostumeId === '200701' ? 'PlayerGirlCostumeCWXR' : undefined;
  const name = TRAVELER_PICTURES[profile?.profilePictureId ?? ''] ?? costume;
  return name ? { uri: `/icons/profiles/UI_AvatarIcon_${name}_Circle.png`, source: 'bundled', isFallback: false } : undefined;
}
