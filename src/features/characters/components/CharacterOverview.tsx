import { formatSubstat } from '../../../domain/builds/substats';
import { CharacterProgressLine } from './CharacterProgressLine';
import { useMemo } from 'react';
import { COMBAT_STATS } from '../../../domain/characters/combatStats';
import { AssetImage, ArtifactSlotIcon, Button, ElementIcon, WeaponTypeIcon } from '../../../components';
import { ProgressMeter } from '../../../components/PageLayout';
import type { AccountCharacterWithDetails } from '../../../domain/characters/types';
import type { CharacterBuildWithDetails } from '../../../domain/builds/types';
import { calculateCharacterEvolution } from '../../../domain/progression/calculator';
import { BuildStatusBadge } from '../../builds/components/BuildStatusBadge';
import { useInventory } from '../../inventory/hooks/useInventory';
import { CharacterArt } from '../../../components/CharacterArt';

export function CharacterOverview({ character, build, onEdit, onFarm }: { character: AccountCharacterWithDetails; build?: CharacterBuildWithDetails; onEdit: () => void; onFarm: () => void }) {
  const { inventory, error } = useInventory();
  const calculation = useMemo(() => build ? calculateCharacterEvolution({
    characterId: character.characterId, characterName: character.namePtBr, element: character.element, rarity: character.rarity, iconUrl: character.iconUrl, farmEnabled: build.farmEnabled,
    levelGoal: { currentLevel: character.level, currentAscension: character.ascension, targetLevel: build.characterTargetLevel, targetAscension: build.characterTargetAscension },
    talentGoal: { currentNormalAttack: build.normalAttackLevel, targetNormalAttack: build.normalAttackTarget, currentElementalSkill: build.elementalSkillLevel, targetElementalSkill: build.elementalSkillTarget, currentElementalBurst: build.elementalBurstLevel, targetElementalBurst: build.elementalBurstTarget },
  }, new Map(inventory.map(item => [item.materialId, item.quantity]))) : null, [character, build, inventory]);
  return <section className="character-overview ui-panel" data-element={character.element} aria-label={`Detalhes de ${character.namePtBr}`}>
    <div className="character-overview-identity">
      <CharacterArt characterId={character.characterId} name={character.namePtBr} context="character" presentation="integrated" className="character-overview-art" />
      <h2>{character.namePtBr}</h2><span className="ui-gold">{character.rarity}★ · C{character.constellation}</span>
      <div className="character-meta"><ElementIcon element={character.element} showLabel size={20}/><WeaponTypeIcon weaponType={character.weaponType} showLabel size={20}/></div>
      {character.region && <p className="ui-muted">{character.region}</p>}
      <p>Nível {character.level} / 90 · Ascensão {character.ascension}</p>
      {character.supportsFriendship && character.friendship != null && <p>Amizade {character.friendship}</p>}
      <Button onClick={onEdit}>Editar personagem</Button>
    </div>
    <div className="character-overview-content">
      <h3 className="character-overview-label">Visão Geral</h3><header className="character-overview-heading"><ElementIcon element={character.element} size={32}/><div><h2>{character.namePtBr}</h2><span>{character.rarity}★ · Nível {character.level} · C{character.constellation}</span></div></header>
      <CharacterProgressLine constellation={character.constellation} maxConstellation={character.maxConstellation} talents={build ? [build.normalAttackLevel, build.elementalSkillLevel, build.elementalBurstLevel] : undefined}/>
      <div className="character-overview-sections" aria-label="Visão Geral">
        {character.combatStats && <section className="character-recorded-stats"><h3>Atributos de combate</h3><dl>{Object.entries(character.combatStats).map(([key, value]) => <div key={key}><dt>{COMBAT_STATS[key as keyof typeof COMBAT_STATS]}</dt><dd>{value?.toLocaleString('pt-BR')}</dd></div>)}</dl><small>Valores cadastrados manualmente.</small></section>}
        { <section className="character-recorded-stats"><h3>Informações do personagem</h3><dl><div><dt>Nível</dt><dd>{character.level} / {build?.characterTargetLevel ?? 90}</dd></div><div><dt>Ascensão</dt><dd>{character.ascension} / 6</dd></div><div><dt>Constelação</dt><dd>C{character.constellation}</dd></div><div><dt>Amizade</dt><dd>{character.supportsFriendship ? character.friendship ?? 'Não informada' : 'Não se aplica'}</dd></div></dl><small>Atributos de combate não cadastrados não são estimados.</small></section>}
        {build && <><div className="character-weapon">{build.weaponId && <AssetImage entityType="weapon" entityId={build.weaponId} alt={build.weaponName ?? 'Arma'} size={64} />}<div><h3>{build.weaponName ?? 'Arma não equipada'}</h3><p>Nv. {build.weaponLevel ?? '—'} · R{build.weaponRefinement ?? '—'}</p></div></div><div className="character-artifacts">{Object.values(build.artifactSlots).map(slot => <article key={slot.slotKey} className="ui-panel"><ArtifactSlotIcon slotKey={slot.slotKey} showLabel />{slot.setId && <AssetImage entityType="artifact" entityId={slot.setId} alt="Artefato equipado" size={44} />}<strong>{slot.isEquipped ? `+${slot.level}` : 'Vazio'}</strong><small>{slot.mainStat || 'Atributo não informado'}</small>{slot.substats?.map(stat => <small key={stat}>{formatSubstat(stat, slot.substatValues?.[stat])}</small>)}{slot.notes && <small>{slot.notes}</small>}</article>)}</div></>}
        { <><h3>Progresso da build</h3>{build ? <><BuildStatusBadge status={build.status}/><p className="ui-muted">{build.statusReason}</p><ProgressMeter value={build.indicators.progressPercent} label="Progresso da build"/><p>{build.indicators.progressPercent}% · {build.indicators.equippedArtifactsCount} / 5 artefatos equipados</p><p>Meta de nível: {build.characterTargetLevel}</p></> : <p>Nenhuma build registrada.</p>}{character.notes && <p className="ui-muted">{character.notes}</p>}</>}
      </div>
    </div>
    <aside className="character-farm-summary">{error && <p role="alert">{error}</p>}<h3>Recursos e Farming</h3><p className="ui-muted">Custos de personagem e talentos, deduzindo o inventário atual.</p>{calculation && <><p>Resina estimada: <strong>{calculation.estimatedResin}</strong></p><p>Dias estimados: <strong>{calculation.estimatedDays}</strong></p><div className="character-materials">{calculation.materials.filter(m => m.missing > 0).slice(0, 4).map(m => <article key={m.materialId}><AssetImage entityType="material" entityId={m.materialId} alt={m.namePtBr} size={32}/><div><strong>{m.namePtBr}</strong><small>Faltam {m.missing}</small></div></article>)}</div></>}<Button variant="secondary" onClick={onFarm}>Ver plano de Farm</Button></aside>
  </section>;
}
