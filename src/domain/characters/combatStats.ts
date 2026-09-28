export const COMBAT_STATS = { hp: 'Vida / HP', atk: 'ATQ', def: 'DEF', elementalMastery: 'Proficiência Elemental', critRate: 'Taxa Crítica (%)', critDamage: 'Dano Crítico (%)', energyRecharge: 'Recarga de Energia (%)', elementalDamage: 'Bônus de Dano Elemental (%)' } as const;
export type CombatStats = Partial<Record<keyof typeof COMBAT_STATS, number>>;
export function validateCombatStats(value: unknown): CombatStats | null {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Atributos de combate inválidos.');
  const result: CombatStats = {};
  for (const [key, number] of Object.entries(value)) {
    if (!Object.prototype.hasOwnProperty.call(COMBAT_STATS, key) || typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number > 1e9) throw new Error('Atributo inválido: use valores numéricos não negativos.');
    result[key as keyof CombatStats] = number;
  }
  return Object.keys(result).length ? result : null;
}
