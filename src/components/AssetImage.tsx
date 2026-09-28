import React, { useEffect, useState } from 'react';
import type { AssetRef, AssetVariant } from '../domain/catalog';
import {
  defaultAssetProvider,
  getCharacterPortraitUrl,
  getWeaponIconUrl,
  getArtifactSetIconUrl,
  getMaterialIconUrl,
} from '../infrastructure/providers';

export interface AssetImageProps {
  asset?: AssetRef | null;
  entityType?: 'character' | 'weapon' | 'material' | 'artifact';
  entityId?: string;
  variant?: AssetVariant;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  shape?: 'rounded' | 'circle' | 'square';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

const SHAPE_RADIUS: Record<string, string> = {
  rounded: 'var(--radius-md)',
  circle: 'var(--radius-full)',
  square: '0px',
};

export const AssetImage: React.FC<AssetImageProps> = ({
  asset: initialAsset,
  entityType,
  entityId,
  variant = 'icon',
  alt,
  size = 'md',
  shape = 'rounded',
  className = '',
  style,
  onClick,
}) => {
  const requestKey = entityType && entityId ? `${entityType}:${entityId}:${variant}` : null;
  const activeKey = initialAsset ? (initialAsset.uri || 'custom') : (requestKey || '');

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [asyncAsset, setAsyncAsset] = useState<AssetRef | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [fallbackKey, setFallbackKey] = useState<string | null>(null);

  const useLocalFallback = fallbackKey === activeKey;
  const hasImageError = errorKey === activeKey;

  const isLoading = Boolean(!initialAsset && requestKey && loadedKey !== requestKey);

  useEffect(() => {
    if (initialAsset || !requestKey || !entityType || !entityId) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        let res: AssetRef;
        if (entityType === 'character') {
          res = await defaultAssetProvider.getCharacterAsset(entityId, variant);
        } else if (entityType === 'weapon') {
          res = await defaultAssetProvider.getWeaponAsset(entityId, variant);
        } else if (entityType === 'material') {
          res = await defaultAssetProvider.getMaterialAsset(entityId, variant);
        } else {
          res = await defaultAssetProvider.getArtifactAsset(entityId, variant);
        }

        if (isMounted) {
          setAsyncAsset(res);
          setLoadedKey(requestKey);
        }
      } catch {
        if (isMounted) {
          setErrorKey(requestKey);
          setLoadedKey(requestKey);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialAsset, requestKey, entityType, entityId, variant]);

  const resolvedAsset = initialAsset || (loadedKey === requestKey ? asyncAsset : null);

  const getLocalFallbackUrl = (): string | null => {
    if (!entityId || !entityType) return null;
    if (variant !== 'icon') return null;
    if (entityType === 'character') return getCharacterPortraitUrl(entityId);
    if (entityType === 'weapon') return getWeaponIconUrl(entityId);
    if (entityType === 'artifact') return getArtifactSetIconUrl(entityId);
    if (entityType === 'material') return getMaterialIconUrl(entityId);
    return null;
  };

  const handleImageError = () => {
    if (!useLocalFallback) {
      const fallback = getLocalFallbackUrl();
      if (fallback && fallback !== resolvedAsset?.uri) {
        setFallbackKey(activeKey);
        return;
      }
    }
    setErrorKey(activeKey);
  };

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] || SIZE_MAP.md;
  const borderRadius = SHAPE_RADIUS[shape] || SHAPE_RADIUS.rounded;

  const containerStyle: React.CSSProperties = {
    width: `${dimension}px`,
    height: `${dimension}px`,
    minWidth: `${dimension}px`,
    minHeight: `${dimension}px`,
    borderRadius,
    overflow: 'hidden',
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-xs)',
    userSelect: 'none',
    ...style,
  };

  if (isLoading) {
    return (
      <div
        className={`asset-image-skeleton ${className}`}
        style={{
          ...containerStyle,
          background: 'linear-gradient(90deg, var(--bg-surface-elevated) 0%, rgba(124, 58, 237, 0.15) 50%, var(--bg-surface-elevated) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
        }}
        aria-busy="true"
        aria-label={`Carregando ${alt}...`}
      />
    );
  }

  const localFallbackUrl = useLocalFallback ? getLocalFallbackUrl() : null;
  const currentUri = localFallbackUrl || resolvedAsset?.uri;
  const imageUri = hasImageError || !currentUri ? undefined : currentUri;

  return (
    <div
      className={`asset-image-container ${className}`}
      style={containerStyle}
      onClick={onClick}
      title={resolvedAsset?.label || alt}
    >
      {imageUri ? (
        <img
          src={imageUri}
          alt={alt}
          onError={handleImageError}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: `${Math.round(dimension * 0.45)}px`,
            color: 'var(--accent-primary)',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ✦
        </span>
      )}
    </div>
  );
};
