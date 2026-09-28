import React, { useMemo, useState } from 'react';
import type { CharacterData, WeaponData, WeaponType } from '../../../domain/catalog';
import type { CreateAccountWeaponInput } from '../../../domain/weapons/types';
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
  Input,
  Modal,
  Select,
} from '../../../components';

interface AddWeaponModalProps {
  isOpen: boolean;
  catalogWeapons: WeaponData[];
  characters: CharacterData[];
  onClose: () => void;
  onAdd: (input: CreateAccountWeaponInput) => Promise<void>;
  isSaving: boolean;
}

export const AddWeaponModal: React.FC<AddWeaponModalProps> = ({
  isOpen,
  catalogWeapons,
  characters,
  onClose,
  onAdd,
  isSaving,
}) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<WeaponType | 'all'>('all');
  const [level, setLevel] = useState<number>(1);
  const [ascension, setAscension] = useState<number>(0);
  const [refinement, setRefinement] = useState<number>(1);
  const [equippedCharacterId, setEquippedCharacterId] = useState<string>('');
  const [favorite, setFavorite] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Armas filtradas para seleção
  const availableWeapons = useMemo(() => {
    return catalogWeapons.filter((w) => {
      if (selectedType !== 'all' && w.weaponType !== selectedType) return false;
      if (search.trim() !== '') {
        const term = search.toLowerCase().trim();
        return w.namePtBr.toLowerCase().includes(term) || w.gameKey.toLowerCase().includes(term);
      }
      return true;
    });
  }, [catalogWeapons, search, selectedType]);

  const selectedWeapon = useMemo(() => {
    return catalogWeapons.find((w) => w.id === selectedWeaponId) ?? null;
  }, [catalogWeapons, selectedWeaponId]);

  // Personagens compatíveis com o tipo da arma selecionada
  const eligibleCharacters = useMemo(() => {
    if (!selectedWeapon) return characters;
    return characters.filter((c) => c.weaponType === selectedWeapon.weaponType);
  }, [characters, selectedWeapon]);

  const handleLevelChange = (val: number) => {
    setLevel(val);
    const maxLevelForAsc = getWeaponAscensionMaxLevel(ascension);
    if (val > maxLevelForAsc) {
      // Ajusta fase de ascensão automaticamente
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
    if (!selectedWeaponId) {
      setError('Selecione uma arma do catálogo para adicionar.');
      return;
    }
    setError(null);

    try {
      await onAdd({
        weaponId: selectedWeaponId,
        level,
        ascension,
        refinement,
        equippedCharacterId: equippedCharacterId || null,
        favorite,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar arma.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Arma à Coleção"
      maxWidth="600px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!selectedWeaponId || isSaving}
            onClick={(e) => void handleSubmit(e)}
          >
            {isSaving ? 'Adicionando...' : 'Adicionar à Conta'}
          </Button>
        </div>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        {/* Seleção da Arma */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            1. Selecione a Arma:
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <Input
              type="text"
              placeholder="Buscar arma no catálogo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as WeaponType | 'all')}
              options={[
                { value: 'all', label: 'Todos os Tipos' },
                { value: 'sword', label: 'Espadas' },
                { value: 'claymore', label: 'Espadões' },
                { value: 'polearm', label: 'Lanças' },
                { value: 'bow', label: 'Arcos' },
                { value: 'catalyst', label: 'Catalisadores' },
              ]}
              style={{ width: '150px' }}
            />
          </div>

          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {availableWeapons.map((w) => {
              const isSelected = w.id === selectedWeaponId;
              const starColor = w.rarity === 5 ? '#fbbf24' : w.rarity === 4 ? '#c084fc' : '#38bdf8';
              return (
                <div
                  key={w.id}
                  onClick={() => {
                    setSelectedWeaponId(w.id);
                    setEquippedCharacterId('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden' }}>
                      <AssetImage
                        entityType="weapon"
                        entityId={w.id}
                        alt={w.namePtBr}
                        size={32}
                        shape="square"
                      />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)' }}>
                      {w.namePtBr}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: starColor }}>
                    {w.rarity}★
                  </span>
                </div>
              );
            })}
            {availableWeapons.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Nenhuma arma encontrada para os filtros.
              </div>
            )}
          </div>
        </div>

        {/* Selected Weapon Preview */}
        {selectedWeapon && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden' }}>
              <AssetImage
                entityType="weapon"
                entityId={selectedWeapon.id}
                alt={selectedWeapon.namePtBr}
                size={40}
                shape="square"
              />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedWeapon.namePtBr}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {selectedWeapon.rarity}★ • {selectedWeapon.weaponType.toUpperCase()}
              </div>
            </div>
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
            Equipar em Personagem (opcional):
          </label>
          <Select
            value={equippedCharacterId}
            onChange={(e) => setEquippedCharacterId(e.target.value)}
            options={[
              { value: '', label: 'Nenhum (arma na reserva)' },
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

        {/* Notas */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            Anotações:
          </label>
          <textarea
            rows={2}
            placeholder="Anotações sobre a arma, builds ou alvos..."
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
