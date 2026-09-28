import React from 'react';
import type { WeaponType } from '../../../domain/catalog';
import type { AccountWeaponWithDetails } from '../../../domain/weapons/types';
import { AssetImage, Badge, Button, Card, CardBody, WeaponTypeIcon } from '../../../components';

interface WeaponCardProps {
  weapon: AccountWeaponWithDetails;
  totalCopiesOfThisWeapon: number;
  onOpenDetails: (weapon: AccountWeaponWithDetails) => void;
  onToggleFavorite: (id: string) => Promise<void>;
  isSaving: boolean;
}

const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  sword: 'Espada',
  claymore: 'Espadão',
  polearm: 'Lança',
  bow: 'Arco',
  catalyst: 'Catalisador',
};

function getRarityColors(rarity: number) {
  switch (rarity) {
    case 5:
      return {
        border: 'rgba(245, 158, 11, 0.45)',
        bg: 'linear-gradient(180deg, rgba(180, 83, 9, 0.22) 0%, rgba(15, 23, 42, 0.65) 100%)',
        starColor: '#fbbf24',
      };
    case 4:
      return {
        border: 'rgba(168, 85, 247, 0.45)',
        bg: 'linear-gradient(180deg, rgba(107, 33, 168, 0.22) 0%, rgba(15, 23, 42, 0.65) 100%)',
        starColor: '#c084fc',
      };
    case 3:
      return {
        border: 'rgba(56, 189, 248, 0.35)',
        bg: 'linear-gradient(180deg, rgba(14, 116, 144, 0.2) 0%, rgba(15, 23, 42, 0.65) 100%)',
        starColor: '#38bdf8',
      };
    default:
      return {
        border: 'rgba(148, 163, 184, 0.25)',
        bg: 'linear-gradient(180deg, rgba(71, 85, 105, 0.15) 0%, rgba(15, 23, 42, 0.65) 100%)',
        starColor: '#94a3b8',
      };
  }
}

export const WeaponCard: React.FC<WeaponCardProps> = ({
  weapon,
  totalCopiesOfThisWeapon,
  onOpenDetails,
  onToggleFavorite,
  isSaving,
}) => {
  const colors = getRarityColors(weapon.rarity);
  const isR5 = weapon.refinement === 5;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onToggleFavorite(weapon.id);
  };

  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => onOpenDetails(weapon)}
    >
      {/* Top Banner */}
      <div
        style={{
          position: 'relative',
          padding: '14px 14px 6px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Weapon Type & Copy Number - Top Left */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <WeaponTypeIcon weaponType={weapon.weaponType} size="xs" />
            <span>{WEAPON_TYPE_LABELS[weapon.weaponType] ?? weapon.weaponType}</span>
          </div>
          {totalCopiesOfThisWeapon > 1 && (
            <div
              style={{
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(59, 130, 246, 0.25)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                fontSize: '10px',
                fontWeight: 700,
                color: '#60a5fa',
              }}
              title={`Cópia #${weapon.instanceNo} de ${totalCopiesOfThisWeapon}`}
            >
              #{weapon.instanceNo}
            </div>
          )}
        </div>

        {/* Refinement Badge & Favorite - Top Right */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <button
            type="button"
            disabled={isSaving}
            onClick={(e) => void handleFavoriteClick(e)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: weapon.favorite ? '#fbbf24' : 'rgba(255, 255, 255, 0.25)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease, color 0.15s ease',
            }}
            title={weapon.favorite ? 'Remover dos favoritos' : 'Favoritar arma'}
          >
            ★
          </button>
          <Badge
            variant={isR5 ? 'warning' : 'primary'}
            size="sm"
            style={{
              fontWeight: 800,
              boxShadow: isR5 ? '0 0 8px rgba(245, 158, 11, 0.45)' : undefined,
            }}
          >
            {isR5 ? 'R5 ★' : `R${weapon.refinement}`}
          </Badge>
        </div>

        {/* Weapon Icon */}
        <div
          style={{
            position: 'relative',
            width: '90px',
            height: '90px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: `2px solid ${colors.border}`,
            background: 'var(--bg-surface)',
            marginTop: '20px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AssetImage
            entityType="weapon"
            entityId={weapon.weaponId}
            alt={weapon.namePtBr}
            size={80}
            shape="square"
          />
        </div>

        {/* Stars */}
        <div
          style={{
            color: colors.starColor,
            fontSize: '13px',
            letterSpacing: '2px',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}
        >
          {'★'.repeat(weapon.rarity)}
        </div>
      </div>

      {/* Content Area */}
      <CardBody
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h4
            style={{
              margin: '0 0 4px 0',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={weapon.namePtBr}
          >
            {weapon.namePtBr}
          </h4>

          {/* Level & Ascension Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}
          >
            <span>Nv. <strong style={{ color: 'var(--text-primary)' }}>{weapon.level}</strong>/90</span>
            <span>•</span>
            <span>Fase {weapon.ascension}</span>
          </div>

          {/* Equipped Character Pill */}
          <div
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              background: weapon.equippedCharacterId ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface)',
              border: weapon.equippedCharacterId
                ? '1px solid rgba(59, 130, 246, 0.25)'
                : '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: weapon.equippedCharacterId ? 'var(--text-primary)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {weapon.equippedCharacterId ? (
              <>
                {weapon.equippedCharacterIconUrl && (
                  <img
                    src={weapon.equippedCharacterIconUrl}
                    alt=""
                    style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                  />
                )}
                <span>Equipada: <strong>{weapon.equippedCharacterName || weapon.equippedCharacterId}</strong></span>
              </>
            ) : (
              <span>Desequipada</span>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          <Button
            variant="secondary"
            size="sm"
            style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(weapon);
            }}
          >
            Editar Detalhes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
