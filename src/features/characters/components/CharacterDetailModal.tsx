import React, { useState } from 'react';
import { COMBAT_STATS, validateCombatStats, type CombatStats } from '../../../domain/characters/combatStats';
import { CharacterShowcase } from './CharacterShowcase';
import type {
  AccountCharacterWithDetails,
  UpdateAccountCharacterInput,
} from '../../../domain/characters/types';
import {
  ASCENSION_MAX_LEVEL_MAP,
  MAX_CONSTELLATION,
} from '../../../domain/characters/validation';
import { CHARACTER_LIMITS } from '../../../domain/constants/limits';
import {
  AssetImage,
  Badge,
  BoundedIntegerInput,
  Button,
  Modal,
  ModalBody,
  Select,
} from '../../../components';

interface CharacterDetailModalProps {
  isOpen: boolean;
  character: AccountCharacterWithDetails | null;
  onClose: () => void;
  onSave: (characterId: string, input: UpdateAccountCharacterInput) => Promise<void>;
  onToggleOwned: (characterId: string) => Promise<void>;
  isSaving: boolean;
}

interface CharacterDetailFormProps {
  character: AccountCharacterWithDetails;
  onClose: () => void;
  onSave: (characterId: string, input: UpdateAccountCharacterInput) => Promise<void>;
  onToggleOwned: (characterId: string) => Promise<void>;
  isSaving: boolean;
}

