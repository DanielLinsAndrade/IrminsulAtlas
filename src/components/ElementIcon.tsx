import React from 'react';
import type { Element } from '../domain/catalog';
import { getElementIconUrl } from '../infrastructure/providers/uiAssetRegistry';

export interface ElementIconProps {
  element: Element;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}

const ELEMENT_COLORS: Record<Element, { primary: string; bg: string; border: string; glow: string; label: string }> = {
  pyro: {
    primary: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    glow: 'rgba(239, 68, 68, 0.3)',
    label: 'Pyro',
  },
  hydro: {
    primary: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.15)',
    border: 'rgba(14, 165, 233, 0.4)',
    glow: 'rgba(14, 165, 233, 0.3)',
    label: 'Hydro',
  },
  anemo: {
    primary: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.15)',
    border: 'rgba(20, 184, 166, 0.4)',
    glow: 'rgba(20, 184, 166, 0.3)',
    label: 'Anemo',
  },
  electro: {
    primary: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)',
    glow: 'rgba(168, 85, 247, 0.3)',
    label: 'Electro',
  },
  dendro: {
    primary: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.4)',
    glow: 'rgba(34, 197, 94, 0.3)',
    label: 'Dendro',
  },
  cryo: {
    primary: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
    glow: 'rgba(56, 189, 248, 0.3)',
    label: 'Cryo',
  },
  geo: {
    primary: '#eab308',
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.4)',
    glow: 'rgba(234, 179, 8, 0.3)',
    label: 'Geo',
  },
};

const SIZE_MAP: Record<string, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

function renderElementSvg(element: Element, color: string, pxSize: number): React.JSX.Element {
  switch (element) {
    case 'pyro':
      // Chama estilizada de Pyro
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A4 4 0 0 0 12 17a4 4 0 0 0 4-4c0-2-1.5-3.5-2.5-4.5C12.5 7.5 12 5 12 3c-2 2-4 5-4 8 0 1.2.5 2.5 1.5 3.5" fill={color} fillOpacity="0.25" />
          <path d="M12 12c.5 1 1 2 0 3-.8 0-1.2-.5-1.2-1.2 0-.8.7-1.3 1.2-1.8z" fill={color} />
        </svg>
      );
    case 'hydro':
      // Gota d'água / Ondas de Hydro
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill={color} fillOpacity="0.25" />
          <path d="M12 9a4 4 0 0 0-4 4" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'anemo':
      // Espiral de Vento / Asas de Anemo
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
        </svg>
      );
    case 'electro':
      // Raio estilizado de Electro
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity="0.25" />
        </svg>
      );
    case 'dendro':
      // Folha / Broto de Dendro
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill={color} fillOpacity="0.25" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case 'cryo':
      // Floco de Neve / Cristal de Cryo
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );
    case 'geo':
      // Cristal de Diamante / Losango geométrico de Geo
      return (
        <svg width={pxSize} height={pxSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 12 12 22 2 12" fill={color} fillOpacity="0.25" />
          <polygon points="12 6 18 12 12 18 6 12" stroke={color} strokeWidth="1.5" />
        </svg>
      );
  }
}

export const ElementIcon: React.FC<ElementIconProps> = ({
  element,
  size = 'md',
  className = '',
  style,
  showLabel = false,
}) => {
  const [useFallback, setUseFallback] = React.useState<boolean>(false);
  const meta = ELEMENT_COLORS[element] || ELEMENT_COLORS.anemo;
  const pxSize = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;
  const iconUrl = getElementIconUrl(element);

  return (
    <span
      className={`element-icon element-icon--${element} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        verticalAlign: 'middle',
        ...style,
      }}
      title={meta.label}
      aria-label={`Elemento ${meta.label}`}
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
          renderElementSvg(element, meta.primary, pxSize)
        )}
      </span>
      {showLabel && (
        <span style={{ color: meta.primary, fontWeight: 600, fontSize: `${Math.max(12, pxSize * 0.7)}px` }}>
          {meta.label}
        </span>
      )}
    </span>
  );
};
