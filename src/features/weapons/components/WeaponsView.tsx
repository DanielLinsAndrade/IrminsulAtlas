import React, { useState } from 'react';
import { useShell } from '../../../app/providers';
import type { AccountWeaponWithDetails } from '../../../domain/weapons/types';
import { useWeapons } from '../hooks/useWeapons';
import { PageHero, MetricCard, ViewToggle } from '../../../components/PageLayout';
import './WeaponsView.css';
import { WeaponFilters } from './WeaponFilters';
import { AddWeaponModal } from './AddWeaponModal';
import { WeaponDetailModal } from './WeaponDetailModal';
import { AssetImage, WeaponTypeIcon, Button, EmptyState, ErrorState, LoadingState } from '../../../components';

export const WeaponsView: React.FC = () => {
  const { activeProfile } = useShell();
  const {
    filteredWeapons,
    catalogWeapons,
    characters,
    filters,
    stats,
    isLoading,
    isSaving,
    error,
    actionError,
    clearActionError,
    setFilters,
    resetFilters,
    createWeapon,
    updateWeapon,
    deleteWeapon,
    toggleFavorite,
    refresh,
  } = useWeapons();

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedWeapon, setSelectedWeapon] = useState<AccountWeaponWithDetails | null>(null);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('default');
  const displayed = [...filteredWeapons].sort((a, b) => sort === 'name' ? a.namePtBr.localeCompare(b.namePtBr) : sort === 'level' ? b.level - a.level : sort === 'refinement' ? b.refinement - a.refinement : 0);
  const focused = displayed.find(w => w.id === focusedId) ?? displayed[0];

  if (!activeProfile) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <EmptyState
          title="Nenhum Perfil Ativo"
          description="Selecione ou crie um perfil para gerenciar seu arsenal de armas e refinamentos."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <LoadingState title="Carregando arsenal de armas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <ErrorState
          title="Erro ao Carregar Armas"
          error={error}
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

  return (
    <div className="ui-page">
      {/* Banner de erro de ação não obstrutivo */}
      {actionError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            fontSize: '13px',
          }}
        >
          <span role="alert">{actionError}</span>
          <button
            type="button"
            onClick={clearActionError}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <PageHero title="Armas e Refinamentos" subtitle={`Gerencie seu arsenal, equipamentos e refinamentos · Perfil ${activeProfile.name}`} actions={<Button onClick={() => setIsAddModalOpen(true)}>Adicionar arma</Button>}/>
      <div className="metric-grid"><MetricCard label="Total de armas" value={stats.totalCount}/><MetricCard label="Armas 5★" value={stats.fiveStarCount} tone="gold"/><MetricCard label="Armas 4★" value={stats.fourStarCount}/><MetricCard label="Refinamento R5" value={stats.r5Count} tone="cyan"/><MetricCard label="Equipadas" value={stats.equippedCount} tone="green"/></div>
      {/* Barra de Filtros */}
      <WeaponFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <div className="ui-toolbar"><select aria-label="Ordenar armas" value={sort} onChange={e => setSort(e.target.value)}><option value="default">Favoritos e raridade</option><option value="name">Nome</option><option value="level">Nível</option><option value="refinement">Refinamento</option></select><ViewToggle value={layout} onChange={setLayout}/><span className="ui-muted">{displayed.length} armas</span></div>
      <div className="ui-split">
        {!displayed.length ? <EmptyState title="Nenhuma arma encontrada" description="A coleção mostra as cópias cadastradas neste perfil." actionLabel="Adicionar arma" onAction={() => setIsAddModalOpen(true)}/> : <div className={`weapon-collection weapon-collection--${layout}`}>{displayed.map(weapon => <article key={weapon.id} className="weapon-collection-card" data-selected={focused?.id === weapon.id} data-rarity={weapon.rarity}>
          <button type="button" className="weapon-select" onClick={() => setFocusedId(weapon.id)} aria-pressed={focused?.id === weapon.id}>
            <AssetImage entityType="weapon" entityId={weapon.weaponId} alt={weapon.namePtBr} size={100}/><strong>{weapon.namePtBr}</strong><span className="ui-gold">{weapon.rarity}★</span><small>Nv. {weapon.level} · R{weapon.refinement}</small><small>{weapon.equippedCharacterName ?? 'Desocupada'}</small>
          </button>
          <button type="button" className="weapon-favorite" aria-label={`Favoritar ${weapon.namePtBr}`} aria-pressed={weapon.favorite} disabled={isSaving} onClick={() => void toggleFavorite(weapon.id).catch(console.error)}>{weapon.favorite ? '★' : '☆'}</button>
        </article>)}</div>}
        {focused && <aside className="ui-panel weapon-detail"><AssetImage entityType="weapon" entityId={focused.weaponId} alt={focused.namePtBr} size={210} style={{ background: 'transparent', border: 0 }}/><h2>{focused.namePtBr}</h2><span className="ui-gold">{focused.rarity}★ · R{focused.refinement}</span><WeaponTypeIcon weaponType={focused.weaponType} showLabel/><dl><div><dt>Nível</dt><dd>{focused.level} / 90</dd></div><div><dt>Ascensão</dt><dd>{focused.ascension} / 6</dd></div><div><dt>Cópia</dt><dd>{focused.instanceNo}</dd></div><div><dt>Equipada por</dt><dd>{focused.equippedCharacterName ?? 'Ninguém'}</dd></div></dl>{focused.notes && <p className="ui-muted">{focused.notes}</p>}<Button onClick={() => setSelectedWeapon(focused)}>Editar / Equipar</Button><Button variant="secondary" disabled={isSaving} onClick={() => void toggleFavorite(focused.id).catch(console.error)}>{focused.favorite ? 'Remover dos favoritos' : 'Favoritar'}</Button><Button variant="danger" onClick={() => setSelectedWeapon(focused)}>Gerenciar / Remover</Button><small className="ui-muted">O catálogo atual não armazena passivas ou atributos de combate.</small></aside>}
      </div>

      {/* Modal de Adicionar Arma */}
      <AddWeaponModal
        isOpen={isAddModalOpen}
        catalogWeapons={catalogWeapons}
        characters={characters}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={async (input) => {
          await createWeapon(input);
          setIsAddModalOpen(false);
        }}
        isSaving={isSaving}
      />

      {/* Modal de Detalhes e Edição */}
      <WeaponDetailModal
        isOpen={Boolean(selectedWeapon)}
        weapon={selectedWeapon}
        characters={characters}
        onClose={() => setSelectedWeapon(null)}
        onUpdate={async (id, input) => {
          await updateWeapon(id, input);
          setSelectedWeapon(null);
        }}
        onDelete={async (id) => {
          await deleteWeapon(id);
          setSelectedWeapon(null);
        }}
        isSaving={isSaving}
      />
    </div>
  );
};
