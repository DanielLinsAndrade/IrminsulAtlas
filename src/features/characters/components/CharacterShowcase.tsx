import { useMemo, useState } from 'react';
import type { AccountCharacterWithDetails } from '../../../domain/characters/types';
import { useBuilds } from '../../builds/hooks/useBuilds';
import { useInventory } from '../../inventory/hooks/useInventory';
import { BuildCard } from '../../builds/components/BuildCard';
import { CharacterArt } from '../../../components/CharacterArt';
import { AssetImage, ElementIcon } from '../../../components';
import { BuildDetailModal } from '../../builds/components/BuildDetailModal';
import { calculateCharacterEvolution } from '../../../domain/progression/calculator';
import { CharacterProgressLine } from './CharacterProgressLine';

export function CharacterShowcase({ character }: { character: AccountCharacterWithDetails; onClose: () => void }) {
  const { builds, catalogArtifactSets, catalogWeapons, accountWeapons, saveFullBuild, isSaving, error } = useBuilds();
  const { inventory } = useInventory();
  const [editingBuild, setEditingBuild] = useState(false);
  const build = builds.find(b => b.characterId === character.characterId);
  const plan = useMemo(() => build ? calculateCharacterEvolution({ characterId: build.characterId, characterName: build.characterName, element: build.characterElement, rarity: build.characterRarity === 5 ? 5 : 4, iconUrl: build.characterIconUrl, farmEnabled: build.farmEnabled,
    levelGoal: { currentLevel: build.characterLevel, targetLevel: build.characterTargetLevel, currentAscension: build.characterAscension, targetAscension: build.characterTargetAscension },
    talentGoal: { currentNormalAttack: build.normalAttackLevel, targetNormalAttack: build.normalAttackTarget, currentElementalSkill: build.elementalSkillLevel, targetElementalSkill: build.elementalSkillTarget, currentElementalBurst: build.elementalBurstLevel, targetElementalBurst: build.elementalBurstTarget }
  }, new Map(inventory.map(m => [m.materialId,m.quantity]))) : null, [build, inventory]);
  return <section className="character-showcase" data-element={character.element}>
    <aside><CharacterArt characterId={character.characterId} name={character.namePtBr} context="character" presentation="integrated" className="character-showcase-art" /><div className="character-showcase-caption"><h2>{character.namePtBr}</h2><ElementIcon element={character.element} showLabel /><p>{character.rarity}★ · Nv. {character.level} · C{character.constellation}</p><CharacterProgressLine constellation={character.constellation} maxConstellation={character.maxConstellation} talents={build ? [build.normalAttackLevel, build.elementalSkillLevel, build.elementalBurstLevel] : undefined}/>{character.friendship != null && <p>Amizade {character.friendship}</p>}</div></aside>
    <div className="character-showcase-content"><h3>Visão Geral</h3>
      {error && <p role="alert">{error}</p>}
      {(build ? <BuildCard build={build} setNameMap={new Map(catalogArtifactSets.map(s => [s.id,s.namePtBr]))} onOpenDetails={() => setEditingBuild(true)} /> : <p>Nenhuma build cadastrada. Equipamento e atributos não informados.</p>)}
      {(plan ? <><h3>Estimativa do plano atual</h3><p>{plan.estimatedResin.toLocaleString('pt-BR')} resina · {Math.ceil(plan.estimatedDays)} dias estimados</p><small>Estimativas do motor de evolução existente; receitas específicas ainda dependem do mapeamento do personagem.</small><div className="character-showcase-materials">{plan.materials.filter(m => m.missing > 0).map(m => <div key={m.materialId}><AssetImage entityType="material" entityId={m.materialId} alt="" size={32} /><span>{m.namePtBr}<small>Tenho {m.have} · Preciso {m.need} · Faltam {m.missing}</small></span></div>)}</div></> : <p>Cadastre uma build para visualizar os materiais do plano.</p>)}
    </div>
    <BuildDetailModal isOpen={editingBuild} build={build ?? null} catalogArtifactSets={catalogArtifactSets} catalogWeapons={catalogWeapons} accountWeapons={accountWeapons} isSaving={isSaving} onClose={() => setEditingBuild(false)} onSave={async (...args) => { await saveFullBuild(...args); setEditingBuild(false); }} />
  </section>;
}
