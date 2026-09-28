import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { WishResourcesSection } from './WishResourcesSection';
import { MaterialsInventorySection } from './MaterialsInventorySection';
import { PageHero } from '../../../components/PageLayout';
import './ResourcesInventoryView.css';
import { Button, Card, CardBody } from '../../../components';
import { WeaponCollectionPanel } from './WeaponCollectionPanel';

type ViewTab = 'all' | 'wishes' | 'materials';

export const ResourcesInventoryView: React.FC = () => {
  const {
    activeProfile,
    resources,
    equivalences,
    inventoryWithDetails,
    isLoading,
    isSaving,
    error,
    updateResources,
    setItemQuantity,
    adjustItemQuantity,
    refresh,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [showWeapons, setShowWeapons] = useState(false);

  // Estado vazio quando não há perfil ativo (SPEC 14 e Regra de Não Perder/Misturar Perfis)
  if (!activeProfile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '64px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            ✦
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Nenhum Perfil Ativo Selecionado
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '480px', margin: 0 }}>
            Para gerenciar seus recursos de orações e inventário de evolução, selecione ou crie um perfil no menu superior.
            Cada perfil possui inventário e recursos completamente isolados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page resources-page">
      <PageHero title="Recursos & Inventário" subtitle={`Monitore seus destinos, gemas e materiais de evolução · Perfil ${activeProfile.name}`}/>
      {showWeapons && <WeaponCollectionPanel key={activeProfile.id} profileId={activeProfile.id} onClose={() => setShowWeapons(false)}/>}
      <div>
        {/* Ações e Navegação por Abas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Button
              variant={activeTab === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
            >
              Visão Completa
            </Button>
            <Button
              variant={activeTab === 'wishes' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('wishes')}
            >
              Recursos de Desejos
            </Button>
            <Button
              variant={activeTab === 'materials' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('materials')}
            >
              Materiais ({inventoryWithDetails.length})
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={isLoading}>
            ↻ Atualizar
          </Button>
        </div>
      </div>

      {/* Alerta de Erro */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Card>
          <CardBody style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Carregando recursos e inventário do perfil...
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Seção 1: Recursos de Desejos */}
          {(activeTab === 'all' || activeTab === 'wishes') && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Recursos de Desejos & Equivalências
                </h2>
              </div>

              <WishResourcesSection
                resources={resources}
                equivalences={equivalences}
                onUpdateResources={updateResources}
                isSaving={isSaving}
              />
            </section>
          )}

          {/* Divisor quando na visão completa */}
          {activeTab === 'all' && (
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />
          )}

          {/* Seção 2: Inventário de Materiais */}
          {(activeTab === 'all' || activeTab === 'materials') && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Materiais de Ascensão e Evolução
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Estoque de evolução vinculado exclusivamente ao perfil ativo. Recursos de desejos são gerenciados exclusivamente na seção de Recursos de Desejos.
                  </p>
                </div>
              </div>

              <MaterialsInventorySection
                onOpenWeapons={() => setShowWeapons(true)}
                inventory={inventoryWithDetails}
                onSetQuantity={setItemQuantity}
                onAdjustQuantity={adjustItemQuantity}
                isSaving={isSaving}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
};
