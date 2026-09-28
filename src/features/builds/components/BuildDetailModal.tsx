import { ARTIFACT_SUBSTATS, type ArtifactSubstat } from '../../../domain/builds/substats';
import React, { useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type { ArtifactSetData, WeaponData } from '../../../domain/catalog';
import type {
  ArtifactSlot,
  ArtifactSlotKey,
  BuildStatus,
  CharacterBuild,
  CharacterBuildWithDetails,
  UpdateArtifactSlotInput,
  UpdateCharacterBuildInput,
} from '../../../domain/builds/types';
import {
  ARTIFACT_SLOT_KEYS,
  ARTIFACT_SLOT_MAIN_STATS,
  ARTIFACT_SLOT_NAMES,
  BUILD_STATUS_LABELS,
  VALID_BUILD_STATUSES,
  computeBuildIndicators,
} from '../../../domain/builds/validation';
import type { AccountWeapon } from '../../../domain/weapons/types';
import {
  CHARACTER_LIMITS,
  TALENT_LIMITS,
  WEAPON_LIMITS,
  getArtifactMaxLevelByRarity,
  getArtifactPresetsForRarity,
} from '../../../domain/constants/limits';
import {
  ArtifactSlotIcon,
  AssetImage,
  BoundedIntegerInput,
  Button,
  Input,
  Modal,
  ModalBody,
  Select,
} from '../../../components';
import { BuildStatusBadge } from './BuildStatusBadge';
import { ArtifactSetSelect } from './ArtifactSetSelect';
import { CatalogSelect } from '../../../components/CatalogSelect';
import { uniqueCatalogEntries } from '../../../domain/catalog/identity';

interface BuildDetailModalProps {
  isOpen: boolean;
  build: CharacterBuildWithDetails | null;
  catalogArtifactSets: ArtifactSetData[];
  catalogWeapons?: WeaponData[];
  accountWeapons: AccountWeapon[];
  onClose: () => void;
  onSave: (
    characterId: string,
    buildInput: UpdateCharacterBuildInput,
    slotsInput: Record<ArtifactSlotKey, UpdateArtifactSlotInput>
  ) => Promise<void>;
  isSaving: boolean;
}

export const BuildDetailModal: React.FC<BuildDetailModalProps> = ({
  isOpen,
  build,
  catalogArtifactSets,
  catalogWeapons,
  accountWeapons,
  onClose,
  onSave,
  isSaving,
}) => {
  if (!isOpen || !build) return null;

  return (
    <BuildDetailForm
      key={build.id}
      build={build}
      catalogArtifactSets={catalogArtifactSets}
      catalogWeapons={catalogWeapons}
      accountWeapons={accountWeapons}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
};

interface BuildDetailFormProps {
  build: CharacterBuildWithDetails;
  catalogArtifactSets: ArtifactSetData[];
  catalogWeapons?: WeaponData[];
  accountWeapons: AccountWeapon[];
  onClose: () => void;
  onSave: (
    characterId: string,
    buildInput: UpdateCharacterBuildInput,
    slotsInput: Record<ArtifactSlotKey, UpdateArtifactSlotInput>
  ) => Promise<void>;
  isSaving: boolean;
}

const BuildDetailForm: React.FC<BuildDetailFormProps> = ({
  build,
  catalogArtifactSets,
  catalogWeapons,
  accountWeapons,
  onClose,
  onSave,
  isSaving,
}) => {
  const [status, setStatus] = useState<BuildStatus>(build.status);
  const [farmEnabled, setFarmEnabled] = useState<boolean>(build.farmEnabled ?? true);
  const [accountWeaponId, setAccountWeaponId] = useState<string>(build.accountWeaponId || '');
  const [plannedWeaponId, setPlannedWeaponId] = useState(build.plannedWeaponId ?? '');
  const [weaponTargetLevel, setWeaponTargetLevel] = useState<number>(build.weaponTargetLevel);
  const [weaponTargetAscension, setWeaponTargetAscension] = useState<number>(build.weaponTargetAscension ?? 6);
  const [characterTargetLevel, setCharacterTargetLevel] = useState<number>(build.characterTargetLevel);
  const [characterTargetAscension, setCharacterTargetAscension] = useState<number>(build.characterTargetAscension ?? 6);

  const [normalAttackLevel, setNormalAttackLevel] = useState<number>(build.normalAttackLevel);
  const [normalAttackTarget, setNormalAttackTarget] = useState<number>(build.normalAttackTarget);
  const [elementalSkillLevel, setElementalSkillLevel] = useState<number>(build.elementalSkillLevel);
  const [elementalSkillTarget, setElementalSkillTarget] = useState<number>(build.elementalSkillTarget);
  const [elementalBurstLevel, setElementalBurstLevel] = useState<number>(build.elementalBurstLevel);
  const [elementalBurstTarget, setElementalBurstTarget] = useState<number>(build.elementalBurstTarget);

  const [notes, setNotes] = useState<string>(build.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [activeSlotTab, setActiveSlotTab] = useState<ArtifactSlotKey>('flower');

  // Estado dos 5 slots de artefatos
  const [slotsData, setSlotsData] = useState<Record<ArtifactSlotKey, UpdateArtifactSlotInput>>(() => {
    const map: Record<ArtifactSlotKey, UpdateArtifactSlotInput> = {
      flower: {},
      plume: {},
      sands: {},
      goblet: {},
      circlet: {},
    };
    for (const key of ARTIFACT_SLOT_KEYS) {
      const slot = build.artifactSlots[key];
      map[key] = {
        substats: slot?.substats ?? [],
        substatValues: slot?.substatValues ?? {},
        setId: slot?.setId || '',
        mainStat: slot?.mainStat || '',
        level: slot?.level ?? 0,
        targetLevel: slot?.targetLevel ?? 20,
        isEquipped: slot?.isEquipped ?? false,
        notes: slot?.notes || '',
      };
    }
    return map;
  });

  const { navigateTo } = useShell();

  const weaponMap = useMemo(() => {
    const map = new Map<string, WeaponData>();
    for (const cw of (catalogWeapons || [])) {
      map.set(cw.id, cw);
      if (cw.gameKey) map.set(cw.gameKey, cw);
    }
    return map;
  }, [catalogWeapons]);

  // Armas disponíveis e compatíveis com o tipo de arma do personagem
  const compatibleWeapons = useMemo(() => {
    return accountWeapons.filter((aw) => {
      const cat = weaponMap.get(aw.weaponId);
      return cat?.weaponType === build.characterWeaponType;
    });
  }, [accountWeapons, weaponMap, build.characterWeaponType]);

  // Indicadores ao vivo
  const liveIndicators = useMemo(() => {
    const mergeSlot = (key: ArtifactSlotKey): ArtifactSlot => ({
      ...build.artifactSlots[key],
      ...slotsData[key],
    });

    const simulatedBuild: CharacterBuild = {
      ...build,
      status,
      farmEnabled,
      accountWeaponId: accountWeaponId || null,
      weaponTargetLevel,
      weaponTargetAscension,
      characterTargetLevel,
      characterTargetAscension,
      normalAttackLevel,
      normalAttackTarget,
      elementalSkillLevel,
      elementalSkillTarget,
      elementalBurstLevel,
      elementalBurstTarget,
      artifactSlots: {
        flower: mergeSlot('flower'),
        plume: mergeSlot('plume'),
        sands: mergeSlot('sands'),
        goblet: mergeSlot('goblet'),
        circlet: mergeSlot('circlet'),
      },
    };
    return computeBuildIndicators(simulatedBuild, build.characterLevel, build.weaponLevel);
  }, [
    build,
    status,
    farmEnabled,
    accountWeaponId,
    weaponTargetLevel,
    weaponTargetAscension,
    characterTargetLevel,
    characterTargetAscension,
    normalAttackLevel,
    normalAttackTarget,
    elementalSkillLevel,
    elementalSkillTarget,
    elementalBurstLevel,
    elementalBurstTarget,
    slotsData,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (accountWeaponId && !compatibleWeapons.some(weapon => weapon.id === accountWeaponId)) {
      setError('Selecione uma arma compatível antes de salvar. A associação anterior não foi alterada.');
      return;
    }

    try {
      const buildInput: UpdateCharacterBuildInput = {
        status,
        farmEnabled,
        characterTargetAscension,
        weaponTargetAscension,
        accountWeaponId: accountWeaponId.trim() || null,
        plannedWeaponId: plannedWeaponId || null,
        weaponTargetLevel,
        characterTargetLevel,
        normalAttackLevel,
        normalAttackTarget,
        elementalSkillLevel,
        elementalSkillTarget,
        elementalBurstLevel,
        elementalBurstTarget,
        notes: notes.trim() || null,
      };

      const cleanSlots: Record<ArtifactSlotKey, UpdateArtifactSlotInput> = {
        flower: { ...slotsData.flower, setId: slotsData.flower.setId || null, mainStat: slotsData.flower.mainStat || null },
        plume: { ...slotsData.plume, setId: slotsData.plume.setId || null, mainStat: slotsData.plume.mainStat || null },
        sands: { ...slotsData.sands, setId: slotsData.sands.setId || null, mainStat: slotsData.sands.mainStat || null },
        goblet: { ...slotsData.goblet, setId: slotsData.goblet.setId || null, mainStat: slotsData.goblet.mainStat || null },
        circlet: { ...slotsData.circlet, setId: slotsData.circlet.setId || null, mainStat: slotsData.circlet.mainStat || null },
      };

      await onSave(build.characterId, buildInput, cleanSlots);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar build.');
    }
  };

  const currentSlotData = slotsData[activeSlotTab];
  const slotMeta = ARTIFACT_SLOT_NAMES[activeSlotTab];
  const mainStatOptions = [
    { value: '', label: 'Selecione o Atributo...' },
    ...ARTIFACT_SLOT_MAIN_STATS[activeSlotTab].map((stat) => ({
      value: stat,
      label: stat,
    })),
  ];

  const selectedSet = catalogArtifactSets.find((s) => s.id === currentSlotData.setId);
  const slotRarity = selectedSet && selectedSet.rarities.length > 0
    ? Math.max(...selectedSet.rarities)
    : 5;
  const slotMaxLevel = getArtifactMaxLevelByRarity(slotRarity);
  const slotPresets = getArtifactPresetsForRarity(slotRarity);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Build: ${build.characterName}`}
      maxWidth="1240px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button form="build-detail-form" type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Build'}
          </Button>
        </div>
      }
    >
      <form
        id="build-detail-form"
        onSubmit={handleSubmit}
        className="modal-form"
      >
        <ModalBody className="build-editor-body" style={{ gap: '14px' }}>
          {error && (
            <div
              role="alert"
              style={{ gridColumn: '1 / -1', padding: '10px 14px', color: '#ef4444' }}
            >
              {error}
            </div>
          )}

          {/* Character Summary Header */}
          <div
            className="build-editor-summary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <AssetImage
                  entityType="character"
                  entityId={build.characterId}
                  alt={build.characterName}
                  size={48}
                  shape="square"
                />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {build.characterName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {build.characterRarity}★ • {build.characterElement.toUpperCase()} • Nv. Atual: {build.characterLevel}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                PROGRESSO ESTIMADO
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                {liveIndicators.progressPercent}%
              </div>
            </div>
          </div>

          {/* Seção 1: Estado da Build e Avaliação */}
          <div
            className="build-editor-status"
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Status Efetivo:</span>
                  <BuildStatusBadge status={liveIndicators.effectiveStatus} size="sm" />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {liveIndicators.statusReason}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatus(liveIndicators.suggestedStatus);
                  setError(null);
                }}
                style={{ fontSize: '11px' }}
              >
                Aplicar Sugestão: {BUILD_STATUS_LABELS[liveIndicators.suggestedStatus]}
              </Button>
            </div>

            {/* Toggle de Farm Ativo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: farmEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                border: farmEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Acompanhamento de Farm
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {farmEnabled
                    ? 'Este personagem está ativo no planejamento de recursos e farm semanal.'
                    : 'Farm pausado para este personagem. Não será somado no cálculo de resina ativa.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFarmEnabled(!farmEnabled)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: farmEnabled ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  background: farmEnabled ? '#10b981' : 'var(--bg-card)',
                  color: farmEnabled ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {farmEnabled ? 'Farm: Ativo' : 'Farm: Pausado'}
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Avaliação Manual / Julgamento da Build:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {VALID_BUILD_STATUSES.map((s) => {
                  const isCompleteBlocked = s === 'completa' && !liveIndicators.canBeComplete;
                  const isSelected = status === s;

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (isCompleteBlocked) {
                          setError(
                            `A build não pode ser marcada como Completa porque critérios objetivos obrigatórios ainda estão pendentes: ${liveIndicators.missingForComplete.join('; ')}.`
                          );
                          return;
                        }
                        setError(null);
                        setStatus(s);
                      }}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        border: isSelected
                          ? '2px solid var(--accent-primary)'
                          : isCompleteBlocked
                          ? '1px dashed rgba(239, 68, 68, 0.35)'
                          : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        cursor: isCompleteBlocked ? 'not-allowed' : 'pointer',
                        opacity: isCompleteBlocked && !isSelected ? 0.65 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      title={isCompleteBlocked ? `Bloqueado: ${liveIndicators.missingForComplete.join('; ')}` : undefined}
                    >
                      <BuildStatusBadge status={s} size="sm" />
                      {isCompleteBlocked && (
                        <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>[Bloqueado]</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Critérios objetivos pendentes para atingir Completa */}
            {!liveIndicators.canBeComplete && liveIndicators.missingForComplete.length > 0 && (
              <details
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <summary style={{ fontWeight: 600, color: '#fbbf24', cursor: 'pointer' }}>
                  {liveIndicators.missingForComplete.length} critérios pendentes para Completa
                </summary>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {liveIndicators.missingForComplete.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Seção 2: Alvos de Nível, Ascensão e Arma */}
          <div
            className="build-editor-targets"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div>
              <BoundedIntegerInput
                id="build-character-target-level"
                label="Nível Alvo do Personagem (1 a 90)"
                min={CHARACTER_LIMITS.LEVEL.MIN}
                max={CHARACTER_LIMITS.LEVEL.MAX}
                value={characterTargetLevel}
                onChange={(val) => setCharacterTargetLevel(val ?? 90)}
                presets={[70, 80, 90]}
              />
            </div>

            <div>
              <BoundedIntegerInput
                id="build-character-target-ascension"
                label="Ascensão Alvo Personagem (0 a 6)"
                min={0}
                max={6}
                value={characterTargetAscension}
                onChange={(val) => setCharacterTargetAscension(val ?? 6)}
                presets={[4, 5, 6]}
              />
            </div>

            <div>
              <CatalogSelect
                label="Arma possuída vinculada"
                entityType="weapon"
                emptyLabel="Nenhuma arma específica"
                options={compatibleWeapons.map((w) => {
                    const cat = weaponMap.get(w.weaponId);
                    const displayName = cat?.namePtBr ?? w.weaponId;
                    return {
                      value: w.id,
                      entityId: w.weaponId,
                      label: displayName,
                      detail: `${cat?.rarity ?? '—'}★ · Nv. ${w.level} · R${w.refinement}`,
                    };
                  })}
                value={accountWeaponId}
                onChange={setAccountWeaponId}
              />
              {accountWeaponId && !compatibleWeapons.some(weapon => weapon.id === accountWeaponId) && <p role="alert" className="ui-error">Arma anterior incompatível ou indisponível. O registro foi preservado; selecione uma arma válida.</p>}
            </div>

            <div>
              <BoundedIntegerInput
                id="build-weapon-target-level"
                label="Nível Alvo da Arma (1 a 90)"
                min={WEAPON_LIMITS.LEVEL.MIN}
                max={WEAPON_LIMITS.LEVEL.MAX}
                value={weaponTargetLevel}
                onChange={(val) => setWeaponTargetLevel(val ?? 90)}
                presets={[70, 80, 90]}
              />
            </div>

            <div>
              <CatalogSelect label="Arma planejada" entityType="weapon" emptyLabel="Sem alvo planejado"
                value={plannedWeaponId} onChange={setPlannedWeaponId}
                options={uniqueCatalogEntries(catalogWeapons ?? [], 'weapon').filter(w => w.weaponType === build.characterWeaponType).sort((a,b) => b.rarity-a.rarity || a.namePtBr.localeCompare(b.namePtBr, 'pt-BR')).map(w => ({value:w.id, entityId:w.id, label:w.namePtBr, detail:`${w.rarity}★ · Alvo planejado`} ))}/>
              <small className="weapon-plan-hint">Alvo apenas; não registra posse.</small>
            </div>

            <div>
              <BoundedIntegerInput
                id="build-weapon-target-ascension"
                label="Ascensão Alvo Arma (0 a 6)"
                min={0}
                max={6}
                value={weaponTargetAscension}
                onChange={(val) => setWeaponTargetAscension(val ?? 6)}
                presets={[4, 5, 6]}
              />
            </div>
          </div>

          {/* Seção 3: Talentos (Atual e Alvo) */}
          <div
            className="build-editor-talents"
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Níveis de Talentos (1 a 10)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Ataque Normal
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BoundedIntegerInput
                    id="build-talent-normal-current"
                    ariaLabel="Ataque Normal Atual"
                    min={TALENT_LIMITS.LEVEL.MIN}
                    max={TALENT_LIMITS.LEVEL.MAX}
                    value={normalAttackLevel}
                    onChange={(val) => setNormalAttackLevel(val ?? 1)}
                    placeholder="Atual"
                  />
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  <BoundedIntegerInput
                    id="build-talent-normal-target"
                    ariaLabel="Ataque Normal Alvo"
                    min={TALENT_LIMITS.LEVEL.MIN}
                    max={TALENT_LIMITS.LEVEL.MAX}
                    value={normalAttackTarget}
                    onChange={(val) => setNormalAttackTarget(val ?? 8)}
                    placeholder="Alvo"
                  />
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Habilidade Elemental
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BoundedIntegerInput
                    id="build-talent-skill-current"
                    ariaLabel="Habilidade Elemental Atual"
                    min={TALENT_LIMITS.LEVEL.MIN}
                    max={TALENT_LIMITS.LEVEL.MAX}
                    value={elementalSkillLevel}
                    onChange={(val) => setElementalSkillLevel(val ?? 1)}
                    placeholder="Atual"
                  />
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  <BoundedIntegerInput
                    id="build-talent-skill-target"
                    ariaLabel="Habilidade Elemental Alvo"
                    min={TALENT_LIMITS.LEVEL.MIN}
                    max={TALENT_LIMITS.LEVEL.MAX}
                    value={elementalSkillTarget}
                    onChange={(val) => setElementalSkillTarget(val ?? 8)}
                    placeholder="Alvo"
                  />
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Supremo
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BoundedIntegerInput
                    id="build-talent-burst-current"
                    ariaLabel="Supremo Atual"
                    min={TALENT_LIMITS.LEVEL.MIN}
                    max={TALENT_LIMITS.LEVEL.MAX}
                    value={elementalBurstLevel}
                    onChange={(val) => setElementalBurstLevel(val ?? 1)}
                    placeholder="Atual"
                  />
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  <BoundedIntegerInput
                    id="build-talent-burst-target"
                    ariaLabel="Supremo Alvo"
                    min={TALENT_LIMITS.LEVEL.MIN}
                    max={TALENT_LIMITS.LEVEL.MAX}
                    value={elementalBurstTarget}
                    onChange={(val) => setElementalBurstTarget(val ?? 8)}
                    placeholder="Alvo"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Slots de Artefatos (Flor, Pena, Relógio, Cálice, Coroa) */}
          <div
            className="build-editor-artifacts"
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Slots de Artefatos (Flor / Pena / Relógio / Cálice / Coroa)
            </div>

            {/* Abas dos 5 Slots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {ARTIFACT_SLOT_KEYS.map((key) => {
                const meta = ARTIFACT_SLOT_NAMES[key];
                const isActive = activeSlotTab === key;
                const slot = slotsData[key];
                const isEquipped = slot.isEquipped;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveSlotTab(key)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-sm)',
                      border: isActive
                        ? '2px solid var(--accent-primary)'
                        : isEquipped
                        ? '1px solid rgba(245, 158, 11, 0.4)'
                        : '1px solid var(--border-subtle)',
                      background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <ArtifactSlotIcon slotKey={key} size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#ffffff' : 'var(--text-secondary)' }}>
                      {meta.short}
                    </span>
                    <span style={{ fontSize: '10px', color: isEquipped ? '#34d399' : 'var(--text-muted)' }}>
                      {isEquipped ? `+${slot.level ?? 0}` : 'vazio'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Editor do Slot Ativo */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArtifactSlotIcon slotKey={activeSlotTab} size={16} />
                  <span>{slotMeta.label}</span>
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(currentSlotData.isEquipped)}
                    onChange={(e) =>
                      setSlotsData((prev) => ({
                        ...prev,
                        [activeSlotTab]: { ...prev[activeSlotTab], isEquipped: e.target.checked },
                      }))
                    }
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  Artefato Equipado
                </label>
              </div>

              <div className="artifact-editor-grid">
                <div>
                  <ArtifactSetSelect
                    value={currentSlotData.setId || null}
                    onChange={(setId) =>
                      setSlotsData((prev) => ({
                        ...prev,
                        [activeSlotTab]: { ...prev[activeSlotTab], setId: setId || null },
                      }))
                    }
                    artifactSets={catalogArtifactSets}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Atributo Principal (Main Stat)
                  </label>
                  <Select
                    options={mainStatOptions}
                    value={currentSlotData.mainStat || ''}
                    onChange={(e) =>
                      setSlotsData((prev) => ({
                        ...prev,
                        [activeSlotTab]: { ...prev[activeSlotTab], mainStat: e.target.value },
                      }))
                    }
                  />
                </div>

                <div>
                  <BoundedIntegerInput
                    id={`artifact-slot-level-${activeSlotTab}`}
                    label={`Nível Atual (+0 a +${slotMaxLevel})`}
                    min={0}
                    max={slotMaxLevel}
                    value={currentSlotData.level ?? 0}
                    onChange={(val) =>
                      setSlotsData((prev) => ({
                        ...prev,
                        [activeSlotTab]: { ...prev[activeSlotTab], level: val ?? 0 },
                      }))
                    }
                    presets={slotPresets}
                  />
                </div>

                <div>
                  <BoundedIntegerInput
                    id={`artifact-slot-target-${activeSlotTab}`}
                    label={`Nível Alvo (+0 a +${slotMaxLevel})`}
                    min={0}
                    max={slotMaxLevel}
                    value={currentSlotData.targetLevel ?? slotMaxLevel}
                    onChange={(val) =>
                      setSlotsData((prev) => ({
                        ...prev,
                        [activeSlotTab]: { ...prev[activeSlotTab], targetLevel: val ?? slotMaxLevel },
                      }))
                    }
                    presets={slotPresets}
                  />
                </div>
              </div>
              <fieldset className="artifact-substats-editor"><legend>Subatributos · {slotMeta.short} (até 4)</legend>
                <div>{[0, 1, 2, 3].map(index => <div className="artifact-substat-field" key={index}><span>Subatributo {index + 1}</span>
                  <select aria-label={`Subatributo ${index + 1}`} value={currentSlotData.substats?.[index] ?? ''} onChange={event => {
                    const chosen = [...(currentSlotData.substats ?? [])];
                    if (event.target.value) chosen[index] = event.target.value as ArtifactSubstat;
                    else chosen.splice(index, 1);
                    setSlotsData(old => ({ ...old, [activeSlotTab]: { ...old[activeSlotTab], substats: chosen.filter(Boolean), substatValues: Object.fromEntries(Object.entries(old[activeSlotTab].substatValues ?? {}).filter(([key]) => chosen.includes(key as ArtifactSubstat))) } }));
                  }}><option value="">Não informado</option>{Object.entries(ARTIFACT_SUBSTATS).map(([value, label]) => <option key={value} value={value} disabled={(currentSlotData.substats ?? []).some((key, i) => key === value && i !== index)}>{label}</option>)}</select>
                  <input type="number" min="0" step="any" aria-label={`Valor do subatributo ${index + 1}`} placeholder="Valor não informado" disabled={!currentSlotData.substats?.[index]} value={currentSlotData.substatValues?.[currentSlotData.substats?.[index] as ArtifactSubstat] ?? ''} onChange={event => {
                    const type = currentSlotData.substats?.[index];
                    if (!type) return;
                    const raw = event.target.value;
                    const value = event.target.valueAsNumber;
                    setSlotsData(old => {
                      const values = { ...old[activeSlotTab].substatValues };
                      if (raw === '') delete values[type];
                      else if (Number.isFinite(value) && value >= 0) values[type] = value;
                      return { ...old, [activeSlotTab]: { ...old[activeSlotTab], substatValues: values } };
                    });
                  }} />
                </div>)}</div>
              </fieldset>
            </div>
          </div>

          {/* Observações Gerais da Build */}
          <div className="build-editor-notes">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Observações / Guia da Build
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Focar em Recarga de Energia e Dano Crítico. Selo da Insulamento 4 peças."
            />
          </div>

          {/* Seção 5: Acesso ao Farm */}
          <div
            className="build-editor-farm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Fila de Farm & Materiais
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Consulte requisitos consolidados de ascensão, talentos e resina estimada na aba de Farm.
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigateTo('farm');
              }}
            >
              Ver no Farm
            </Button>
          </div>
        </ModalBody>
      </form>
    </Modal>
  );
};
