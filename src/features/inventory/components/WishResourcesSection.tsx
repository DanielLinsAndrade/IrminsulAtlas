import React, { useState } from 'react';
import type { ProfileResources, WishEquivalences } from '../../../domain/inventory';
import { validateResourceQuantity } from '../../../domain/inventory';
import { INVENTORY_LIMITS } from '../../../domain/constants/limits';
import {
  Badge,
  BoundedIntegerInput,
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
} from '../../../components';
import { UI_ASSETS } from '../../../infrastructure/providers';

interface WishResourcesSectionProps {
  resources: ProfileResources | null;
  equivalences: WishEquivalences;
  onUpdateResources: (input: Partial<ProfileResources>) => Promise<void>;
  isSaving: boolean;
}

export const WishResourcesSection: React.FC<WishResourcesSectionProps> = ({
  resources,
  equivalences,
  onUpdateResources,
  isSaving,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [primogemsInput, setPrimogemsInput] = useState<number>(resources?.primogems ?? 0);
  const [intertwinedInput, setIntertwinedInput] = useState<number>(resources?.intertwinedFates ?? 0);
  const [acquaintInput, setAcquaintInput] = useState<number>(resources?.acquaintFates ?? 0);
  const [starglitterInput, setStarglitterInput] = useState<number>(resources?.starglitter ?? 0);
  const [stardustInput, setStardustInput] = useState<number>(resources?.stardust ?? 0);
  const [genesisInput, setGenesisInput] = useState<number>(resources?.genesisCrystals ?? 0);
  const [formError, setFormError] = useState<string | null>(null);

  const openEditModal = () => {
    setPrimogemsInput(resources?.primogems ?? 0);
    setIntertwinedInput(resources?.intertwinedFates ?? 0);
    setAcquaintInput(resources?.acquaintFates ?? 0);
    setStarglitterInput(resources?.starglitter ?? 0);
    setStardustInput(resources?.stardust ?? 0);
    setGenesisInput(resources?.genesisCrystals ?? 0);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const primogems = validateResourceQuantity(primogemsInput, 'Primogemas');
      const intertwinedFates = validateResourceQuantity(intertwinedInput, 'Destinos Entrelaçados');
      const acquaintFates = validateResourceQuantity(acquaintInput, 'Destinos Familiares');
      const starglitter = validateResourceQuantity(starglitterInput, 'Brilho Estelar');
      const stardust = validateResourceQuantity(stardustInput, 'Poeira Estelar');
      const genesisCrystals = validateResourceQuantity(genesisInput, 'Cristais Gênesis');

      await onUpdateResources({
        primogems,
        intertwinedFates,
        acquaintFates,
        starglitter,
        stardust,
        genesisCrystals,
      });

      setIsEditModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao validar valores dos recursos.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Resumo Cósmico de Conversão de Tiros */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(49, 46, 129, 0.4) 50%, rgba(15, 23, 42, 0.8) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#fbbf24', fontSize: '20px' }}>✦</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Equivalência em Tiros
            </h3>
            <Badge variant="primary" size="sm">Equivalência de recursos</Badge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Conversão baseada nas regras oficiais do jogo (160 Primogemas por tiro, 5 Brilhos Estelares por tiro).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tiros Promocionais Prontos
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary-light)', lineHeight: 1.2 }}>
              {equivalences.totalPromotionalPulls}{' '}
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>tiros</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({equivalences.directIntertwined} destinos + {equivalences.pullsFromPrimogemsAndCrystals} por gemas)
            </div>
          </div>

          <div style={{ width: '1px', height: '40px', background: 'var(--border-subtle)' }} />

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Com Brilho Estelar
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fbbf24', lineHeight: 1.2 }}>
              {equivalences.totalPromotionalPullsWithStarglitter}{' '}
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-secondary)' }}>tiros</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              (+{equivalences.pullsFromStarglitter} por {equivalences.rawStarglitter} brilhos)
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={openEditModal}>
            ✎ Editar Recursos
          </Button>
        </div>
      </div>

      {/* Grid de Recursos de Desejos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Primogemas */}
        <Card interactive onClick={openEditModal}>
          <CardBody style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={UI_ASSETS.items.primogem}
                  alt="Primogemas"
                  style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0 }}
                  draggable={false}
                />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Primogemas</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {resources?.primogems ?? 0}
                  </div>
                </div>
              </div>
              <Badge variant="info" size="sm">
                ={equivalences.pullsFromPrimogems} tiros
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Sobra: {equivalences.remainderPrimogems} gemas
            </div>
          </CardBody>
        </Card>

        {/* Destinos Entrelaçados */}
        <Card interactive onClick={openEditModal}>
          <CardBody style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={UI_ASSETS.items.intertwinedFate}
                  alt="Destinos Entrelaçados"
                  style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0 }}
                  draggable={false}
                />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Destinos Entrelaçados</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {resources?.intertwinedFates ?? 0}
                  </div>
                </div>
              </div>
              <Badge variant="purple" size="sm">
                Promocional
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Disponíveis para tiros imediatos
            </div>
          </CardBody>
        </Card>

        {/* Destinos Familiares */}
        <Card interactive onClick={openEditModal}>
          <CardBody style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={UI_ASSETS.items.acquaintFate}
                  alt="Destinos Familiares"
                  style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0 }}
                  draggable={false}
                />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Destinos Familiares</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {resources?.acquaintFates ?? 0}
                  </div>
                </div>
              </div>
              <Badge variant="info" size="sm">
                Padrão
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Total padrão: {equivalences.totalStandardPulls} tiros
            </div>
          </CardBody>
        </Card>

        {/* Cristais Gênesis */}
        <Card interactive onClick={openEditModal}>
          <CardBody style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={UI_ASSETS.items.genesisCrystal}
                  alt="Cristais Gênesis"
                  style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0 }}
                  draggable={false}
                />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cristais Gênesis</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {resources?.genesisCrystals ?? 0}
                  </div>
                </div>
              </div>
              <Badge variant="default" size="sm">
                1:1 Gema
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Converte 1:1 para Primogemas (+{equivalences.crystalsToPrimogems} gemas)
            </div>
          </CardBody>
        </Card>

        {/* Brilho Estelar sem Dono */}
        <Card interactive onClick={openEditModal}>
          <CardBody style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={UI_ASSETS.items.starglitter}
                  alt="Brilho Estelar"
                  style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0 }}
                  draggable={false}
                />
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Brilho Estelar</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {resources?.starglitter ?? 0}
                  </div>
                </div>
              </div>
              <Badge variant="gold" size="sm">
                5:1 Tiro
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Troca: {equivalences.pullsFromStarglitter} tiros (sobra {equivalences.remainderStarglitter})
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal de Edição de Recursos de Desejos */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Atualizar Recursos de Desejos"
        maxWidth="520px"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Recursos'}
            </Button>
          </>
        }
      >
        <ModalBody>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-6px', marginBottom: '16px' }}>
          Informe as quantidades reais disponíveis em sua conta para cálculo de tiros.
        </p>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <BoundedIntegerInput
              label="Primogemas"
              min={INVENTORY_LIMITS.QUANTITY.MIN}
              max={INVENTORY_LIMITS.QUANTITY.MAX}
              value={primogemsInput}
              onChange={(val) => setPrimogemsInput(val ?? 0)}
              helperText="160 = 1 tiro"
            />
            <BoundedIntegerInput
              label="Destinos Entrelaçados"
              min={INVENTORY_LIMITS.QUANTITY.MIN}
              max={INVENTORY_LIMITS.QUANTITY.MAX}
              value={intertwinedInput}
              onChange={(val) => setIntertwinedInput(val ?? 0)}
              helperText="Banner promocional"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <BoundedIntegerInput
              label="Destinos Familiares"
              min={INVENTORY_LIMITS.QUANTITY.MIN}
              max={INVENTORY_LIMITS.QUANTITY.MAX}
              value={acquaintInput}
              onChange={(val) => setAcquaintInput(val ?? 0)}
              helperText="Banner padrão"
            />
            <BoundedIntegerInput
              label="Cristais Gênesis"
              min={INVENTORY_LIMITS.QUANTITY.MIN}
              max={INVENTORY_LIMITS.QUANTITY.MAX}
              value={genesisInput}
              onChange={(val) => setGenesisInput(val ?? 0)}
              helperText="Converte 1:1 em Primogemas (não gera tiros diretamente)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <BoundedIntegerInput
              label="Brilho Estelar sem Dono"
              min={INVENTORY_LIMITS.QUANTITY.MIN}
              max={INVENTORY_LIMITS.QUANTITY.MAX}
              value={starglitterInput}
              onChange={(val) => setStarglitterInput(val ?? 0)}
              helperText="5 = 1 tiro na loja"
            />
            <BoundedIntegerInput
              label="Poeira Estelar sem Dono"
              min={INVENTORY_LIMITS.QUANTITY.MIN}
              max={INVENTORY_LIMITS.QUANTITY.MAX}
              value={stardustInput}
              onChange={(val) => setStardustInput(val ?? 0)}
              helperText="75 = 1 destino (respeita teto mensal de 5/mês por reset)"
            />
          </div>
        </form>
        </ModalBody>
      </Modal>
    </div>
  );
};
