import { formatSubstat } from '../../../domain/builds/substats';
import type { CharacterBuildWithDetails } from '../../../domain/builds/types';
import { AssetImage, ArtifactSlotIcon, Badge, Button, ElementIcon, WeaponTypeIcon } from '../../../components';
import { ProgressMeter } from '../../../components/PageLayout';
import { useShell } from '../../../app/providers';
import { BuildStatusBadge } from './BuildStatusBadge';
import './BuildsView.css';
import { CharacterArt } from '../../../components/CharacterArt';

interface BuildCardProps {
  build: CharacterBuildWithDetails;
  onOpenDetails: (build: CharacterBuildWithDetails) => void;
  onToggleFarm?: (characterId: string) => Promise<void>;
  isSaving?: boolean;
  setNameMap?: Map<string, string>;
}
export function BuildCard({ build, onOpenDetails, onToggleFarm, isSaving = false, setNameMap }: BuildCardProps) {
  const { navigateTo } = useShell();
  return <article className="build-showcase" data-element={build.characterElement}>
    <div className="build-showcase-hero">
      <CharacterArt characterId={build.characterId} name={build.characterName} context="build" className="build-showcase-art" />
    </div>
    <div className="build-showcase-body">
      <div className="build-showcase-identity"><h3>{build.characterName}</h3><span className="ui-gold">{build.characterRarity}★ · C{build.characterConstellation}</span><ElementIcon element={build.characterElement} size={20} showLabel/><WeaponTypeIcon weaponType={build.characterWeaponType} size={18} showLabel/><p>Nv. {build.characterLevel} / {build.characterTargetLevel}</p><BuildStatusBadge status={build.status}/><Badge variant={build.farmEnabled ? 'success' : 'default'} size="sm">{build.farmEnabled ? `Farm: ${build.farmStatus === 'active' ? 'Ativo' : build.farmStatus === 'paused' ? 'Pausado' : 'Concluído'}` : 'Fora do Farm'}</Badge></div>
      <div className="build-equipment-row"><section><h4>Arma</h4>{build.weaponId ? <div className="build-equipped"><AssetImage entityType="weapon" entityId={build.weaponId} alt={build.weaponName ?? 'Arma'} size={48}/><div><strong>{build.weaponName}</strong><small>Nv. {build.weaponLevel} · R{build.weaponRefinement}</small></div></div> : <p className="ui-muted">Não equipada</p>}</section><section><h4>Talentos</h4><div className="build-talent-values"><span title="Ataque normal">ATQ<strong>{build.normalAttackLevel}</strong></span><span title="Habilidade elemental">Hab.<strong>{build.elementalSkillLevel}</strong></span><span title="Supremo">Sup.<strong>{build.elementalBurstLevel}</strong></span></div></section></div>
      <section><h4>Artefatos</h4><div className="build-artifact-strip">{Object.values(build.artifactSlots).map(slot => <div key={slot.slotKey} title={slot.setId ? setNameMap?.get(slot.setId) ?? 'Conjunto de artefatos' : 'Não equipado'}><ArtifactSlotIcon slotKey={slot.slotKey} size={18}/>{slot.setId ? <AssetImage entityType="artifact" entityId={slot.setId} alt={setNameMap?.get(slot.setId) ?? 'Artefato'} size={38}/> : <span className="ui-muted">—</span>}<small>{slot.isEquipped ? `+${slot.level}` : 'Vazio'}</small>{slot.isEquipped && <small>{slot.mainStat || 'Atributo não informado'}</small>}{slot.substats?.map(stat => <small key={stat} className="artifact-substat">{formatSubstat(stat, slot.substatValues?.[stat])}</small>)}</div>)}</div></section>
      <div className="build-progress-label"><span>Progresso da Build</span><strong>{build.indicators.progressPercent}%</strong></div><ProgressMeter value={build.indicators.progressPercent} label={`Progresso da build de ${build.characterName}`}/>
      {build.plannedWeaponId && <div className="build-equipped"><AssetImage entityType="weapon" entityId={build.plannedWeaponId} alt={build.plannedWeaponName ?? 'Arma planejada'} size={36}/><div><small>Alvo planejado · sem afirmar posse</small><strong>{build.plannedWeaponName}</strong></div></div>}
      <div className="build-actions"><Button size="sm" onClick={() => navigateTo('farm', { id: build.characterId, query: build.characterName })}>Plano de Farm</Button><Button size="sm" variant="secondary" onClick={() => onOpenDetails(build)}>Editar Build</Button></div>
      {onToggleFarm && <Button size="sm" variant="ghost" disabled={isSaving} onClick={() => void onToggleFarm(build.characterId).catch(console.error)}>{build.farmEnabled ? 'Retirar da fila de Farm' : 'Adicionar à fila de Farm'}</Button>}
    </div>
  </article>;
}
