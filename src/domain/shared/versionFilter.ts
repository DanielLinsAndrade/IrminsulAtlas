export function matchesVersion(version: string | null | undefined, filter: string): boolean {
  return filter === 'all' || (filter.endsWith('.X') ? version?.split('.')[0] === filter.split('.')[0] : version === filter);
}
export const MAJOR_VERSION_FILTERS = CATALOG_VERSION_SERIES;
import { CATALOG_VERSION_SERIES } from '../catalog/versions';