const CharacterDetailForm: React.FC<CharacterDetailFormProps> = ({
  character,
  onClose,
  onSave,
  onToggleOwned,
  isSaving,
}) => {
  const [owned, setOwned] = useState<boolean>(character.owned);
  const [constellation, setConstellation] = useState<number>(character.constellation);
  const [level, setLevel] = useState<number>(character.level);
  const [ascension, setAscension] = useState<number>(character.ascension);
  const [friendship, setFriendship] = useState<number | null>(character.friendship ?? null);
  const [notes, setNotes] = useState<string>(character.notes ?? '');
  const [combatStats, setCombatStats] = useState<CombatStats>(character.combatStats ?? {});
  const [formError, setFormError] = useState<string | null>(null);

  const is5Star = character.rarity === 5;
  const rarityColor = is5Star ? '#fbbf24' : '#c084fc';

  const handleAscensionChange = (newAsc: number) => {
    setAscension(newAsc);
    // Ajusta o nível se estiver acima do teto da nova fase
    const maxForAsc = ASCENSION_MAX_LEVEL_MAP[newAsc] ?? 90;
    if (level > maxForAsc) {
      setLevel(maxForAsc);
    }
  };

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
    // Ajusta automaticamente a ascensão correspondente mínima se o nível exceder o teto atual
    const currentMax = ASCENSION_MAX_LEVEL_MAP[ascension] ?? 90;
    if (newLevel > currentMax) {
      for (let a = 0; a <= 6; a++) {
        if (newLevel <= ASCENSION_MAX_LEVEL_MAP[a]) {
          setAscension(a);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const maxC = character.maxConstellation ?? MAX_CONSTELLATION;
      const boundedConstellation = Math.min(constellation, maxC);

      let parsedFriendship: number | null = null;
      if (character.supportsFriendship !== false && friendship !== null && friendship !== undefined) {
        if (friendship < CHARACTER_LIMITS.FRIENDSHIP.MIN || friendship > CHARACTER_LIMITS.FRIENDSHIP.MAX) {
          throw new Error(
            `O nível de amizade deve estar entre ${CHARACTER_LIMITS.FRIENDSHIP.MIN} e ${CHARACTER_LIMITS.FRIENDSHIP.MAX}.`
          );
        }
        parsedFriendship = friendship;
      }

      await onSave(character.characterId, {
        owned,
        constellation: boundedConstellation,
        level,
        ascension,
        friendship: parsedFriendship,
        notes: notes.trim() || null,
        combatStats: validateCombatStats(combatStats),
      });

      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar alterações.');
    }
  };

  const handleRemove = async () => {
    if (confirm(`Deseja remover ${character.namePtBr} dos personagens possuídos?`)) {
      await onToggleOwned(character.characterId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Detalhes — ${character.namePtBr}`}
      maxWidth="1280px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {character.owned ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isSaving}
              onClick={() => void handleRemove()}
              style={{ color: 'var(--color-danger, #ef4444)' }}
            >
              Remover Posse
            </Button>
          ) : (
            <div />
          )}
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
      <ModalBody className="character-detail-body">
        {formError && <p role="alert" className="ui-error" style={{padding:16}}>{formError}</p>}
      <CharacterShowcase character={character} onClose={onClose} />
      <details style={{padding:'16px 24px'}}><summary>Editar atributos de combate (opcional)</summary>
        <p className="ui-muted">Valores manuais, sem estimativas. Deixe vazio o que não quiser registrar.</p>
        <div className="combat-stats-editor">{Object.entries(COMBAT_STATS).map(([key, label]) => <label key={key}>{label}<input type="number" min="0" step="any" aria-label={label} value={combatStats[key as keyof CombatStats] ?? ''} onChange={e => setCombatStats(previous => { const next = {...previous}; if (e.target.value === '') delete next[key as keyof CombatStats]; else next[key as keyof CombatStats] = Number(e.target.value); return next; })}/></label>)}</div>
      </details>
      <details style={{ padding: '0 24px 20px' }}><summary>Editar progresso do personagem</summary>
      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header com avatar e informações rápidas */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${rarityColor}`,
              overflow: 'hidden',
              flexShrink: 0,
              background: 'rgba(15, 23, 42, 0.8)',
            }}
          >
            <AssetImage
              entityType="character"
              entityId={character.characterId}
              alt={character.namePtBr}
              size={72}
              shape="square"
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {character.namePtBr}
              </h3>
              <Badge variant={is5Star ? 'warning' : 'primary'} size="sm">
                {'★'.repeat(character.rarity)}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span style={{ textTransform: 'capitalize' }}>Elemento: {character.element}</span>
              <span>•</span>
              <span style={{ textTransform: 'capitalize' }}>Arma: {character.weaponType}</span>
            </div>
            {character.releaseVersionId && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Versão de lançamento: {character.releaseVersionId}
              </div>
            )}
          </div>
        </div>



        {/* Status de Posse */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Status na Conta
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Indica se este personagem foi obtido pelo jogador
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={owned}
              onChange={(e) => setOwned(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: owned ? '#22c55e' : 'var(--text-muted)' }}>
              {owned ? 'Obtido' : 'Não Obtido'}
            </span>
          </label>
        </div>

        {/* Constelação */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Constelação:
          </label>
          {character.maxConstellation === 0 ? (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              Personagem de evento especial com constelação fixa em C0.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(character.maxConstellation ?? MAX_CONSTELLATION) + 1}, 1fr)`, gap: '6px' }}>
              {Array.from({ length: (character.maxConstellation ?? MAX_CONSTELLATION) + 1 }).map((_, i) => {
                const isActive = constellation === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setConstellation(i);
                      if (!owned) setOwned(true);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-md)',
                      border: isActive
                        ? i === 6
                          ? '1px solid #fbbf24'
                          : '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      background: isActive
                        ? i === 6
                          ? 'rgba(245, 158, 11, 0.25)'
                          : 'var(--accent-primary)'
                        : 'var(--bg-card)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    C{i}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nível e Ascensão */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <BoundedIntegerInput
              label={`Nível (${CHARACTER_LIMITS.LEVEL.MIN} a ${CHARACTER_LIMITS.LEVEL.MAX}):`}
              min={CHARACTER_LIMITS.LEVEL.MIN}
              max={CHARACTER_LIMITS.LEVEL.MAX}
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

        {/* Nível de Amizade */}
        {character.supportsFriendship === false ? (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              Nível de Amizade:
            </label>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              O Viajante não possui nível de amizade.
            </div>
          </div>
        ) : (
          <div>
            <BoundedIntegerInput
              label={`Nível de Amizade (${CHARACTER_LIMITS.FRIENDSHIP.MIN} a ${CHARACTER_LIMITS.FRIENDSHIP.MAX}, opcional):`}
              min={CHARACTER_LIMITS.FRIENDSHIP.MIN}
              max={CHARACTER_LIMITS.FRIENDSHIP.MAX}
              optional
              placeholder="Ex.: 10"
              value={friendship}
              onChange={setFriendship}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Anotações */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            Notas Pessoais:
          </label>
          <textarea
            rows={3}
            placeholder="Anotações sobre artefatos, armas ideais, time, etc."
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
      </details>
      </ModalBody>
    </Modal>
  );
};

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  isOpen,
  character,
  onClose,
  onSave,
  onToggleOwned,
  isSaving,
}) => {
  if (!isOpen || !character) return null;

  return (
    <CharacterDetailForm
      key={character.characterId}
      character={character}
      onClose={onClose}
      onSave={onSave}
      onToggleOwned={onToggleOwned}
      isSaving={isSaving}
    />
  );
};
