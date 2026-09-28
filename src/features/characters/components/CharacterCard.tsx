import React from 'react';
import type { AccountCharacterWithDetails } from '../../../domain/characters/types';
import type { Element, WeaponType } from '../../../domain/catalog';
import { AssetImage, Badge, Button, Card, CardBody, VisionIcon, WeaponTypeIcon } from '../../../components';
import { UI_ASSETS } from '../../../infrastructure/providers';

interface CharacterCardProps {
  character: AccountCharacterWithDetails;
  onToggleOwned: (characterId: string) => Promise<void>;
  onSetConstellation: (characterId: string, constellation: number) => Promise<void>;
  onOpenDetails: (character: AccountCharacterWithDetails) => void;
  isSaving: boolean;
}

const ELEMENT_CONFIG: Record<Element, { label: string; color: string; bg: string }> = {
  pyro: { label: 'Pyro', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  hydro: { label: 'Hydro', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
  anemo: { label: 'Anemo', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)' },
  electro: { label: 'Electro', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  dendro: { label: 'Dendro', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  cryo: { label: 'Cryo', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  geo: { label: 'Geo', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
};

const WEAPON_LABELS: Record<WeaponType, string> = {
  sword: 'Espada',
  claymore: 'Espadão',
  polearm: 'Lança',
  bow: 'Arco',
  catalyst: 'Catalisador',
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onToggleOwned,
  onSetConstellation,
  onOpenDetails,
  isSaving,
}) => {
  const el = ELEMENT_CONFIG[character.element] || ELEMENT_CONFIG.electro;
  const is5Star = character.rarity === 5;
  const rarityColor = is5Star ? '#fbbf24' : '#c084fc';
  const rarityBg = is5Star
    ? 'linear-gradient(180deg, rgba(180, 83, 9, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)'
    : 'linear-gradient(180deg, rgba(107, 33, 168, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)';

  const maxC = character.maxConstellation ?? 6;

  const handleConstellationChange = async (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const next = Math.max(0, Math.min(maxC, character.constellation + delta));
    if (next !== character.constellation) {
      await onSetConstellation(character.characterId, next);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onToggleOwned(character.characterId);
  };

  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        border: character.owned
          ? `1px solid ${is5Star ? 'rgba(245, 158, 11, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`
          : '1px solid var(--border-subtle)',
        opacity: character.owned ? 1 : 0.65,
        background: character.owned ? rarityBg : 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner / Portrait Area */}
      <div
        style={{
          position: 'relative',
          padding: '16px 16px 8px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Element / Canonical Vision - Top Left */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
          title={`Visão: ${el.label} (${character.region || 'Teyvat'})`}
        >
          <VisionIcon
            element={character.element}
            region={character.region}
            characterId={character.characterId}
            size={28}
          />
        </div>

        {/* Constellation / Status Badge - Top Right */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            height: '28px',
          }}
        >
          {character.owned ? (
            <Badge
              variant={character.constellation === maxC ? 'warning' : 'primary'}
              size="sm"
              style={{
                fontWeight: 700,
                boxShadow:
                  character.constellation === maxC && maxC > 0
                    ? '0 0 8px rgba(245, 158, 11, 0.4)'
                    : undefined,
              }}
            >
              {maxC === 0
                ? 'C0 (Máx)'
                : character.constellation === maxC
                ? `C${maxC} ★`
                : `C${character.constellation}`}
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Não Possui
            </Badge>
          )}
        </div>

        {/* Character Portrait with Glow */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${character.owned ? rarityColor : 'var(--border-subtle)'}`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            boxShadow: character.owned ? `0 0 12px ${rarityColor}30` : 'none',
            filter: character.owned ? 'none' : 'grayscale(80%)',
            cursor: 'pointer',
          }}
          onClick={() => onOpenDetails(character)}
        >
          <AssetImage
            entityType="character"
            entityId={character.characterId}
            alt={character.namePtBr}
            size={84}
            shape="square"
          />
        </div>

        {/* Rarity Stars */}
        <div
          style={{
            display: 'flex',
            gap: '2px',
            marginTop: '6px',
            color: rarityColor,
            fontSize: '13px',
            letterSpacing: '1px',
          }}
        >
          {'★'.repeat(character.rarity)}
        </div>

        {/* Level Tag if Owned */}
        {character.owned && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '2px',
              fontWeight: 500,
            }}
          >
            Nv. {character.level}/90 • Asc. {character.ascension}
          </div>
        )}
      </div>

      <CardBody
        style={{
          padding: '10px 14px 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        {/* Name and Weapon Info */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: '1.2',
              minHeight: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
            title={character.namePtBr}
          >
            {character.namePtBr}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <WeaponTypeIcon weaponType={character.weaponType} size={13} />
              <span>{WEAPON_LABELS[character.weaponType] ?? character.weaponType}</span>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: el.color, fontWeight: 600 }}>
              <img
                src={UI_ASSETS.elements[character.element]}
                alt={el.label}
                style={{ width: '14px', height: '14px', objectFit: 'contain' }}
              />
              <span>{el.label}</span>
            </span>
          </div>
        </div>

        {/* Actions & Constellation Stepper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {character.owned ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.5)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Constelação:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={character.constellation <= 0 || isSaving}
                  onClick={(e) => void handleConstellationChange(e, -1)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: character.constellation <= 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: character.constellation <= 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                  title="Diminuir constelação"
                >
                  -
                </button>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    minWidth: '24px',
                    textAlign: 'center',
                    color: character.constellation === 6 ? '#fbbf24' : 'var(--text-primary)',
                  }}
                >
                  C{character.constellation}
                </span>
                <button
                  type="button"
                  disabled={character.constellation >= maxC || isSaving}
                  onClick={(e) => void handleConstellationChange(e, 1)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: character.constellation >= maxC ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: character.constellation >= maxC ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                  title={maxC === 0 ? 'Constelação fixa' : 'Aumentar constelação'}
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={(e) => void handleToggle(e)}
              style={{ width: '100%', fontSize: '12px' }}
            >
              + Marcar como Obtido
            </Button>
          )}

          {/* Quick Buttons: Details & Ownership Toggle */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenDetails(character)}
              style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
            >
              Detalhes
            </Button>
            {character.owned && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={(e) => void handleToggle(e)}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  color: 'var(--text-muted)',
                }}
                title="Desmarcar posse deste personagem"
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
