import React from 'react';
import type { ArtifactSlotKey } from '../domain/builds/types';
import { getArtifactSlotIconUrl } from '../infrastructure/providers/uiAssetRegistry';

export interface ArtifactSlotIconProps {
  slotKey: ArtifactSlotKey;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
  color?: string;
}

const SLOT_LABELS: Record<ArtifactSlotKey, { label: string; short: string }> = {
  flower: { label: 'Flor da Vida', short: 'Flor' },
  plume: { label: 'Pluma da Morte', short: 'Pena' },
  sands: { label: 'Areia do Tempo', short: 'Relógio' },
  goblet: { label: 'Cálice de Erátema', short: 'Cálice' },
  circlet: { label: 'Tiara de Logos', short: 'Coroa' },
};

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
};

function renderSlotSvg(slot: ArtifactSlotKey, color: string, pxSize: number): React.JSX.Element {
  switch (slot) {
    case 'flower':
      // Flor de 5 pétalas
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.3" />
          <path d="M12 2a4 4 0 0 0-4 4c0 3 4 6 4 6s4-3 4-6a4 4 0 0 0-4-4z" />
          <path d="M22 12a4 4 0 0 0-4-4c-3 0-6 4-6 4s3 4 6 4a4 4 0 0 0 4-4z" />
          <path d="M12 22a4 4 0 0 0 4-4c0-3-4-6-4-6s-4 3-4 6a4 4 0 0 0 4 4z" />
          <path d="M2 12a4 4 0 0 0 4 4c3 0 6-4 6-4s-3-4-6-4a4 4 0 0 0-4 4z" />
        </svg>
      );
    case 'plume':
      // Pluma / Pena estilizada
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
          <line x1="16" y1="8" x2="2" y2="22" />
          <line x1="17.5" y1="15" x2="9" y2="15" />
        </svg>
      );
    case 'sands':
      // Ampulheta / Areia do tempo
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 22h14" />
          <path d="M5 2h14" />
          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
        </svg>
      );
    case 'goblet':
      // Cálice de Erátema
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 22h8" />
          <path d="M12 15v7" />
          <path d="M5 3h14c0 6-3 10-7 10S5 9 5 3z" fill={color} fillOpacity="0.2" />
        </svg>
      );
    case 'circlet':
      // Tiara / Coroa de Logos
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
          <circle cx="12" cy="4" r="1" fill={color} />
          <circle cx="6" cy="4" r="1" fill={color} />
          <circle cx="18" cy="4" r="1" fill={color} />
        </svg>
      );
  }
}

export const ArtifactSlotIcon: React.FC<ArtifactSlotIconProps> = ({
  slotKey,
  size = 'md',
  className = '',
  style,
  showLabel = false,
  color = 'currentColor',
}) => {
  const [useFallback, setUseFallback] = React.useState<boolean>(false);
  const meta = SLOT_LABELS[slotKey] || { label: slotKey, short: slotKey };
  const pxSize = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;
  const iconUrl = getArtifactSlotIconUrl(slotKey);

  return (
    <span
      className={`artifact-slot-icon artifact-slot-icon--${slotKey} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        verticalAlign: 'middle',
        ...style,
      }}
      title={meta.label}
      aria-label={`Slot de artefato: ${meta.label}`}
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
            alt={meta.label}
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
          renderSlotSvg(slotKey, color, pxSize)
        )}
      </span>
      {showLabel && <span style={{ fontWeight: 500, fontSize: '13px' }}>{meta.short}</span>}
    </span>
  );
};
