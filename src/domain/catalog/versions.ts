/** Versões suportadas pelo catálogo local (não um calendário de lançamentos). */
const LAST_MINOR_BY_MAJOR = [6, 8, 8, 8, 8, 7, 1] as const;

export const CATALOG_VERSIONS: readonly string[] = LAST_MINOR_BY_MAJOR.flatMap((last, index) =>
  Array.from({ length: last + 1 }, (_, minor) => `${index + 1}.${minor}`),
);
export const CATALOG_VERSION_SERIES = LAST_MINOR_BY_MAJOR.map((_, index) => `${index + 1}.X`);
