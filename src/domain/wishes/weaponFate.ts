import type { BannerType } from './types';
export const WEAPON_FATE_LABELS = {
  none: 'Sem garantia', current_1: 'Pontos do Destino 1/2', current_2: 'Pontos do Destino 2/2',
  legacy_1: 'Pontos do Destino 1/3 · legado', legacy_2: 'Pontos do Destino 2/3 · legado', legacy_3: 'Pontos do Destino 3/3 · legado',
} as const;
export type WeaponFateState = keyof typeof WEAPON_FATE_LABELS;
export type WeaponPathResult = 'won' | 'lost' | 'guaranteed';
export const WEAPON_PATH_LABELS = { won: 'Caminho vencido', lost: 'Caminho perdido', guaranteed: 'Arma escolhida garantida' } as const;
export function validateWeaponPath(banner: BannerType, result: unknown): asserts result is WeaponPathResult | null | undefined {
  if (result == null) return;
  if (banner !== 'weapon' || typeof result !== 'string' || !Object.prototype.hasOwnProperty.call(WEAPON_PATH_LABELS, result)) throw new Error('Resultado do Caminho Divino inválido para este banner.');
}
export function validateWeaponFate(banner: BannerType, state: unknown): asserts state is WeaponFateState | null | undefined {
  if (state == null) return;
  if (banner !== 'weapon' || typeof state !== 'string' || !Object.prototype.hasOwnProperty.call(WEAPON_FATE_LABELS, state)) throw new Error('Pontos do Destino inválidos para este banner.');
}
