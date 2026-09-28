import React from 'react';
import type { ArtifactSlot } from '../../../domain/builds/types';
import { ARTIFACT_SLOT_NAMES } from '../../../domain/builds/validation';
import { ArtifactSlotIcon } from '../../../components';

interface ArtifactSlotCardProps {
  slot: ArtifactSlot;
  setName?: string | null;
  setIconUrl?: string | null;
  compact?: boolean;
  onClick?: () => void;
}

export const ArtifactSlotCard: React.FC<ArtifactSlotCardProps> = ({
  slot,
  setName,
  setIconUrl,
  compact = false,
  onClick,
}) => {
  const meta = ARTIFACT_SLOT_NAMES[slot.slotKey];
  const isMaxed = slot.level >= slot.targetLevel && slot.level > 0;
  const isEquipped = slot.isEquipped || Boolean(slot.setId) || Boolean(slot.mainStat);

  if (compact) {
    return (
      <div
        onClick={onClick}
        title={`${meta.label}: ${setName || 'Sem conjunto'} • ${slot.mainStat || 'Stat pendente'} (+${slot.level})`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 4px',
          borderRadius: 'var(--radius-sm)',
          background: isEquipped ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.4)',
          border: isMaxed
            ? '1px solid #10b981'
            : isEquipped
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : '1px dashed rgba(148, 163, 184, 0.25)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          minWidth: 0,
          width: '100%',
        }}
      >
        <ArtifactSlotIcon slotKey={slot.slotKey} size="sm" color={isEquipped ? '#fbbf24' : 'var(--text-muted)'} />
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: isMaxed ? '#34d399' : isEquipped ? '#fbbf24' : 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          {isEquipped ? `+${slot.level}` : '-'}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: isEquipped ? 'var(--bg-surface)' : 'rgba(15, 23, 42, 0.3)',
        border: isMaxed
          ? '1px solid rgba(16, 185, 129, 0.5)'
          : isEquipped
          ? '1px solid var(--border-subtle)'
          : '1px dashed rgba(148, 163, 184, 0.3)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <ArtifactSlotIcon slotKey={slot.slotKey} size="md" color={isEquipped ? '#fbbf24' : 'var(--text-secondary)'} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {meta.label}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: isEquipped ? 'var(--text-secondary)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {setName ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {setIconUrl && (
                  <img
                    src={setIconUrl}
                    alt=""
                    style={{ width: '15px', height: '15px', objectFit: 'contain', verticalAlign: 'middle', flexShrink: 0 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <strong style={{ color: '#c084fc' }}>{setName}</strong>
              </span>
            ) : (
              'Sem conjunto definido'
            )}
            {slot.mainStat && ` • ${slot.mainStat}`}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 800,
            color: isMaxed ? '#34d399' : isEquipped ? '#fbbf24' : 'var(--text-muted)',
            background: isMaxed
              ? 'rgba(16, 185, 129, 0.15)'
              : isEquipped
              ? 'rgba(245, 158, 11, 0.15)'
              : 'rgba(148, 163, 184, 0.1)',
            border: `1px solid ${
              isMaxed
                ? 'rgba(16, 185, 129, 0.4)'
                : isEquipped
                ? 'rgba(245, 158, 11, 0.3)'
                : 'transparent'
            }`,
          }}
        >
          +{slot.level}
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
            /{slot.targetLevel}
          </span>
        </div>
      </div>
    </div>
  );
};
