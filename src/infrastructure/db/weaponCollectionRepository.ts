import { appSettingsRepository } from './appSettingsRepository';
import { validateBilletStock, validateCollectionTargets, type BilletStock, type WeaponCollectionTargets } from '../../domain/weapons/collection';
export const weaponCollectionRepository = {
  async getStock(profileId: string) {
    const raw = await appSettingsRepository.getSetting(`weapon_billet_stock:${profileId}`);
    return validateBilletStock(raw ? JSON.parse(raw) : null);
  },
  async saveStock(profileId: string, stock: BilletStock) {
    await appSettingsRepository.setSetting(`weapon_billet_stock:${profileId}`, JSON.stringify(validateBilletStock(stock)));
  },
  async getTargets(profileId: string) {
    const raw = await appSettingsRepository.getSetting(`weapon_collection_targets:${profileId}`);
    return validateCollectionTargets(raw ? JSON.parse(raw) : null);
  },
  async saveTargets(profileId: string, targets: WeaponCollectionTargets) {
    await appSettingsRepository.setSetting(`weapon_collection_targets:${profileId}`, JSON.stringify(validateCollectionTargets(targets)));
  },
};
