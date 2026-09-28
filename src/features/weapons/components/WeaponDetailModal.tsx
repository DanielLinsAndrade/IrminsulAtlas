import React, { useMemo, useState } from 'react';
import type { CharacterData } from '../../../domain/catalog';
import type {
  AccountWeaponWithDetails,
  UpdateAccountWeaponInput,
} from '../../../domain/weapons/types';
import {
  MAX_WEAPON_ASCENSION,
  MAX_WEAPON_REFINEMENT,
  getWeaponAscensionMaxLevel,
} from '../../../domain/weapons/validation';
import { WEAPON_LIMITS } from '../../../domain/constants/limits';
import {
  AssetImage,
  BoundedIntegerInput,
  Button,
  Modal,
  Select,
} from '../../../components';

interface WeaponDetailModalProps {
  isOpen: boolean;
  weapon: AccountWeaponWithDetails | null;
  characters: CharacterData[];
  onClose: () => void;
  onUpdate: (id: string, input: UpdateAccountWeaponInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}

export const WeaponDetailModal: React.FC<WeaponDetailModalProps> = ({
  isOpen,
  weapon,
  characters,
  onClose,
  onUpdate,
  onDelete,
  isSaving,
}) => {
  if (!isOpen || !weapon) return null;

  return (
    <WeaponDetailForm
      key={weapon.id}
      weapon={weapon}
      characters={characters}
      onClose={onClose}
      onUpdate={onUpdate}
      onDelete={onDelete}
      isSaving={isSaving}
    />
  );
};

interface WeaponDetailFormProps {
  weapon: AccountWeaponWithDetails;
  characters: CharacterData[];
  onClose: () => void;
  onUpdate: (id: string, input: UpdateAccountWeaponInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}

const WeaponDetailForm: React.FC<WeaponDetailFormProps> = ({
  weapon,
  characters,
  onClose,
  onUpdate,
  onDelete,
  isSaving,
}) => {
  const [level, setLevel] = useState<number>(weapon.level);
  const [ascension, setAscension] = useState<number>(weapon.ascension);
  const [refinement, setRefinement] = useState<number>(weapon.refinement);
  const [equippedCharacterId, setEquippedCharacterId] = useState<string>(
    weapon.equippedCharacterId ?? ''
  );
  const [favorite, setFavorite] = useState<boolean>(weapon.favorite);
  const [notes, setNotes] = useState<string>(weapon.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const eligibleCharacters = useMemo(() => {
    return characters.filter((c) => c.weaponType === weapon.weaponType);
  }, [characters, weapon.weaponType]);

  const handleLevelChange = (val: number) => {
    setLevel(val);
    const maxLevelForAsc = getWeaponAscensionMaxLevel(ascension);
    if (val > maxLevelForAsc) {
      for (let a = 0; a <= MAX_WEAPON_ASCENSION; a++) {
        if (val <= getWeaponAscensionMaxLevel(a)) {
          setAscension(a);
          break;
        }
      }
    }
  };

  const handleAscensionChange = (asc: number) => {
    setAscension(asc);
    const maxL = getWeaponAscensionMaxLevel(asc);
    if (level > maxL) {
      setLevel(maxL);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onUpdate(weapon.id, {
        level,
        ascension,
        refinement,
        equippedCharacterId: equippedCharacterId || null,
        favorite,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações.');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Deseja remover esta cópia de "${weapon.namePtBr}" (#${weapon.instanceNo}) da sua conta?`)) {
      try {
        await onDelete(weapon.id);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir arma.');
      }
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Detalhes — ${weapon.namePtBr} (#${weapon.instanceNo})`}
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={isSaving}
            onClick={() => void handleDelete()}
            style={{ color: 'var(--color-danger, #ef4444)' }}
          >
            Excluir Cópia
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isSaving}
              onClick={(e) => void handleSubmit(e)}
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Preview */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden' }}>
            <AssetImage
              entityType="weapon"
              entityId={weapon.weaponId}
              alt={weapon.namePtBr}
              size={56}
              shape="square"
            />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {weapon.namePtBr}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {weapon.rarity}★ • Cópia #{weapon.instanceNo} • {weapon.weaponType.toUpperCase()}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* Nível e Ascensão */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <BoundedIntegerInput
              label={`Nível (${WEAPON_LIMITS.LEVEL.MIN} a ${WEAPON_LIMITS.LEVEL.MAX}):`}
              min={WEAPON_LIMITS.LEVEL.MIN}
              max={WEAPON_LIMITS.LEVEL.MAX}
              value={level}
              onChange={(newLevel) => {
                if (newLevel !== null) {
                  handleLevelChange(newLevel);
                }
              }}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              Fase de Ascensão:
            </label>
            <Select
              value={String(ascension)}
              onChange={(e) => handleAscensionChange(Number(e.target.value))}
              options={[
                { value: '0', label: 'Fase 0 (Máx. Nv. 20)' },
                { value: '1', label: 'Fase 1 (Máx. Nv. 40)' },
                { value: '2', label: 'Fase 2 (Máx. Nv. 50)' },
                { value: '3', label: 'Fase 3 (Máx. Nv. 60)' },
                { value: '4', label: 'Fase 4 (Máx. Nv. 70)' },
                { value: '5', label: 'Fase 5 (Máx. Nv. 80)' },
                { value: '6', label: 'Fase 6 (Máx. Nv. 90)' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Refinamento (R1 a R5) */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Nível de Refinamento:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {Array.from({ length: MAX_WEAPON_REFINEMENT }).map((_, i) => {
              const r = i + 1;
              const isActive = refinement === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRefinement(r)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-md)',
                    border: isActive
                      ? r === 5
                        ? '1px solid #fbbf24'
                        : '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    background: isActive
                      ? r === 5
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'var(--accent-primary)'
                      : 'var(--bg-card)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  R{r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Personagem Equipado */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            Personagem Equipado:
          </label>
          <Select
            value={equippedCharacterId}
            onChange={(e) => setEquippedCharacterId(e.target.value)}
            options={[
              { value: '', label: 'Nenhum (arma desequipada / reserva)' },
              ...eligibleCharacters.map((c) => ({
                value: c.id,
                label: `${c.namePtBr} (${c.rarity}★ ${c.element.toUpperCase()})`,
              })),
            ]}
            style={{ width: '100%' }}
          />
        </div>

        {/* Favorito */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Marcar como Favorita
          </span>
        </label>

        {/* Anotações */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            Notas Pessoais:
          </label>
          <textarea
            rows={3}
            placeholder="Anotações sobre refinamento, build recomendada, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </form>
    </Modal>
  );
};
