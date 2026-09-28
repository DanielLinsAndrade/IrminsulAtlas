import React, { useMemo, useState } from 'react';
import { AssetImage, Badge, Button, Modal, VisionIcon, WeaponTypeIcon } from '../../../components';
import type { CharacterBuildWithDetails } from '../../../domain/builds/types';
import type { CharacterEvolutionCalculation, MaterialProgressItem } from '../../../domain/progression/types';
import { UI_ASSETS } from '../../../infrastructure/providers';

interface FarmCharacterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterBuild: CharacterBuildWithDetails | null;
  calculation: CharacterEvolutionCalculation | null;
}

interface MaterialGroup {
  id: string;
  title: string;
  icon?: string;
  materials: MaterialProgressItem[];
}

export const FarmCharacterDetailModal: React.FC<FarmCharacterDetailModalProps> = ({
  isOpen,
  onClose,
  characterBuild,
  calculation,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'missing'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const is5Star = characterBuild?.characterRarity === 5;

  // Agrupamento estruturado no estilo Genshin Center
  const materialGroups = useMemo<MaterialGroup[]>(() => {
    if (!calculation) return [];

    const all = calculation.materials;
    const filtered = filterMode === 'missing' ? all.filter((m) => m.missing > 0) : all;

    const groups: MaterialGroup[] = [];

    // 1. Mora & Experiência
    const moraExp = filtered.filter(
      (m) =>
        m.category === 'currency' ||
        m.category === 'other' ||
        m.materialId.includes('mora') ||
        m.materialId.includes('wit') ||
        m.materialId.includes('exp')
    );
    if (moraExp.length > 0) {
      groups.push({
        id: 'mora_exp',
        title: 'Mora & Experiência',
        materials: moraExp,
      });
    }

    // 2. Gemas Elementais
    const gems = filtered.filter(
      (m) =>
        m.category === 'character_ascension' &&
        (m.gameKey.includes('sliver') ||
          m.gameKey.includes('fragment') ||
          m.gameKey.includes('chunk') ||
          m.gameKey.includes('gemstone') ||
          m.namePtBr.includes('Lasca') ||
          m.namePtBr.includes('Fragmento') ||
          m.namePtBr.includes('Pedaço') ||
          m.namePtBr.includes('Gema'))
    );
    if (gems.length > 0) {
      groups.push({
        id: 'gems',
        title: 'Gemas Elementais',
        materials: gems,
      });
    }

    // 3. Chefe de Campo (Boss Material)
    const bossDrops = filtered.filter(
      (m) =>
        (m.category === 'boss' || m.category === 'character_ascension') &&
        !gems.includes(m) &&
        m.rarity === 4
    );
    if (bossDrops.length > 0) {
      groups.push({
        id: 'boss_drops',
        title: 'Chefe de Campo (Ascensão)',
        materials: bossDrops,
      });
    }

    // 4. Especialidade Local
    const specialties = filtered.filter((m) => m.category === 'local_specialty');
    if (specialties.length > 0) {
      groups.push({
        id: 'local_specialties',
        title: 'Especialidades Locais',
        materials: specialties,
      });
    }

    // 5. Livros de Talento
    const talentBooks = filtered.filter(
      (m) =>
        m.category === 'talent' &&
        (m.namePtBr.includes('Ensinamentos') ||
          m.namePtBr.includes('Guia') ||
          m.namePtBr.includes('Filosofia') ||
          m.gameKey.includes('teachings') ||
          m.gameKey.includes('guide') ||
          m.gameKey.includes('philosophies'))
    );
    if (talentBooks.length > 0) {
      groups.push({
        id: 'talent_books',
        title: 'Livros de Talento',
        materials: talentBooks,
      });
    }

    // 6. Chefe Semanal (Weekly Boss)
    const weeklyBoss = filtered.filter(
      (m) =>
        m.category === 'boss' &&
        m.rarity === 5 &&
        !gems.includes(m)
    );
    if (weeklyBoss.length > 0) {
      groups.push({
        id: 'weekly_boss',
        title: 'Chefe Semanal',
        materials: weeklyBoss,
      });
    }

    // 7. Coroas da Sabedoria
    const crowns = filtered.filter(
      (m) =>
        m.materialId === 'material_crown_of_insight' ||
        m.namePtBr.includes('Coroa') ||
        m.gameKey.includes('crown')
    );
    if (crowns.length > 0) {
      groups.push({
        id: 'crowns',
        title: 'Coroas da Sabedoria',
        materials: crowns,
      });
    }

    // 8. Drops Comuns
    const commonDrops = filtered.filter((m) => m.category === 'common');
    if (commonDrops.length > 0) {
      groups.push({
        id: 'common_drops',
        title: 'Drops de Inimigos Comuns',
        materials: commonDrops,
      });
    }

    // 9. Materiais de Arma
    const weaponMats = filtered.filter((m) => m.category === 'weapon_ascension');
    if (weaponMats.length > 0) {
      groups.push({
        id: 'weapon_materials',
        title: 'Materiais da Arma',
        materials: weaponMats,
      });
    }

    // Outros itens que não entraram nos grupos acima
    const allocated = new Set(groups.flatMap((g) => g.materials.map((m) => m.materialId)));
    const remaining = filtered.filter((m) => !allocated.has(m.materialId));
    if (remaining.length > 0) {
      groups.push({
        id: 'others',
        title: 'Outros Materiais',
        materials: remaining,
      });
    }

    return groups;
  }, [calculation, filterMode]);

  // Contagem geral de concluídos vs totais
  const { totalItems, completedItems, pendingItems } = useMemo(() => {
    if (!calculation) return { totalItems: 0, completedItems: 0, pendingItems: 0 };
    let completed = 0;
    let pending = 0;
    for (const m of calculation.materials) {
      if (m.missing <= 0) completed++;
      else pending++;
    }
    return {
      totalItems: calculation.materials.length,
      completedItems: completed,
      pendingItems: pending,
    };
  }, [calculation]);

  if (!characterBuild || !calculation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Planejamento de Materiais —</span>
          <span style={{ color: '#38bdf8' }}>{characterBuild.characterName}</span>
        </div>
      }
      maxWidth="780px"
    >
      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
        {/* 1. Header com Foto, Nome, Elemento, Metas e Arma */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Lado Esquerdo: Avatar e Metas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                position: 'relative',
                width: '64px',
                height: '64px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: 'rgba(15, 23, 42, 0.9)',
                border: `2px solid ${is5Star ? '#fbbf24' : '#c084fc'}`,
                flexShrink: 0,
              }}
            >
              <AssetImage
                entityType="character"
                entityId={characterBuild.characterId}
                alt={characterBuild.characterName}
                size={64}
                shape="square"
              />
              <div style={{ position: 'absolute', top: 2, left: 2 }}>
                <VisionIcon element={characterBuild.characterElement} characterId={characterBuild.characterId} size={18} />
              </div>
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {characterBuild.characterName}
                </h3>
                <span style={{ color: is5Star ? '#fbbf24' : '#c084fc', fontSize: '13px' }}>
                  {'★'.repeat(characterBuild.characterRarity)}
                </span>
                <Badge variant="success" size="sm">
                  {characterBuild.characterConstellation > 0 ? `C${characterBuild.characterConstellation}` : 'C0'}
                </Badge>
              </div>

              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>
                  Nível: <strong style={{ color: '#f1f5f9' }}>{characterBuild.characterLevel}</strong> →{' '}
                  <strong style={{ color: '#38bdf8' }}>{characterBuild.characterTargetLevel}</strong>
                </span>
                <span>•</span>
                <span>
                  Talentos:{' '}
                  <strong style={{ color: '#f1f5f9' }}>
                    {characterBuild.normalAttackLevel}/{characterBuild.elementalSkillLevel}/{characterBuild.elementalBurstLevel}
                  </strong>{' '}
                  →{' '}
                  <strong style={{ color: '#38bdf8' }}>
                    {characterBuild.normalAttackTarget}/{characterBuild.elementalSkillTarget}/{characterBuild.elementalBurstTarget}
                  </strong>
                </span>
              </div>

              {characterBuild.weaponName && (
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <WeaponTypeIcon weaponType={characterBuild.characterWeaponType} size={12} />
                  <span>
                    Arma: <strong>{characterBuild.weaponName}</strong> (Nv. {characterBuild.weaponLevel ?? 1} → {characterBuild.weaponTargetLevel})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Resumo de Resina, Dias e Custo Total */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Resina Estimada */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <img src={UI_ASSETS.items.fragileResin} alt="Resina" style={{ width: '28px', height: '28px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Resina Restante</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#c084fc' }}>
                ~{calculation.estimatedResin.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Dias Estimados */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Dias Estimados</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>
                ~{calculation.estimatedDays} dias
              </div>
            </div>
          </div>

          {/* Progresso de Materiais */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7Z M3 7l9 5 9-5 M12 12v10"/></svg>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Materiais</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: pendingItems === 0 ? '#34d399' : '#fbbf24' }}>
                {completedItems} / {totalItems} prontos
              </div>
            </div>
          </div>

          {/* Mora Total */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <img src={UI_ASSETS.items.mora} alt="Mora" style={{ width: '28px', height: '28px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Mora Total</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24' }}>
                {(
                  calculation.characterLevelUpCost.mora +
                  calculation.talentMoraCost +
                  (calculation.weaponLevelUpCost?.mora ?? 0)
                ).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Controles: Filtro (Todos vs Faltantes) e Modo (Grade vs Tabela) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '10px',
          }}
        >
          {/* Toggle Filtro */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterMode === 'all' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                background: filterMode === 'all' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                color: filterMode === 'all' ? '#38bdf8' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Todos os Materiais ({totalItems})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('missing')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterMode === 'missing' ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                background: filterMode === 'missing' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                color: filterMode === 'missing' ? '#fbbf24' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Apenas Faltantes ({pendingItems})
            </button>
          </div>

          {/* Toggle Modo Grade / Tabela */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'grid' ? '#38bdf8' : 'transparent',
                color: viewMode === 'grid' ? '#0f172a' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>▦</span> Grade
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? '#38bdf8' : 'transparent',
                color: viewMode === 'table' ? '#0f172a' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>☰</span> Tabela
            </button>
          </div>
        </div>

        {/* 4. Lista de Seções Agrupadas */}
        {materialGroups.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: '#34d399',
              background: 'rgba(52, 211, 153, 0.08)',
              borderRadius: '10px',
              border: '1px dashed rgba(52, 211, 153, 0.3)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/></svg>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Todos os materiais coletados!</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Você já possui todas as quantidades necessárias para atingir as metas configuradas.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {materialGroups.map((group) => (
              <section key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {group.title}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>({group.materials.length})</span>
                </div>

                {viewMode === 'grid' ? (
                  /* MODO GRADE */
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {group.materials.map((mat) => {
                      const isComplete = mat.missing <= 0;
                      const pct = mat.need > 0 ? Math.min(100, Math.round((mat.have / mat.need) * 100)) : 100;
                      const statusColor = isComplete ? '#34d399' : mat.have > 0 ? '#fbbf24' : '#f87171';

                      return (
                        <div
                          key={mat.materialId}
                          style={{
                            background: 'rgba(26, 32, 48, 0.75)',
                            border: `1px solid ${isComplete ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '6px',
                                background: 'rgba(15, 23, 42, 0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <AssetImage
                                alt={mat.namePtBr}
                                entityType="material"
                                entityId={mat.materialId}
                                size={34}
                                style={{ width: '34px', height: '34px', objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#f8fafc',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={mat.namePtBr}
                              >
                                {mat.namePtBr}
                              </div>
                              <div style={{ fontSize: '11px', color: statusColor, fontWeight: 600, marginTop: '2px' }}>
                                {isComplete ? '✓ Concluído' : `Falta: ${mat.missing.toLocaleString('pt-BR')}`}
                              </div>
                            </div>
                          </div>

                          {/* Barra de Progresso */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                              <span>Tenho: <strong style={{ color: '#f1f5f9' }}>{mat.have.toLocaleString('pt-BR')}</strong></span>
                              <span>Preciso: <strong style={{ color: '#cbd5e1' }}>{mat.need.toLocaleString('pt-BR')}</strong></span>
                            </div>
                            <div
                              style={{
                                height: '5px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  background: isComplete ? '#34d399' : '#fbbf24',
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* MODO TABELA */
                  <div
                    style={{
                      overflowX: 'auto',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(15, 23, 42, 0.5)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                          <th style={{ padding: '8px 12px' }}>Material</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tenho</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Preciso</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Falta</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', width: '100px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.materials.map((mat) => {
                          const isComplete = mat.missing <= 0;
                          return (
                            <tr
                              key={mat.materialId}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AssetImage
                                  alt={mat.namePtBr}
                                  entityType="material"
                                  entityId={mat.materialId}
                                  size={24}
                                  style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                />
                                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{mat.namePtBr}</span>
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f1f5f9', fontWeight: 600 }}>
                                {mat.have.toLocaleString('pt-BR')}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#cbd5e1' }}>
                                {mat.need.toLocaleString('pt-BR')}
                              </td>
                              <td
                                style={{
                                  padding: '8px 12px',
                                  textAlign: 'right',
                                  color: isComplete ? '#34d399' : '#fbbf24',
                                  fontWeight: 700,
                                }}
                              >
                                {mat.missing > 0 ? mat.missing.toLocaleString('pt-BR') : '0'}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: isComplete ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                                    color: isComplete ? '#34d399' : '#fbbf24',
                                  }}
                                >
                                  {isComplete ? 'Pronto' : `${Math.round((mat.have / mat.need) * 100)}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
};
