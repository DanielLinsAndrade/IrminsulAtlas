import type { CharacterBuildWithDetails, ArtifactSlotKey } from './types';
import type { CharacterData } from '../catalog';
export const TRACKED_SLOTS: ArtifactSlotKey[] = ['circlet', 'goblet', 'sands', 'plume', 'flower'];
export function hasUnfinishedArtifacts(build: Pick<CharacterBuildWithDetails, 'artifactSlots'>): boolean {
  return TRACKED_SLOTS.some(key => !build.artifactSlots[key]?.isEquipped || build.artifactSlots[key].level < 20);
}
export function groupBuildsByRelease(builds: CharacterBuildWithDetails[], catalog: CharacterData[]) {
  const versions = new Map(catalog.map(character => [character.id, character.releaseVersionId]));
  const groups = new Map<string, CharacterBuildWithDetails[]>();
  for (const build of [...builds].sort((a,b) => Number(versions.get(a.characterId) ?? Infinity) - Number(versions.get(b.characterId) ?? Infinity) || a.characterName.localeCompare(b.characterName))) {
    const version = versions.get(build.characterId);
    const group = version && /^\d+\.\d+$/.test(version) ? `${version.split('.')[0]}.X` : 'Versão não informada';
    groups.set(group, [...(groups.get(group) ?? []), build]);
  }
  return groups;
}
