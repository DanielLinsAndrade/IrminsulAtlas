import React, { useEffect, useRef, useState } from 'react';
import { useShell } from '../../../app/providers';
import { Badge, Button } from '../../../components';
import { ProfileFormModal } from './ProfileFormModal';
import type { CreateProfileInput } from '../../../domain/profiles';
import { SyncedProfileIdentity } from './SyncedProfileIdentity';
import { usePublicProfile } from '../../../hooks/usePublicProfile';

export const ProfileSelectorDropdown: React.FC = () => {
  const {
    activeProfile,
    profiles,
    switchProfile,
    createProfile,
    navigateTo,
  } = useShell();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hasProfiles = profiles.length > 0;
  const synced = usePublicProfile(activeProfile?.uid);
  const profileName = synced?.nickname || activeProfile?.name || 'Criar Perfil';
  const profileSub = activeProfile
    ? `AR ${synced?.adventureRank ?? activeProfile.adventureRank ?? '—'} • ${activeProfile.server}`
    : 'Nenhum perfil ativo';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setIsOpen(false); dropdownRef.current?.querySelector('button')?.focus(); } }}>
      {/* Botão Gatilho do Perfil no Header */}
      <button
        type="button"
        className="header-profile-card"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={hasProfiles ? 'Alternar ou gerenciar perfis de conta' : 'Criar seu primeiro perfil de conta'}
        style={{ border: isOpen ? '1px solid var(--border-focus)' : undefined }}
      >
        <div className="header-profile-avatar-wrapper">
          <div
            className="header-profile-avatar"
            style={{
              background: activeProfile
                ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              border: activeProfile
                ? '1.5px solid rgba(255, 255, 255, 0.25)'
                : '1.5px dashed var(--border-default)',
              color: activeProfile ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            {activeProfile ? <SyncedProfileIdentity profile={activeProfile} compact /> : '+'}
          </div>
          {activeProfile && <span className="header-profile-status-dot" aria-label="Perfil ativo" />}
        </div>

        <div className="header-profile-info">
          <span className="header-profile-name">{profileName}</span>
          <span className="header-profile-role">{profileSub}</span>
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <span>Perfis ({profiles.length})</span>
            <span style={{ color: 'var(--text-secondary)' }}>Locais</span>
          </div>

          <div className="dropdown-list">
            {profiles.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                  Nenhum perfil cadastrado ainda.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  style={{ width: '100%' }}
                >
                  + Criar Primeiro Perfil
                </Button>
              </div>
            ) : (
              profiles.map((p) => {
                const isActive = p.id === activeProfile?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`dropdown-item ${isActive ? 'dropdown-item--active' : ''}`}
                    onClick={async () => {
                      if (!isActive) {
                        await switchProfile(p.id);
                      }
                      setIsOpen(false);
                    }}
                  >
                    <SyncedProfileIdentity profile={p} compact />

                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        AR {p.adventureRank ?? '—'} • {p.server}
                      </div>
                    </div>

                    {isActive && (
                      <Badge variant="primary" size="sm">
                        Ativo
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="dropdown-footer">
            {profiles.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateModalOpen(true);
                }}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <span style={{ fontSize: '14px' }}>+</span>
                <span>Novo Perfil</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                navigateTo('settings');
              }}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <span>Gerenciar Perfis</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Criação disparado pelo Dropdown */}
      <ProfileFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={async (input) => {
          await createProfile(input as CreateProfileInput);
        }}
      />
    </div>
  );
};
