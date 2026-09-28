import React from 'react';
import type { BuildStatus } from '../../../domain/builds/types';
import {
  BUILD_STATUS_COLORS,
  BUILD_STATUS_LABELS,
} from '../../../domain/builds/validation';

interface BuildStatusBadgeProps {
  status: BuildStatus;
  size?: 'sm' | 'md';
}

export const BuildStatusBadge: React.FC<BuildStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const colors = BUILD_STATUS_COLORS[status] || BUILD_STATUS_COLORS.sem_build;
  const label = BUILD_STATUS_LABELS[status] || 'Sem Build';

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: isSmall ? '2px 7px' : '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 700,
        color: colors.text,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        letterSpacing: '0.01em',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: colors.text,
          boxShadow: `0 0 6px ${colors.text}`,
        }}
      />
      {label}
    </span>
  );
};
