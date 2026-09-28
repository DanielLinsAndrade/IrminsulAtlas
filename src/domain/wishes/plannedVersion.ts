export const CURRENT_PLANNING_VERSION = '7.0';

/** Future plans accept new major series, but only minors .0 through .8. */
export function validatePlannedVersion(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (!/^[1-9]\d*\.[0-8]$/.test(value) || !Number.isSafeInteger(Number(value.split('.')[0]))) {
    throw new Error('Versão prevista inválida. Use X.0 até X.8, com ponto e sem espaços (ex.: 7.8 ou 8.0).');
  }
  const [major, minor] = value.split('.').map(Number);
  const [currentMajor, currentMinor] = CURRENT_PLANNING_VERSION.split('.').map(Number);
  if (major < currentMajor || (major === currentMajor && minor <= currentMinor)) {
    throw new Error(`A versão prevista deve ser posterior à versão atual (${CURRENT_PLANNING_VERSION}).`);
  }
  return value;
}
