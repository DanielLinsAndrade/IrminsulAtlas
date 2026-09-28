export const ARTIFACT_SUBSTATS = {
  hp: 'Vida', hpPercent: 'Vida %', atk: 'ATQ', atkPercent: 'ATQ %',
  def: 'DEF', defPercent: 'DEF %', elementalMastery: 'Proficiência Elemental',
  energyRecharge: 'Recarga de Energia %', critRate: 'Taxa Crítica %', critDamage: 'Dano Crítico %',
} as const;
export type ArtifactSubstat = keyof typeof ARTIFACT_SUBSTATS;
export type ArtifactSubstatValues = Partial<Record<ArtifactSubstat, number>>;

export function validateSubstatValues(types: ArtifactSubstat[], value: unknown): ArtifactSubstatValues {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Valores de subatributos inválidos.');
  for (const [key, number] of Object.entries(value)) {
    if (!types.includes(key as ArtifactSubstat) || typeof number !== 'number' || !Number.isFinite(number) || number < 0) {
      throw new Error('Informe valores numéricos não negativos para os subatributos selecionados.');
    }
  }
  return { ...value } as ArtifactSubstatValues;
}

// Reads existing type-only arrays without inventing numeric values for old builds.
export function decodeSubstats(json?: string) {
  const raw: unknown = JSON.parse(json || '[]');
  if (!Array.isArray(raw) && (!raw || typeof raw !== 'object' || !('types' in raw))) throw new Error('Subatributos armazenados em formato inválido.');
  const record = raw as { types?: unknown; values?: unknown };
  const substats = validateArtifactSubstats(Array.isArray(raw) ? raw : record?.types);
  return { substats, substatValues: validateSubstatValues(substats, Array.isArray(raw) ? undefined : record?.values) };
}

export function encodeSubstats(types: unknown, values?: unknown): string {
  const substats = validateArtifactSubstats(types);
  return JSON.stringify({ types: substats, values: validateSubstatValues(substats, values) });
}

export function formatSubstat(type: ArtifactSubstat, value?: number): string {
  const label = ARTIFACT_SUBSTATS[type];
  if (value === undefined) return label;
  return `${label.replace(' %', '')}: ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${label.endsWith('%') ? '%' : ''}`;
}

export function validateArtifactSubstats(value: unknown): ArtifactSubstat[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 4 || value.some(key => typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(ARTIFACT_SUBSTATS, key))) {
    throw new Error('Selecione até quatro subatributos válidos por artefato.');
  }
  if (new Set(value).size !== value.length) throw new Error('Um artefato não pode ter subatributos duplicados.');
  return value as ArtifactSubstat[];
}
