import type { ArtifactSetData } from '../../../domain/catalog';
import { CatalogSelect } from '../../../components/CatalogSelect';

export function ArtifactSetSelect({ value, onChange, artifactSets, label = 'Conjunto de Artefatos' }: {
  value: string | null; onChange: (setId: string) => void; artifactSets: ArtifactSetData[]; label?: string;
}) {
  return <CatalogSelect value={value ?? ''} onChange={onChange} label={label} entityType="artifact" emptyLabel="Sem Conjunto Definido"
    options={[...artifactSets].sort((a, b) => Math.max(...b.rarities) - Math.max(...a.rarities) || a.namePtBr.localeCompare(b.namePtBr, 'pt-BR') || a.id.localeCompare(b.id)).map(set => ({ value: set.id, entityId: set.id, label: set.namePtBr, detail: set.rarities.join('–') + '★' }))}/>;
}
