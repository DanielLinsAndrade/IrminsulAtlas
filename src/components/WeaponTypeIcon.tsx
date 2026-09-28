import React from 'react';
import type { WeaponType } from '../domain/catalog';
import { getWeaponTypeIconUrl } from '../infrastructure/providers/uiAssetRegistry';

export interface WeaponTypeIconProps {
  weaponType: WeaponType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
  color?: string;
}

const WEAPON_LABELS: Record<WeaponType, string> = {
  sword: 'Espada',
  claymore: 'Espadão',
  polearm: 'Lança',
  bow: 'Arco',
  catalyst: 'Catalisador',
};

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
};

function renderWeaponSvg(type: WeaponType, color: string, pxSize: number): React.JSX.Element {
  switch (type) {
    case 'sword':
      // Espada de uma mão
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
          <line x1="13" x2="19" y1="19" y2="13" />
          <line x1="16" x2="20" y1="16" y2="20" />
          <line x1="19" x2="21" y1="21" y2="19" />
        </svg>
      );
    case 'claymore':
      // Espadão de duas mãos
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 4l6 6-12 12-4-2 2-4L14 4z" />
          <path d="M12 8l4 4" />
          <line x1="4" y1="20" x2="2" y2="22" strokeWidth="2.5" />
        </svg>
      );
    case 'polearm':
      // Lança / Ponta de lança
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 3l-6 2-3 5 2 2 5-3 2-6z" fill={color} fillOpacity="0.2" />
          <line x1="12" y1="12" x2="3" y2="21" />
        </svg>
      );
    case 'bow':
      // Arco
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3c5.5 0 10 4.5 10 10s-4.5 10-10 10" />
          <line x1="6" y1="3" x2="6" y2="23" />
          <line x1="3" y1="13" x2="18" y2="13" strokeDasharray="1 1" />
          <polyline points="15 10 18 13 15 16" />
        </svg>
      );
    case 'catalyst':
      // Catalisador (Grimório / Esfera Mágica)
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h8" />
        </svg>
      );
  }
}

export const WeaponTypeIcon: React.FC<WeaponTypeIconProps> = ({
  weaponType,
  size = 'md',
  className = '',
  style,
  showLabel = false,
  color = 'currentColor',
}) => {
  const [useFallback, setUseFallback] = React.useState<boolean>(false);
  const label = WEAPON_LABELS[weaponType] || weaponType;
  const pxSize = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;
  const iconUrl = getWeaponTypeIconUrl(weaponType);

  return (
    <span
      className={`weapon-type-icon weapon-type-icon--${weaponType} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        verticalAlign: 'middle',
        ...style,
      }}
      title={label}
      aria-label={`Tipo de arma: ${label}`}
      role="img"
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${pxSize}px`,
          height: `${pxSize}px`,
          flexShrink: 0,
        }}
      >
        {!useFallback ? (
          <img
            src={iconUrl}
            alt={label}
            width={pxSize}
            height={pxSize}
            style={{
              width: `${pxSize}px`,
              height: `${pxSize}px`,
              objectFit: 'contain',
              display: 'block',
            }}
            draggable={false}
            onError={() => setUseFallback(true)}
          />
        ) : (
          renderWeaponSvg(weaponType, color, pxSize)
        )}
      </span>
      {showLabel && <span style={{ fontWeight: 500, fontSize: '13px' }}>{label}</span>}
    </span>
  );
};
