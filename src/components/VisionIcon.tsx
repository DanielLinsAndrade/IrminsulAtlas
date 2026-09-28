import React, { useState } from 'react';
import type { Element } from '../domain/catalog';
import { getCharacterVisionUrl, getElementIconUrl } from '../infrastructure/providers';

export interface VisionIconProps {
  element: Element;
  region?: string | null;
  characterId?: string;
  arkhe?: 'pneuma' | 'ousia' | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
};

export const VisionIcon: React.FC<VisionIconProps> = ({
  element,
  region,
  characterId,
  arkhe,
  size = 'md',
  className = '',
  style,
  title,
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;

  const visionSrc = getCharacterVisionUrl({
    element,
    region,
    characterId,
    arkhe,
  });

  const fallbackSrc = getElementIconUrl(element);
  const finalSrc = hasError ? fallbackSrc : visionSrc;

  return (
    <img
      src={finalSrc}
      alt={title || `Visão ${element}`}
      title={title || `Visão ${element} (${region || 'Teyvat'})`}
      className={className}
      draggable={false}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.4))',
        ...style,
      }}
    />
  );
};
