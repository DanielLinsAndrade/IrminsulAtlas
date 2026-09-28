import { useState } from 'react';
import { AssetImage, ArtifactSlotIcon, Button, Modal, ModalBody } from '../../../components';
import type { CharacterBuildWithDetails } from '../../../domain/builds/types';
import type { CharacterData } from '../../../domain/catalog';
import { groupBuildsByRelease, hasUnfinishedArtifacts, TRACKED_SLOTS } from '../../../domain/builds/tracking';
import { normalizeSearch } from '../../../app/search/searchIndex';
import { charactersRepository } from '../../../infrastructure/db/charactersRepository';

export function BuildTrackingPanel({ kind, builds, catalog, profileId, onClose, onEdit }: { kind: 'artifacts' | 'constellations'; builds: CharacterBuildWithDetails[]; catalog: CharacterData[]; profileId: string; onClose: () => void; onEdit: (build: CharacterBuildWithDetails) => void }) {
  const [filter, setFilter] = useState('incomplete');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shown = builds.filter(build => normalizeSearch(build.characterName).includes(normalizeSearch(search)) && (kind === 'constellations' || filter === 'all' || (filter === 'farm' ? build.farmEnabled && build.farmStatus === 'active' : hasUnfinishedArtifacts(build))));
  async function update(characterId: string, value: number) {
    setBusy(true); setError('');
    try { await charactersRepository.setConstellation(profileId, characterId, value); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a constelação.'); }
    finally { setBusy(false); }
  }
  return <Modal isOpen title={kind === 'artifacts' ? 'Artefatos não finalizados' : 'Constelações por versão'} onClose={onClose} maxWidth="1050px"><ModalBody>
    <p className="ui-muted">Dados reais do perfil. {kind === 'constellations' ? 'Editar aqui atualiza a mesma constelação em Personagens e no Planejador.' : 'Clique no personagem para editar os slots da build.'}</p>
    {error && <p role="alert">{error}</p>}
    <div className="ui-toolbar"><input aria-label="Buscar personagem no painel" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar personagem…"/>{kind === 'artifacts' && <select aria-label="Filtrar artefatos" value={filter} onChange={e=>setFilter(e.target.value)}><option value="incomplete">Somente incompletos</option><option value="all">Todos</option><option value="farm">Farm ativo</option></select>}</div>
    {kind === 'artifacts' ? <div className="tracking-table-wrap"><table className="tracking-table"><thead><tr><th>Personagem</th>{TRACKED_SLOTS.map(key=><th key={key}><ArtifactSlotIcon slotKey={key} showLabel/></th>)}</tr></thead><tbody>{shown.map(build=><tr key={build.characterId}><th><Button variant="ghost" size="sm" onClick={()=>onEdit(build)}><AssetImage entityType="character" entityId={build.characterId} alt="" size={32}/>{build.characterName}</Button></th>{TRACKED_SLOTS.map(key=>{const slot=build.artifactSlots[key];return <td key={key} data-state={slot?.isEquipped && slot.level===20 ? 'complete' : slot?.isEquipped && slot.level>0 ? 'partial' : 'empty'}>{slot?.isEquipped ? `+${slot.level}` : '—'}</td>;})}</tr>)}</tbody></table></div> : [...groupBuildsByRelease(shown,catalog)].map(([version, entries])=><section key={version}><h3>Versão {version}</h3><div className="constellation-tracker-grid">{entries.map(build=><article key={build.characterId}><AssetImage entityType="character" entityId={build.characterId} alt={build.characterName} size={38}/><strong>{build.characterName}</strong><label>Constelação<select aria-label={`Constelação de ${build.characterName}`} disabled={busy} value={build.characterConstellation} onChange={e=>void update(build.characterId,Number(e.target.value))}>{Array.from({length:(catalog.find(c=>c.id===build.characterId)?.maxConstellation ?? 6)+1},(_,c)=><option key={c} value={c}>C{c}</option>)}</select></label></article>)}</div></section>)}
    {!shown.length && <p>Nenhum personagem corresponde ao filtro.</p>}
  </ModalBody></Modal>;
}
