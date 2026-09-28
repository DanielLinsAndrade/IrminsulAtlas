import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShell } from '../../../app/providers';
import { AssetImage, Button } from '../../../components';
import { MetricCard, PageHero, ProgressMeter } from '../../../components/PageLayout';
import './FarmView.css';
import type { Rarity } from '../../../domain/catalog';
import {
  aggregateEvolutionPlans,
  calculateCharacterEvolution,
} from '../../../domain/progression/calculator';
import { reorderFarmQueue } from '../../../domain/progression/farmQueue';
import type {
  CharacterEvolutionCalculation,
  CharacterEvolutionPlanInput,
} from '../../../domain/progression/types';
import { useBuilds } from '../../builds/hooks/useBuilds';
import { useInventory } from '../../inventory/hooks/useInventory';
import { FarmCharacterDetailModal } from './FarmCharacterDetailModal';

export const FarmView: React.FC = () => {
  const { navigateTo, navigationTarget } = useShell();
  const {
    builds,
    isLoading: buildsLoading,
    isSaving,
    error: buildError,
    actionError,
    toggleFarmEnabled,
    updateFarmStatus,
    reorderFarmPriorities,
  } = useBuilds();
  const { inventory, isLoading: invLoading, error: inventoryError } = useInventory();

  // Estados locais de filtro e seleção
  const [characterFilter, setCharacterFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>('all');
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [onlyMissingMaterials, setOnlyMissingMaterials] = useState<boolean>(false);
  const [selectedCharForDetail, setSelectedCharForDetail] = useState<string | null>(navigationTarget?.route === 'farm' ? navigationTarget.id : null);

  // Estados do Drag-and-Drop com Pointer Events (100% livre de HTML5 Drag & Drop)
  const [draggedCharId, setDraggedCharId] = useState<string | null>(null);
  const [sourceIndex, setSourceIndex] = useState<number>(-1);
  const [targetIndex, setTargetIndex] = useState<number>(-1);

  const pointerIdRef = useRef<number | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Mapa de inventário (materialId -> quantidade)
  const inventoryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.materialId, item.quantity);
    }
    return map;
  }, [inventory]);

  // Personagens marcados para farm
  const farmCharacters = useMemo(() => {
    const list = builds.filter((b) => b.farmEnabled);
    // Ordena por farmPriority crescente
    return [...list].sort((a, b) => (a.farmPriority ?? 0) - (b.farmPriority ?? 0));
  }, [builds]);

  // Personagens filtrados para exibição
  const filteredFarmCharacters = useMemo(() => {
    if (characterFilter === 'all') return farmCharacters;
    return farmCharacters.filter((b) => (b.farmStatus ?? 'active') === characterFilter);
  }, [farmCharacters, characterFilter]);

  // Cálculos de evolução por personagem
  const characterCalculations = useMemo(() => {
    const map = new Map<string, CharacterEvolutionCalculation>();
    for (const b of farmCharacters) {
      const planInput: CharacterEvolutionPlanInput = {
        characterId: b.characterId,
        characterName: b.characterName,
        element: b.characterElement,
        rarity: (b.characterRarity === 5 ? 5 : 4) as 4 | 5,
        iconUrl: b.characterIconUrl,
        farmEnabled: b.farmStatus === 'active', // só consome resina se ativo
        levelGoal: {
          currentLevel: b.characterLevel,
          targetLevel: b.characterTargetLevel,
          currentAscension: b.characterAscension,
          targetAscension: b.characterTargetAscension,
        },
        talentGoal: {
          currentNormalAttack: b.normalAttackLevel,
          targetNormalAttack: b.normalAttackTarget,
          currentElementalSkill: b.elementalSkillLevel,
          targetElementalSkill: b.elementalSkillTarget,
          currentElementalBurst: b.elementalBurstLevel,
          targetElementalBurst: b.elementalBurstTarget,
        },
        weaponGoal: b.weaponId
          ? {
              weaponId: b.weaponId,
              weaponName: b.weaponName ?? 'Arma',
              rarity: (b.weaponRarity ?? 4) as Rarity,
              weaponType: b.characterWeaponType,
              iconUrl: b.weaponIconUrl ?? null,
              currentLevel: b.weaponLevel ?? 1,
              targetLevel: b.weaponTargetLevel,
              currentAscension: 0,
              targetAscension: b.weaponTargetAscension,
            }
          : null,
      };

      const calc = calculateCharacterEvolution(planInput, inventoryMap);
      map.set(b.characterId, calc);
    }
    return map;
  }, [farmCharacters, inventoryMap]);

  // Resumo consolidado de evolução e materiais de todos os personagens ativos
  const aggregatedSummary = useMemo(() => {
    const activeCalculations = Array.from(characterCalculations.values()).filter(
      (c) => c.farmEnabled
    );
    return aggregateEvolutionPlans(activeCalculations, inventoryMap);
  }, [characterCalculations, inventoryMap]);

  // Contagem de materiais pendentes e Mora faltante
  const { totalMissingMaterialsCount, totalMissingMora } = useMemo(() => {
    let missingCount = 0;
    let missingMora = 0;
    for (const mat of aggregatedSummary.materials) {
      if (mat.missing > 0) {
        missingCount++;
        if (mat.materialId === 'material_mora' || mat.gameKey === 'mora') {
          missingMora += mat.missing;
        }
      }
    }
    return {
      totalMissingMaterialsCount: missingCount,
      totalMissingMora: missingMora,
    };
  }, [aggregatedSummary]);

  // Filtro de materiais consolidados
  const filteredMaterials = useMemo(() => {
    return aggregatedSummary.materials.filter((mat) => {
      if (onlyMissingMaterials && mat.missing <= 0) return false;
      if (materialCategoryFilter !== 'all' && mat.category !== materialCategoryFilter) return false;
      if (materialSearch.trim()) {
        const q = materialSearch.toLowerCase().trim();
        return mat.namePtBr.toLowerCase().includes(q) || mat.gameKey.toLowerCase().includes(q);
      }
      return true;
    });
  }, [aggregatedSummary, onlyMissingMaterials, materialCategoryFilter, materialSearch]);

  // Cleanup absoluto de estado de drag (Pointer Events)
  const cleanupDragState = useCallback(() => {
    if (pointerIdRef.current !== null && activeElementRef.current) {
      try {
        if (activeElementRef.current.hasPointerCapture(pointerIdRef.current)) {
          activeElementRef.current.releasePointerCapture(pointerIdRef.current);
        }
      } catch {
        // Ignora caso pointer ja tenha sido liberado pelo browser
      }
    }
    pointerIdRef.current = null;
    activeElementRef.current = null;
    setDraggedCharId(null);
    setSourceIndex(-1);
    setTargetIndex(-1);
  }, []);

  // Controla cursor e selecao do documento enquanto o drag estiver ativo
  useEffect(() => {
    if (draggedCharId !== null) {
      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      return () => {
        document.body.style.userSelect = prevUserSelect;
        document.body.style.cursor = prevCursor;
      };
    }
  }, [draggedCharId]);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    charId: string,
    idx: number
  ) => {
    // Apenas botão primário (esquerdo)
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const targetEl = e.currentTarget;
    const pointerId = e.pointerId;

    try {
      targetEl.setPointerCapture(pointerId);
    } catch {
      // Ignora erro caso capture falhe
    }

    pointerIdRef.current = pointerId;
    activeElementRef.current = targetEl;

    setDraggedCharId(charId);
    setSourceIndex(idx);
    setTargetIndex(idx);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerIdRef.current === null || draggedCharId === null) return;
    if (e.pointerId !== pointerIdRef.current) return;

    const pointerY = e.clientY;

    // 1. Auto-scroll suave se aproximar das bordas da janela
    const scrollThreshold = 80;
    const viewportHeight = window.innerHeight;
    if (pointerY < scrollThreshold) {
      window.scrollBy({ top: -12, behavior: 'auto' });
    } else if (pointerY > viewportHeight - scrollThreshold) {
      window.scrollBy({ top: 12, behavior: 'auto' });
    }

    // 2. Determinar o targetIndex pela proximidade com o centro de cada card
    let closestIndex = sourceIndex;
    let closestDistance = Infinity;

    for (let i = 0; i < filteredFarmCharacters.length; i++) {
      const char = filteredFarmCharacters[i];
      const el = itemRefs.current.get(char.characterId);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const distance = Math.abs(pointerY - midY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    if (closestIndex !== targetIndex && closestIndex >= 0 && closestIndex < filteredFarmCharacters.length) {
      setTargetIndex(closestIndex);
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (pointerIdRef.current === null || e.pointerId !== pointerIdRef.current) {
      cleanupDragState();
      return;
    }

    const currentSource = sourceIndex;
    const currentTarget = targetIndex;
    const currentCharId = draggedCharId;

    cleanupDragState();

    if (
      currentCharId &&
      currentSource !== -1 &&
      currentTarget !== -1 &&
      currentSource !== currentTarget
    ) {
      const allIds = farmCharacters.map((c) => c.characterId);
      const sourceChar = filteredFarmCharacters[currentSource];
      const targetChar = filteredFarmCharacters[currentTarget];
      if (sourceChar && targetChar) {
        const fromCanonical = allIds.indexOf(sourceChar.characterId);
        const toCanonical = allIds.indexOf(targetChar.characterId);
        if (fromCanonical !== -1 && toCanonical !== -1 && fromCanonical !== toCanonical) {
          const newOrderIds = reorderFarmQueue(allIds, fromCanonical, toCanonical);
          try {
            await reorderFarmPriorities(newOrderIds);
          } catch (err) {
            console.error('[Irminsul Atlas Farm] Erro ao persistir nova ordem:', err);
          }
        }
      }
    }
  };

  const handlePointerCancel = () => {
    cleanupDragState();
  };

  // Limpeza global em Escape, window blur ou desmontagem
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupDragState();
      }
    };
    const handleBlur = () => {
      cleanupDragState();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      cleanupDragState();
    };
  }, [cleanupDragState]);

  // Setas usam a mesma funcao de dominio pura reorderFarmQueue
  const handleMoveUp = async (charId: string) => {
    const allIds = farmCharacters.map((c) => c.characterId);
    const index = allIds.indexOf(charId);
    if (index <= 0) return;
    const newOrderIds = reorderFarmQueue(allIds, index, index - 1);
    await reorderFarmPriorities(newOrderIds);
  };

  const handleMoveDown = async (charId: string) => {
    const allIds = farmCharacters.map((c) => c.characterId);
    const index = allIds.indexOf(charId);
    if (index < 0 || index >= allIds.length - 1) return;
    const newOrderIds = reorderFarmQueue(allIds, index, index + 1);
    await reorderFarmPriorities(newOrderIds);
  };

  // Personagem e cálculo selecionados para o modal de detalhes
  const selectedBuild = useMemo(() => {
    if (!selectedCharForDetail) return null;
    return farmCharacters.find((c) => c.characterId === selectedCharForDetail) ?? null;
  }, [farmCharacters, selectedCharForDetail]);

  const selectedCalc = useMemo(() => {
    if (!selectedCharForDetail) return null;
    return characterCalculations.get(selectedCharForDetail) ?? null;
  }, [characterCalculations, selectedCharForDetail]);

  const isLoading = buildsLoading || invLoading;

  if (isLoading && farmCharacters.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Carregando fila de farm e consolidação de recursos...</p>
      </div>
    );
  }

  return <div className="ui-page farm-view">
    <PageHero title="Fila de Farm & Materiais" subtitle="Organize suas prioridades e transforme os materiais do inventário em progresso." actions={<Button onClick={() => navigateTo('builds')}>Adicionar à fila</Button>}/>
    {(buildError || actionError || inventoryError) && <p role="alert">{buildError || actionError || inventoryError}</p>}
    <div className="metric-grid"><MetricCard label="Personagens no Farm" value={farmCharacters.length}/><MetricCard label="Materiais pendentes" value={totalMissingMaterialsCount} hint="Tipos de material faltantes" tone="gold"/><MetricCard label="Mora faltante" value={totalMissingMora.toLocaleString('pt-BR')} tone="gold"/><MetricCard label="Resina estimada" value={aggregatedSummary.totalEstimatedResin.toLocaleString('pt-BR')} tone="cyan"/><MetricCard label="Dias estimados" value={aggregatedSummary.totalEstimatedDays} hint="Fila ativa · ritmo do calculador" tone="green"/></div>
    <section className="ui-panel">
      <div className="ui-panel-heading"><div><h2>Fila de Prioridade</h2><p className="ui-muted">Arraste pela alça ou use as setas para definir a ordem.</p></div><div className="view-toggle" role="group" aria-label="Status do Farm">{(['all','active','paused','completed'] as const).map(status => <button type="button" key={status} aria-pressed={characterFilter === status} onClick={() => setCharacterFilter(status)}>{({all:'Todos',active:'Ativos',paused:'Pausados',completed:'Concluídos'})[status]} ({status === 'all' ? farmCharacters.length : farmCharacters.filter(c => c.farmStatus === status).length})</button>)}</div></div>
      <div className="ui-table-scroll"><div role="table" aria-label="Fila de farm" className="farm-queue-table">
        <div className="farm-queue-row farm-queue-head" role="row">{['Prioridade','Personagem','Nível atual → meta','Talentos atual → meta','Materiais principais','Resina / Dias','Status','Ações'].map(label => <div role="columnheader" key={label}>{label}</div>)}</div>
        <div ref={containerRef} role="rowgroup">{filteredFarmCharacters.map((charBuild, filteredIdx) => {
          const canonicalIndex = farmCharacters.findIndex(c => c.characterId === charBuild.characterId);
          const calc = characterCalculations.get(charBuild.characterId);
          const isDragging = draggedCharId === charBuild.characterId;
          const isTargetSlot = targetIndex === filteredIdx && sourceIndex !== -1 && sourceIndex !== filteredIdx;
          return <div key={charBuild.characterId} ref={el => { if (el) itemRefs.current.set(charBuild.characterId, el); else itemRefs.current.delete(charBuild.characterId); }} role="row" className="farm-queue-row farm-queue-card" data-dragging={isDragging} data-target={isTargetSlot ? (targetIndex < sourceIndex ? 'before' : 'after') : undefined}>
            <div role="cell" className="farm-priority"><div className="farm-drag-handle" onPointerDown={e => { if (!isSaving) handlePointerDown(e, charBuild.characterId, filteredIdx); }} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onLostPointerCapture={handlePointerCancel} aria-label="Arrastar para reordenar" title="Arrastar para reordenar"><svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true">{[3,9,15].map(y => <React.Fragment key={y}><circle cx="3" cy={y} r="1.5"/><circle cx="9" cy={y} r="1.5"/></React.Fragment>)}</svg></div><span>{canonicalIndex + 1}</span><div className="farm-arrows"><button type="button" disabled={isSaving || canonicalIndex <= 0} aria-label={`Mover ${charBuild.characterName} para cima`} onClick={() => void handleMoveUp(charBuild.characterId).catch(console.error)}>↑</button><button type="button" disabled={isSaving || canonicalIndex >= farmCharacters.length - 1} aria-label={`Mover ${charBuild.characterName} para baixo`} onClick={() => void handleMoveDown(charBuild.characterId).catch(console.error)}>↓</button></div></div>
            <div role="cell" className="farm-character"><AssetImage entityType="character" entityId={charBuild.characterId} alt={charBuild.characterName} size={42}/><div><strong>{charBuild.characterName}</strong><small className="ui-gold">{charBuild.characterRarity}★</small></div></div>
            <div role="cell">{charBuild.characterLevel} → {charBuild.characterTargetLevel}<ProgressMeter value={charBuild.characterLevel / Math.max(1,charBuild.characterTargetLevel) * 100} label={`Nível de ${charBuild.characterName}`}/></div>
            <div role="cell" className="farm-talents"><span>ATQ {charBuild.normalAttackLevel} → {charBuild.normalAttackTarget}</span><span>Hab. {charBuild.elementalSkillLevel} → {charBuild.elementalSkillTarget}</span><span>Sup. {charBuild.elementalBurstLevel} → {charBuild.elementalBurstTarget}</span></div>
            <div role="cell" className="farm-material-preview">{calc?.materials.filter(m => m.missing > 0).slice(0,3).map(m => <div key={m.materialId} title={`${m.namePtBr}: ${m.have} / ${m.need}`}><AssetImage entityType="material" entityId={m.materialId} alt={m.namePtBr} size={28}/><small>{m.missing}</small></div>)}</div>
            <div role="cell">{calc?.estimatedResin ?? 0}<small>{calc?.estimatedDays ?? 0} dias</small></div>
            <div role="cell"><select aria-label={`Status de farm de ${charBuild.characterName}`} disabled={isSaving} value={charBuild.farmStatus ?? 'active'} onChange={e => void updateFarmStatus(charBuild.characterId, e.target.value as 'active'|'paused'|'completed').catch(console.error)}><option value="active">Ativo</option><option value="paused">Pausado</option><option value="completed">Concluído</option></select></div>
            <div role="cell" className="farm-row-actions"><Button size="sm" variant="secondary" onClick={() => setSelectedCharForDetail(charBuild.characterId)}>Ver Materiais</Button><Button size="sm" variant="ghost" disabled={isSaving} onClick={() => void toggleFarmEnabled(charBuild.characterId).catch(console.error)}>Remover</Button></div>
          </div>;
        })}</div>
      </div></div>
      {!filteredFarmCharacters.length && <p className="ui-muted">Nenhum personagem nesta seleção. Adicione personagens à fila pela tela de Builds.</p>}
      <div className="farm-queue-summary"><strong>Resumo da fila ativa</strong><span>{aggregatedSummary.activeFarmCharactersCount} personagens</span><span>{totalMissingMaterialsCount} materiais pendentes</span><span>{aggregatedSummary.totalEstimatedResin.toLocaleString('pt-BR')} resinas</span><span>{aggregatedSummary.totalEstimatedDays} dias estimados</span></div>
    </section>
    <section className="ui-panel"><div className="ui-panel-heading"><h2>Demanda Consolidada de Materiais</h2><small className="ui-muted">Estoque deduzido uma única vez na fila ativa.</small></div>
      <div className="ui-toolbar"><input aria-label="Buscar material de farm" placeholder="Buscar material…" value={materialSearch} onChange={e => setMaterialSearch(e.target.value)}/><select aria-label="Categoria de material de farm" value={materialCategoryFilter} onChange={e => setMaterialCategoryFilter(e.target.value)}><option value="all">Todas as categorias</option>{[...new Set(aggregatedSummary.materials.map(m => m.category))].map(category => <option key={category} value={category}>{({currency:'Mora e EXP',talent:'Talentos',character_ascension:'Ascensão',weapon_ascension:'Armas',boss:'Chefes',common:'Inimigos',local_specialty:'Especialidades',other:'Outros'})[category]}</option>)}</select><label><input type="checkbox" checked={onlyMissingMaterials} onChange={e => setOnlyMissingMaterials(e.target.checked)}/> Apenas faltantes</label></div>
      <div className="farm-material-grid">{filteredMaterials.map(m => <article key={m.materialId}><div className="farm-character"><AssetImage entityType="material" entityId={m.materialId} alt={m.namePtBr} size={40}/><strong>{m.namePtBr}</strong></div><p>Tenho {m.have.toLocaleString('pt-BR')} / Preciso {m.need.toLocaleString('pt-BR')}</p><ProgressMeter value={m.need > 0 ? m.have / m.need * 100 : 100} label={m.namePtBr}/><small>{m.missing > 0 ? `Faltam ${m.missing.toLocaleString('pt-BR')}` : 'Completo'}</small></article>)}</div>
    </section>
    <FarmCharacterDetailModal isOpen={Boolean(selectedCharForDetail)} onClose={() => setSelectedCharForDetail(null)} characterBuild={selectedBuild} calculation={selectedCalc}/>
  </div>;
};
