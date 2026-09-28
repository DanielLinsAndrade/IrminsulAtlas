import React, { useState } from 'react';
import { BoundedIntegerInput, Button, Modal, ModalBody, ModalFooter } from '../../../components';
import { BANNER_LABELS, getBannerPityLimits } from '../../../domain/wishes/types';
import type { BannerType, SetBannerCurrentPityInput } from '../../../domain/wishes/types';

export interface EditCurrentPityModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerType: BannerType;
  current5StarPity: number;
  current4StarPity: number;
  onSave: (bannerType: BannerType, input: SetBannerCurrentPityInput) => Promise<void>;
  isSaving?: boolean;
}

interface EditCurrentPityContentProps {
  bannerType: BannerType;
  current5StarPity: number;
  current4StarPity: number;
  onClose: () => void;
  onSave: (bannerType: BannerType, input: SetBannerCurrentPityInput) => Promise<void>;
  isSaving: boolean;
}

const EditCurrentPityContent: React.FC<EditCurrentPityContentProps> = ({
  bannerType,
  current5StarPity,
  current4StarPity,
  onClose,
  onSave,
  isSaving,
}) => {
  const limits = getBannerPityLimits(bannerType);
  const [fiveStarPity, setFiveStarPity] = useState<number>(current5StarPity);
  const [fourStarPity, setFourStarPity] = useState<number>(current4StarPity);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(bannerType, {
        current5StarPity: fiveStarPity ?? 0,
        current4StarPity: fourStarPity ?? 0,
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar o pity atual do banner.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fiveStarPresets = bannerType === 'weapon' ? [0, 20, 40, 60, 63] : [0, 20, 40, 60, 74];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
      <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#bae6fd',
          }}
        >
          <strong>Atenção:</strong> Este contador reflete o número de tiros já acumulados no jogo
          sem obter item 5★ ou 4★. Ele é armazenado de forma <strong>independente</strong> do histórico
          de orações e nunca é sobrescrito por registros do histórico.
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <BoundedIntegerInput
            id="current-5star-pity-input"
            label="Pity 5 Estrelas Atual"
            helperText={`Limite: 0 a ${limits.max5StarPity} tiros (hard pity no ${limits.hardPity5Star}º tiro, soft pity no ${limits.softPity5Star}º)`}
            min={0}
            max={limits.max5StarPity}
            value={fiveStarPity}
            onChange={(val) => setFiveStarPity(val ?? 0)}
            presets={fiveStarPresets}
            disabled={isSubmitting || isSaving}
            autoFocus
          />
        </div>

        <div>
          <BoundedIntegerInput
            id="current-4star-pity-input"
            label="Pity 4 Estrelas Atual"
            helperText={`Limite: 0 a ${limits.max4StarPity} tiros (garantia no ${limits.hardPity4Star}º tiro)`}
            min={0}
            max={limits.max4StarPity}
            value={fourStarPity}
            onChange={(val) => setFourStarPity(val ?? 0)}
            presets={[0, 3, 5, 8, 9]}
            disabled={isSubmitting || isSaving}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting || isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isSaving}
        >
          {isSubmitting || isSaving ? 'Salvando...' : 'Salvar Pity'}
        </Button>
      </ModalFooter>
    </form>
  );
};

export const EditCurrentPityModal: React.FC<EditCurrentPityModalProps> = ({
  isOpen,
  onClose,
  bannerType,
  current5StarPity,
  current4StarPity,
  onSave,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  const bannerLabel = BANNER_LABELS[bannerType] || bannerType;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Pity Atual — ${bannerLabel}`}
      maxWidth="500px"
    >
      <EditCurrentPityContent
        key={`${bannerType}_${current5StarPity}_${current4StarPity}`}
        bannerType={bannerType}
        current5StarPity={current5StarPity}
        current4StarPity={current4StarPity}
        onClose={onClose}
        onSave={onSave}
        isSaving={isSaving}
      />
    </Modal>
  );
};
