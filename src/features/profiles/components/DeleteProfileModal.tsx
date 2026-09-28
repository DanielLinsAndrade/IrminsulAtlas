import React, { useState } from 'react';
import type { Profile } from '../../../domain/profiles';
import { Button, Modal, ModalBody } from '../../../components';

interface DeleteProfileModalProps {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onConfirmDelete: (profileId: string) => Promise<void>;
}

export const DeleteProfileModal: React.FC<DeleteProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !profile) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirmDelete(profile.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir perfil.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excluir Perfil"
      icon={<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ color: 'var(--color-danger)' }}><path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M12 9v5m0 3v1" stroke="currentColor" strokeWidth="2"/></svg>}
      ariaLabelledBy="modal-delete-profile-title"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleConfirm}
            isLoading={isDeleting}
          >
            Sim, Excluir Perfil
          </Button>
        </>
      }
    >
      <ModalBody>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger-border)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {error}
          </div>
        )}

        <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          Tem certeza de que deseja excluir permanentemente o perfil <strong>"{profile.name}"</strong>?
        </p>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            <span>Atenção: Ação irreversível</span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Todos os dados locais associados a este perfil — incluindo histórico de desejos, contagem de pity, recursos e metas — serão excluídos do banco SQLite.
          </p>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: '#c4b5fd', fontSize: '14px' }}>✦</span>
          <span>
            <strong>Dica de Segurança:</strong> Recomendamos gerar um backup de seus dados antes da exclusão definitiva.
          </span>
        </div>
      </ModalBody>
    </Modal>
  );
};
