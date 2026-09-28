import React, { useMemo, useState } from 'react';
import type { CharacterBuildWithDetails } from '../../../domain/builds/types';
import { calculateCharacterEvolution } from '../../../domain/progression/calculator';
import type { CharacterEvolutionPlanInput, MaterialProgressItem } from '../../../domain/progression/types';
import { AssetImage, Badge, Button } from '../../../components';
import { UI_ASSETS } from '../../../infrastructure/providers';

interface EvolutionPlanPanelProps {
  build: CharacterBuildWithDetails;
  onToggleFarm?: (characterId: string) => Promise<void>;
  isSaving?: boolean;
  compact?: boolean;
}

const RARITY_COLORS: Record<number, { border: string; bg: string; text: string }> = {
  1: { border: 'rgba(148, 163, 184, 0.35)', bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8' },
  2: { border: 'rgba(42, 165, 100, 0.35)', bg: 'rgba(42, 165, 100, 0.15)', text: '#34d399' },
  3: { border: 'rgba(56, 189, 248, 0.35)', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' },
  4: { border: 'rgba(192, 132, 252, 0.35)', bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc' },
  5: { border: 'rgba(251, 191, 36, 0.35)', bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
};

function getSpecialMaterialIcon(materialId: string): string | null {
  if (materialId === 'material_mora') return UI_ASSETS.items.mora;
  if (materialId === 'material_heros_wit') return UI_ASSETS.items.heroWit;
  if (materialId === 'material_mystic_ore') return UI_ASSETS.items.mysticOre;
  return null;
}

const CATEGORY_DEFINITIONS = [
  {
    id: 'currency',
    title: 'Mora & EXP',
    match: (m: MaterialProgressItem) =>
      m.category === 'currency' ||
      m.materialId === 'material_heros_wit' ||
      m.materialId === 'material_mora' ||
      m.materialId === 'material_mystic_ore',
  },
  {
    id: 'character_ascension',
    title: 'Gemas Elementais',
    match: (m: MaterialProgressItem) => m.category === 'character_ascension',
  },
  {
    id: 'boss',
    title: 'Chefe de Mundo & Semanal',
    match: (m: MaterialProgressItem) => m.category === 'boss',
  },
  {
    id: 'local_specialty',
    title: 'Especialidades Locais',
    match: (m: MaterialProgressItem) => m.category === 'local_specialty',
  },
  {
    id: 'talent',
    title: 'Livros de Talentos & Coroa',
    match: (m: MaterialProgressItem) => m.category === 'talent',
  },
  {
    id: 'weapon_ascension',
    title: 'Materiais de Ascensão de Arma',
    match: (m: MaterialProgressItem) => m.category === 'weapon_ascension',
  },
  {
    id: 'common',
    title: 'Drops Comuns de Monstros',
    match: (m: MaterialProgressItem) => m.category === 'common',
  },
  {
    id: 'other',
    title: 'Outros Materiais',
    match: (m: MaterialProgressItem) =>
      m.category === 'other' && m.materialId !== 'material_heros_wit',
  },
];

export const EvolutionPlanPanel: React.FC<EvolutionPlanPanelProps> = ({
  build,
  onToggleFarm,
  isSaving = false,
  compact = false,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'missing'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const calculation = useMemo(() => {
    const input: CharacterEvolutionPlanInput = {
      characterId: build.characterId,
      characterName: build.characterName,
      element: build.characterElement,
      rarity: build.characterRarity === 5 ? 5 : 4,
      iconUrl: build.characterIconUrl,
      farmEnabled: build.farmEnabled,
      levelGoal: {
        currentLevel: build.characterLevel,
        targetLevel: build.characterTargetLevel,
        currentAscension: build.characterAscension,
        targetAscension: build.characterTargetAscension ?? 6,
      },
      talentGoal: {
        currentNormalAttack: build.normalAttackLevel,
        targetNormalAttack: build.normalAttackTarget,
        currentElementalSkill: build.elementalSkillLevel,
        targetElementalSkill: build.elementalSkillTarget,
        currentElementalBurst: build.elementalBurstLevel,
        targetElementalBurst: build.elementalBurstTarget,
      },
      weaponGoal: build.weaponName
        ? {
            weaponId: build.accountWeaponId || 'wep',
            weaponName: build.weaponName,
            rarity: (build.weaponRarity as 1 | 2 | 3 | 4 | 5) || 4,
            weaponType: build.characterWeaponType,
            iconUrl: build.weaponIconUrl,
            currentLevel: build.weaponLevel ?? 1,
            targetLevel: build.weaponTargetLevel,
            currentAscension: 0,
            targetAscension: build.weaponTargetAscension ?? 6,
          }
        : null,
    };

    return calculateCharacterEvolution(input);
  }, [build]);

  const missingMaterials = useMemo(
    () => calculation.materials.filter((m: MaterialProgressItem) => m.missing > 0),
    [calculation.materials]
  );

  const categorizedGroups = useMemo(() => {
    const visibleMaterials =
      filterMode === 'missing'
        ? calculation.materials.filter((m: MaterialProgressItem) => m.missing > 0)
        : calculation.materials;

    return CATEGORY_DEFINITIONS.map((cat) => ({
      id: cat.id,
      title: cat.title,
      items: visibleMaterials.filter(cat.match),
    })).filter((group) => group.items.length > 0);
  }, [calculation.materials, filterMode]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: compact ? '12px' : '16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Cabeçalho: Status de Farm & Resina/Tempo Estimado */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Plano de Evolução & Farm
          </span>
          <Badge variant={build.farmEnabled ? 'success' : 'default'} size="sm">
            {build.farmEnabled ? 'Farm Ativo' : 'Farm Pausado'}
          </Badge>
          {onToggleFarm && (
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => void onToggleFarm(build.characterId)}
              style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }}
            >
              {build.farmEnabled ? 'Pausar Farm' : 'Ativar Farm'}
            </Button>
          )}
        </div>

        {/* Resina & Dias Estimados */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <img
              src={UI_ASSETS.items.condensedResin}
              alt="Resina"
              style={{ width: '16px', height: '16px', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Resina:</span>
            <strong style={{ fontSize: '13px', color: '#38bdf8' }}>
              {calculation.estimatedResin.toLocaleString()}
            </strong>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tempo:</span>
            <strong style={{ fontSize: '13px', color: '#fbbf24' }}>
              ~{calculation.estimatedDays} dias
            </strong>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(180/dia)</span>
          </div>
        </div>
      </div>

      {/* Metas Resumidas: Nível e Talentos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Nível: </span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {build.characterLevel} → {build.characterTargetLevel}
          </strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Talentos: </span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {build.normalAttackLevel} / {build.elementalSkillLevel} / {build.elementalBurstLevel} →{' '}
            {build.normalAttackTarget} / {build.elementalSkillTarget} / {build.elementalBurstTarget}
          </strong>
        </div>
        {build.weaponName && (
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Arma: </span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {build.weaponLevel ?? 1} → {build.weaponTargetLevel}
            </strong>
          </div>
        )}
      </div>

      {/* Seção "O que falta?": Visualização Rápida no Topo (Estilo Genshin Center / Irminsul Atlas) */}
      {missingMaterials.length > 0 ? (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>O que falta para completar a meta:</span>
            <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>
              ({missingMaterials.length} {missingMaterials.length === 1 ? 'item' : 'itens'})
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {missingMaterials.map((mat: MaterialProgressItem) => {
              const specialIcon = getSpecialMaterialIcon(mat.materialId);
              const rarity = mat.rarity ?? 3;
              const colors = RARITY_COLORS[rarity] || RARITY_COLORS[3];
              return (
                <div
                  key={`quick-missing-${mat.materialId}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    flexShrink: 0,
                  }}
                  title={`${mat.namePtBr}: Faltam ${mat.missing.toLocaleString()}`}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {specialIcon ? (
                      <img
                        src={specialIcon}
                        alt={mat.namePtBr}
                        style={{ width: '26px', height: '26px', objectFit: 'contain' }}
                      />
                    ) : (
                      <AssetImage
                        entityType="material"
                        entityId={mat.materialId}
                        alt={mat.namePtBr}
                        size={28}
                        shape="square"
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>
                    {mat.missing > 999999
                      ? `${(mat.missing / 1000000).toFixed(1)}M`
                      : mat.missing > 999
                      ? `${(mat.missing / 1000).toFixed(1)}k`
                      : mat.missing}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '10px 12px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#34d399',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>✓</span>
          <span>Todos os materiais para as metas atuais já foram obtidos ou metas atingidas!</span>
        </div>
      )}

      {/* Barra de Controles: Filtros e Modo de Visualização */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '8px',
        }}
      >
        {/* Filtro: Todos vs Apenas Faltantes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: filterMode === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: filterMode === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: filterMode === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Todos ({calculation.materials.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('missing')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: filterMode === 'missing' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              background: filterMode === 'missing' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: filterMode === 'missing' ? '#f87171' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Faltantes ({missingMaterials.length})
          </button>
        </div>

        {/* Alternador: Grade de Cartões vs Tabela */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: viewMode === 'grid' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Grade
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: viewMode === 'table' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Tabela
          </button>
        </div>
      </div>

      {/* Conteúdo: Blocos de Categorias com Cartões ou Tabela */}
      <div
        style={{
          maxHeight: compact ? '260px' : '420px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          paddingRight: '4px',
        }}
      >
        {categorizedGroups.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            Nenhum material correspondente ao filtro selecionado.
          </div>
        ) : (
          categorizedGroups.map((group) => (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Título da Categoria */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                  paddingBottom: '4px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {group.title}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {/* Modo Grade de Cartões (Estilo Genshin Center) */}
              {viewMode === 'grid' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: compact
                      ? 'repeat(auto-fill, minmax(115px, 1fr))'
                      : 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {group.items.map((mat: MaterialProgressItem) => {
                    const isMissing = mat.missing > 0;
                    const rarity = mat.rarity ?? 3;
                    const colors = RARITY_COLORS[rarity] || RARITY_COLORS[3];
                    const daysText =
                      mat.domainDays && mat.domainDays.length > 0
                        ? mat.domainDays.join('/')
                        : null;
                    const specialIcon = getSpecialMaterialIcon(mat.materialId);

                    return (
                      <div
                        key={mat.materialId}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(15, 23, 42, 0.55)',
                          border: `1px solid ${isMissing ? colors.border : 'rgba(16, 185, 129, 0.3)'}`,
                          position: 'relative',
                        }}
                      >
                        {/* Selo de Dias de Domínio */}
                        {daysText && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              fontSize: '9px',
                              fontWeight: 700,
                              background: 'rgba(99, 102, 241, 0.25)',
                              color: '#a5b4fc',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              borderRadius: '3px',
                              padding: '1px 3px',
                              lineHeight: 1,
                            }}
                            title={`Disponível: ${daysText}`}
                          >
                            {daysText}
                          </div>
                        )}

                        {/* Ícone com Moldura de Raridade */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '6px',
                            marginTop: '2px',
                          }}
                        >
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--radius-sm)',
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {specialIcon ? (
                              <img
                                src={specialIcon}
                                alt={mat.namePtBr}
                                style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                              />
                            ) : (
                              <AssetImage
                                entityType="material"
                                entityId={mat.materialId}
                                alt={mat.namePtBr}
                                size={32}
                                shape="square"
                              />
                            )}
                          </div>
                        </div>

                        {/* Nome do Material */}
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: '6px',
                          }}
                          title={mat.namePtBr}
                        >
                          {mat.namePtBr}
                        </div>

                        {/* Valores Tenho / Preciso / Falta */}
                        <div
                          style={{
                            fontSize: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            marginTop: 'auto',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span>Tenho:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {mat.have.toLocaleString()}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <span>Preciso:</span>
                            <span>{mat.need.toLocaleString()}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '2px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              background: isMissing
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                              color: isMissing ? '#ef4444' : '#34d399',
                              fontWeight: 700,
                            }}
                          >
                            <span>{isMissing ? 'Falta:' : 'Status:'}</span>
                            <span>{isMissing ? mat.missing.toLocaleString() : '✓ OK'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Modo Tabela / Linhas */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {group.items.map((mat: MaterialProgressItem) => {
                    const isMissing = mat.missing > 0;
                    const daysText =
                      mat.domainDays && mat.domainDays.length > 0
                        ? mat.domainDays.join(' / ')
                        : 'Diariamente';
                    const specialIcon = getSpecialMaterialIcon(mat.materialId);

                    return (
                      <div
                        key={mat.materialId}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 65px 65px 65px 95px',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: isMissing
                            ? 'rgba(239, 68, 68, 0.05)'
                            : 'rgba(16, 185, 129, 0.05)',
                          fontSize: '11px',
                          border: isMissing
                            ? '1px solid rgba(239, 68, 68, 0.15)'
                            : '1px solid rgba(16, 185, 129, 0.15)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {specialIcon ? (
                              <img
                                src={specialIcon}
                                alt={mat.namePtBr}
                                style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                              />
                            ) : (
                              <AssetImage
                                entityType="material"
                                entityId={mat.materialId}
                                alt={mat.namePtBr}
                                size={20}
                                shape="square"
                              />
                            )}
                          </div>
                          <span
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                            }}
                            title={mat.namePtBr}
                          >
                            {mat.namePtBr}
                          </span>
                        </div>
                        <span style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {mat.have.toLocaleString()}
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {mat.need.toLocaleString()}
                        </span>
                        <span
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: isMissing ? '#ef4444' : '#34d399',
                          }}
                        >
                          {isMissing ? mat.missing.toLocaleString() : '✓ OK'}
                        </span>
                        <span
                          style={{
                            textAlign: 'right',
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={daysText}
                        >
                          {daysText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
