import React from 'react';

export interface PityProgressBarProps {
  current: number;
  max: number;
  softPity: number;
  label?: string;
  size?: 'sm' | 'md';
}

export const PityProgressBar: React.FC<PityProgressBarProps> = ({
  current,
  max,
  softPity,
  label,
  size = 'md',
}) => {
  const percentage = Math.min(100, Math.round((current / max) * 100));
  const isSoftPity = current >= softPity;
  const height = size === 'sm' ? '6px' : '8px';
  
  const fillBackground = isSoftPity 
    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
    : 'linear-gradient(90deg, #6366f1, #38bdf8)';

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{
        width: '100%',
        height,
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: fillBackground,
          transition: 'width 0.3s ease',
          borderRadius: '9999px',
        }}
      />
    </div>
  );
};
