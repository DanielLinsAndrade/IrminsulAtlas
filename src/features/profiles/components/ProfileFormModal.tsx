import React, { useEffect, useRef, useState } from 'react';
import type { CreateProfileInput, Profile, UpdateProfileInput } from '../../../domain/profiles';
import { validateProfileInput } from '../../../domain/profiles';
import { PROFILE_LIMITS } from '../../../domain/constants/limits';
import { lookupPublicProfile, resolveProfileAvatar } from '../../../infrastructure/providers/publicProfileProvider';
import {
  BoundedIntegerInput,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  Select,
} from '../../../components';

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateProfileInput | UpdateProfileInput) => Promise<void>;
  initialProfile?: Profile | null;
}

export const ProfileFormModal: React.FC<ProfileFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}) => {
  const isEditing = Boolean(initialProfile);

  const [name, setName] = useState<string>(initialProfile?.name ?? '');
  const [uid, setUid] = useState<string>(initialProfile?.uid ?? '');
  const [server, setServer] = useState<string>(initialProfile?.server ?? 'América');
  const [adventureRank, setAdventureRank] = useState<number | null>(
    initialProfile?.adventureRank ?? null
  );
  const [worldLevel, setWorldLevel] = useState<number | null>(
    initialProfile?.worldLevel ?? null
  );
  const [travelerGender, setTravelerGender] = useState<string>(
    initialProfile?.travelerGender ?? ''
  );
  const [notes, setNotes] = useState<string>(initialProfile?.notes ?? '');
  const [avatarCharacterId, setAvatarCharacterId] = useState(initialProfile?.avatarCharacterId ?? null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const syncRequest = useRef(0);

  async function synchronize() {
    const request = ++syncRequest.current;
    const requestedUid = uid;
    setSyncing(true); setSyncMessage('');
    try {
      const result = await lookupPublicProfile(requestedUid);
      if (request !== syncRequest.current) return;
      if (result.profile.nickname.trim()) setName(result.profile.nickname); setAdventureRank(result.profile.adventureRank); setWorldLevel(result.profile.worldLevel);
      setAvatarCharacterId(resolveProfileAvatar(result.profile.avatarId));
      setSyncMessage(`${result.stale ? 'Sem conexão: dados do cache' : 'Dados públicos do Enka'} · ${result.profile.signature || 'Sem assinatura pública'}. Revise e salve para aplicar ao perfil.`);
    } catch (cause) { if (request === syncRequest.current) setSyncMessage(`Não foi possível sincronizar. Dados manuais preservados. ${String(cause)}`); }
    finally { if (request === syncRequest.current) setSyncing(false); }
  }

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Foco acessível imediato sem saltos ou rolagem involuntária de ancestrais
      const timer = setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateProfileInput = {
      name,
      uid: uid.trim() || null,
      server,
      adventureRank,
      worldLevel,
      travelerGender: travelerGender === 'lumine' || travelerGender === 'aether' ? travelerGender : null,
      notes: notes.trim() || null,
      avatarCharacterId,
    };

    const validation = validateProfileInput(payload, !isEditing);
    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Erro ao salvar perfil.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Perfil' : 'Novo Perfil de Conta'}
      ariaLabelledBy="modal-profile-title"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <ModalBody>
          {errors.form && (
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
              {errors.form}
            </div>
          )}

          <Input
            ref={nameInputRef}
            label="Nome do Perfil *"
            placeholder="ex.: Aranat Principal ou Conta Secundária F2P"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />

          <div className="ui-panel"><Button type="button" variant="secondary" disabled={syncing || !/^\d{9,10}$/.test(uid)} onClick={() => void synchronize()}>{syncing ? 'Consultando…' : 'Consultar perfil público por UID'}</Button><p className="ui-muted">Envia somente o UID ao Enka.Network, serviço comunitário. Seus dados locais só mudam ao salvar.</p>{syncMessage && <p role="status">{syncMessage}</p>}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input
              label="UID no Genshin (Opcional)"
              placeholder="ex.: 601234567"
              value={uid}
              inputMode="numeric"
              onChange={(e) => { syncRequest.current++; setSyncing(false); setSyncMessage(''); setUid(e.target.value.replace(/\D/g, '')); }}
              error={errors.uid}
              maxLength={10}
            />

            <Select
              label="Servidor"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              options={[
                { value: 'América', label: 'América' },
                { value: 'Europa', label: 'Europa' },
                { value: 'Ásia', label: 'Ásia' },
                { value: 'TW/HK/MO', label: 'TW / HK / MO' },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <BoundedIntegerInput
              label="AR (1-60)"
              min={PROFILE_LIMITS.ADVENTURE_RANK.MIN}
              max={PROFILE_LIMITS.ADVENTURE_RANK.MAX}
              placeholder="ex.: 60"
              optional
              value={adventureRank}
              onChange={setAdventureRank}
              error={errors.adventureRank}
            />

            <BoundedIntegerInput
              label="Nível Mundo (0-9)"
              min={PROFILE_LIMITS.WORLD_LEVEL.MIN}
              max={PROFILE_LIMITS.WORLD_LEVEL.MAX}
              placeholder="ex.: 8"
              optional
              value={worldLevel}
              onChange={setWorldLevel}
              error={errors.worldLevel}
            />

            <Select
              label="Viajante"
              value={travelerGender}
              onChange={(e) => setTravelerGender(e.target.value)}
              options={[
                { value: 'lumine', label: 'Lumine (F)' },
                { value: 'aether', label: 'Aether (M)' },
                { value: '', label: 'Não informado' },
              ]}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações pessoais deste perfil..."
              rows={3}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontSize: 'var(--text-sm)',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </ModalBody>

        {isEditing && travelerGender !== (initialProfile?.travelerGender ?? '') && <p className="ui-muted" role="status">Ao trocar o protagonista, o progresso e as builds do anterior serão arquivados no backup interno do perfil, sem transferência para o novo protagonista.</p>}
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={syncing}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
