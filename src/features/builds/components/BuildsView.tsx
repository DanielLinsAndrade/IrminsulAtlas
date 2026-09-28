import React, { useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type {
  CharacterBuildWithDetails,
} from '../../../domain/builds/types';
import { PageHero, MetricCard, ViewToggle } from '../../../components/PageLayout';
import { useBuilds } from '../hooks/useBuilds';
import { BuildCard } from './BuildCard';
import { BuildFilters } from './BuildFilters';
import { BuildDetailModal } from './BuildDetailModal';
import { BuildTrackingPanel } from './BuildTrackingPanel';
import {
  EmptyState,
  Button,
  ErrorState,
  LoadingState,
} from '../../../components';

export const BuildsView: React.FC = () => {
  const { activeProfile } = useShell();
  const {
    builds,
    filteredBuilds,
    catalogArtifactSets,
    catalogCharacters,
    catalogWeapons,
    accountWeapons,
    filters,
    stats,
    isLoading,
    isSaving,
    error,
    actionError,
    clearActionError,
    setFilters,
    resetFilters,
    toggleFarmEnabled,
    saveFullBuild,
    refresh,
  } = useBuilds();

  const [selectedBuild, setSelectedBuild] = useState<CharacterBuildWithDetails | null>(null);
  const [tracking, setTracking] = useState<'artifacts' | 'constellations' | null>(null);

  const setNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of catalogArtifactSets) {
      map.set(s.id, s.namePtBr);
    }
    return map;
  }, [catalogArtifactSets]);

  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [order, setOrder] = useState('progress');
  const displayed = [...filteredBuilds].sort((a,b) => order === 'name' ? a.characterName.localeCompare(b.characterName) : order === 'level' ? b.characterLevel - a.characterLevel : b.indicators.progressPercent - a.indicators.progressPercent);

  if (!activeProfile) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <EmptyState
          title="Nenhum Perfil Ativo"
          description="Selecione ou crie um perfil para planejar e acompanhar suas builds de personagens."
        />
      </div>
    );
  }

  if ((isLoading && builds.length === 0) || builds.some(build => build.profileId !== activeProfile.id)) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <LoadingState title="Carregando planejamento de builds..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <ErrorState
          title="Erro ao Carregar Builds"
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

      <PageHero title="Builds e Planejamento de Farm" subtitle={`Otimize seus personagens e acompanhe o progresso das builds · Perfil ${activeProfile.name}`}/>
      <div className="metric-grid"><MetricCard label="Personagens na conta" value={stats.totalCharacters}/><MetricCard label="Farm ativo" value={stats.farmActiveCount} tone="green"/><MetricCard label="Builds utilizáveis" value={stats.usableCount} hint={`${stats.completeCount} completas`} tone="cyan"/><MetricCard label="Precisa melhorar" value={stats.needsImprovementCount} tone="gold"/><MetricCard label="Builds incompletas" value={stats.incompleteCount} hint={`${stats.noBuildCount} sem build`}/></div>
      {/* Barra de Filtros com Seletor de Farm */}
      <BuildFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <div className="ui-toolbar"><select aria-label="Ordenar builds" value={order} onChange={e => setOrder(e.target.value)}><option value="progress">Progresso da build</option><option value="name">Nome</option><option value="level">Nível</option></select><ViewToggle value={layout} onChange={setLayout}/></div>
      {/* Grid de Builds da Conta */}
      <div className="ui-toolbar"><Button variant="secondary" onClick={()=>setTracking('artifacts')}>Artefatos não finalizados</Button><Button variant="secondary" onClick={()=>setTracking('constellations')}>Constelações por versão</Button></div>
      {tracking && <BuildTrackingPanel key={activeProfile.id} kind={tracking} builds={builds} catalog={catalogCharacters} profileId={activeProfile.id} onClose={()=>setTracking(null)} onEdit={build=>{setTracking(null);setSelectedBuild(build);}}/>}
      {filteredBuilds.length === 0 ? (
        <EmptyState
          title={builds.length === 0 ? 'Nenhum personagem na sua conta' : 'Nenhuma build encontrada'}
          description={
            builds.length === 0
              ? 'Sua conta ainda não possui personagens cadastrados neste perfil. Adicione personagens na aba "Personagens" para planejar suas builds e acompanhar o farm de materiais.'
              : 'Nenhuma build da sua conta corresponde aos filtros selecionados. Tente limpar os filtros.'
          }
          actionLabel={builds.length === 0 ? undefined : 'Limpar Filtros'}
          onAction={builds.length === 0 ? undefined : resetFilters}
        />
      ) : (
        <div className={`build-showcase-grid build-showcase-grid--${layout}`}>
          {displayed.map((build) => (
            <BuildCard
              key={build.id}
              build={build}
              onOpenDetails={(b) => setSelectedBuild(b)}
              onToggleFarm={toggleFarmEnabled}
              isSaving={isSaving}
              setNameMap={setNameMap}
            />
          ))}
        </div>
      )}

      {/* Modal de Detalhes e Edição */}
      <BuildDetailModal
        isOpen={Boolean(selectedBuild)}
        build={selectedBuild}
        catalogArtifactSets={catalogArtifactSets}
        catalogWeapons={catalogWeapons}
        accountWeapons={accountWeapons}
        onClose={() => setSelectedBuild(null)}
        onSave={async (characterId, buildInput, slotsInput) => {
          await saveFullBuild(characterId, buildInput, slotsInput);
          setSelectedBuild(null);
        }}
        isSaving={isSaving}
      />
    </div>
  );
};
