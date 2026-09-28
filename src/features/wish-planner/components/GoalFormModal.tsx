import { travelerIdentity, validateBannerGoalTarget } from '../../../domain/profiles/traveler';
import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, ModalBody, Select } from '../../../components';
import type { CharacterData, WeaponData } from '../../../domain/catalog';
import type {
  CreateWishGoalInput,
  GoalPriority,
  GoalStatus,
  UpdateWishGoalInput,
  WishGoal,
} from '../../../domain/wishes/goalTypes';
import { CatalogSelect } from '../../../components/CatalogSelect';
import { validatePlannedVersion } from '../../../domain/wishes/plannedVersion';
import { uniqueCatalogEntries } from '../../../domain/catalog/identity';
import { defaultGameDataProvider } from '../../../infrastructure/providers';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateWishGoalInput | UpdateWishGoalInput) => Promise<void>;
  editingGoal?: WishGoal | null;
  isSaving?: boolean;
}

interface GoalFormContentProps {
  editingGoal?: WishGoal | null;
  onClose: () => void;
  onSubmit: (input: CreateWishGoalInput | UpdateWishGoalInput) => Promise<void>;
  isSaving: boolean;
}

const GoalFormContent: React.FC<GoalFormContentProps> = ({
  editingGoal,
  onClose,
  onSubmit,
  isSaving,
}) => {
  const isEditing = Boolean(editingGoal);

  const [targetType, setTargetType] = useState<'character' | 'weapon'>(
    editingGoal?.targetType ?? 'character'
  );
  const [targetId, setTargetId] = useState<string>(editingGoal?.targetId ?? '');
  const [targetName, setTargetName] = useState<string>(editingGoal?.targetName ?? '');
  const [targetRank, setTargetRank] = useState<number>(
    editingGoal ? editingGoal.targetRank : targetType === 'character' ? 0 : 1
  );
  const [priority, setPriority] = useState<GoalPriority>(editingGoal?.priority ?? 1);
  const [status, setStatus] = useState<GoalStatus>(editingGoal?.status ?? 'planning');
  const [expectedVersionId, setExpectedVersionId] = useState<string>(
    editingGoal?.expectedVersionId ?? ''
  );
  const [reservedWishes, setReservedWishes] = useState<number>(
    editingGoal?.reservedWishes ?? 0
  );
  const [notes, setNotes] = useState<string>(editingGoal?.notes ?? '');

  // Catálogo carregado
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [weapons, setWeapons] = useState<WeaponData[]>([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    void (async () => {
      await defaultGameDataProvider.ensureCatalogLoaded();
      const [cList, wList] = await Promise.all([
        defaultGameDataProvider.getAllCharacters(),
        defaultGameDataProvider.getAllWeapons(),
      ]);
      setCharacters(cList.filter(character => !travelerIdentity(character.id)));
      setWeapons(wList);
    })().catch(cause => setFormError(`Não foi possível carregar o catálogo: ${String(cause)}`));
  }, []);

  const handleCatalogSelect = (selectedId: string) => {
    setTargetId(selectedId);
    if (!selectedId) return;

    if (targetType === 'character') {
      const char = characters.find((c) => c.id === selectedId);
      if (char) {
        setTargetName(char.namePtBr);
      }
    } else {
      const wep = weapons.find((w) => w.id === selectedId);
      if (wep) {
        setTargetName(wep.namePtBr);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName.trim()) return;

    setFormError('');
    try { validateBannerGoalTarget(targetType, targetId, targetName); await onSubmit({
      targetType,
      targetId: targetId || `custom_${Date.now()}`,
      targetName: (targetType === 'character' ? characters : weapons).find(item => item.id === targetId)?.namePtBr ?? targetName.trim(),
      targetRank,
      priority,
      status,
      expectedVersionId: validatePlannedVersion(expectedVersionId),
      reservedWishes: Number(reservedWishes) || 0,
      notes: notes.trim() || null,
    });
    onClose();
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Não foi possível salvar a meta.'); }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px 20px' }}
    >
      {/* Tipo de Alvo (Personagem ou Arma) */}
      {formError && <p role="alert" className="ui-error">{formError}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
            Tipo de Alvo
          </label>
          <Select
            value={targetType}
            onChange={(e) => {
              const newType = e.target.value as 'character' | 'weapon';
              setTargetType(newType);
              setTargetId('');
              setTargetName('');
              setTargetRank(newType === 'character' ? 0 : 1);
            }}
            options={[
              { value: 'character', label: 'Personagem' },
              { value: 'weapon', label: 'Arma' },
            ]}
          />
        </div>

        <CatalogSelect label="Selecionar do Catálogo" entityType={targetType} value={targetId} onChange={handleCatalogSelect} emptyLabel="Entrada personalizada" options={uniqueCatalogEntries(targetType === 'character' ? characters : weapons, targetType).map(item => ({value:item.id, entityId:item.id, label:item.namePtBr, detail:`${item.rarity}★ · ${targetType === 'character' ? 'Personagem' : 'Arma'}`}))}/>
      </div>

      {/* Nome do Alvo e Constelação/Refinamento */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
            Nome do Alvo Personalizado
          </label>
          <Input
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="Insira nome do personagem ou arma"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
            {targetType === 'character' ? 'Constelação Alvo' : 'Refinamento Alvo'}
          </label>
          <Select
            value={String(targetRank)}
            onChange={(e) => setTargetRank(Number(e.target.value))}
            options={
              targetType === 'character'
                ? [
                    { value: '0', label: 'C0 (Obter 1 cópia)' },
                    { value: '1', label: 'C1' },
                    { value: '2', label: 'C2' },
                    { value: '3', label: 'C3' },
                    { value: '4', label: 'C4' },
                    { value: '5', label: 'C5' },
                    { value: '6', label: 'C6 (Máximo)' },
                  ]
                : [
                    { value: '1', label: 'R1 (Obter 1 cópia)' },
                    { value: '2', label: 'R2' },
                    { value: '3', label: 'R3' },
                    { value: '4', label: 'R4' },
                    { value: '5', label: 'R5 (Máximo)' },
                  ]
            }
          />
        </div>
      </div>

      {/* Prioridade e Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
            Prioridade
          </label>
          <Select
            value={String(priority)}
            onChange={(e) => setPriority(Number(e.target.value) as GoalPriority)}
            options={[
              { value: '1', label: 'Alta (Foco Primário)' },
              { value: '2', label: 'Média (Desejado)' },
              { value: '3', label: 'Baixa (Opcional)' },
            ]}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
            Status
          </label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as GoalStatus)}
            options={[
              { value: 'planning', label: 'Planejando' },
              { value: 'reserved', label: 'Reservado' },
              { value: 'completed', label: 'Concluído (Obtido)' },
              { value: 'canceled', label: 'Cancelado' },
            ]}
          />
        </div>
      </div>

      {/* Versão Prevista e Tiros Já Reservados */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
            Versão Prevista do Banner
          </label>
          <Input
            value={expectedVersionId}
            onChange={(e) => setExpectedVersionId(e.target.value)}
            placeholder="Ex.: 7.8 ou 8.0"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
            Tiros Já Reservados Exclusivamente
          </label>
          <input
            type="number"
            min="0"
            value={reservedWishes}
            onChange={(e) => setReservedWishes(Math.max(0, parseInt(e.target.value, 10) || 0))}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* Anotações */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
          Observações / Notas
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Tentar até o 50/50, guardar para rerun caso perca..."
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
          }}
        />
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
        <Button variant="secondary" type="button" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isSaving || !targetName.trim()}>
          {isSaving ? 'Salvando...' : isEditing ? 'Atualizar Meta' : 'Criar Meta'}
        </Button>
      </div>
    </form>
  );
};

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingGoal,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGoal ? 'Editar Meta de Desejos' : 'Adicionar Meta de Banner'}
      maxWidth="560px"
    >
      <ModalBody style={{padding: 0}}><GoalFormContent
        key={editingGoal ? editingGoal.id : 'new-goal'}
        editingGoal={editingGoal}
        onClose={onClose}
        onSubmit={onSubmit}
        isSaving={isSaving}
      /></ModalBody>
    </Modal>
  );
};
