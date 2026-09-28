import React, { useState } from 'react';
import { useShell } from '../../../app/providers';
import type { AccountCharacterWithDetails } from '../../../domain/characters/types';
import { useCharacters } from '../hooks/useCharacters';
import { CharacterOverview } from './CharacterOverview';
import { useBuilds } from '../../builds/hooks/useBuilds';
import { BuildStatusBadge } from '../../builds/components/BuildStatusBadge';
import { PageHero, ViewToggle } from '../../../components/PageLayout';
import './CharactersView.css';
import { CharacterFilters } from './CharacterFilters';
import { CharacterDetailModal } from './CharacterDetailModal';
import { AddCharacterModal } from './AddCharacterModal';
import {
  Button,
  AssetImage,
  ElementIcon,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
} from '../../../components';

export const CharactersView: React.FC = () => {
  const { activeProfile, navigateTo } = useShell();
  const { builds, error: buildsError } = useBuilds();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [buildStatus, setBuildStatus] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const {
    characters,
    filteredCharacters,
    catalogCharacters,
    ownedCharacterIds,
    filters,
    stats,
    isLoading,
    isSaving,
    error,
    actionError,
    clearActionError,
    setFilters,
    resetFilters,
    addCharacterToAccount,
    removeCharacterFromAccount,
    updateCharacter,
    refresh,
  } = useCharacters();

  const [selectedCharacter, setSelectedCharacter] = useState<AccountCharacterWithDetails | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [characterToRemove, setCharacterToRemove] = useState<AccountCharacterWithDetails | null>(null);

  if (!activeProfile) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <EmptyState
          title="Nenhum Perfil Ativo"
          description="Selecione ou crie um perfil para gerenciar sua coleção de personagens e constelações."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <LoadingState title="Carregando coleção de personagens..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <ErrorState
          title="Erro ao Carregar Personagens"
          error={error}
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

  const visibleCharacters = filteredCharacters.filter(character => {
    const build = builds.find(b => b.characterId === character.characterId);
    return (buildStatus === 'all' || (build?.status ?? 'sem_build') === buildStatus)
      && (levelFilter === 'all' || (levelFilter === '90' ? character.level === 90 : character.level < 90));
  });
  const focused = visibleCharacters.find(c => c.characterId === focusedId) ?? visibleCharacters[0];

  const handleConfirmRemove = async () => {
    if (!characterToRemove) return;
    try {
      await removeCharacterFromAccount(characterToRemove.characterId);
      if (selectedCharacter?.characterId === characterToRemove.characterId) {
        setSelectedCharacter(null);
      }
      setCharacterToRemove(null);
    } catch {
      // Erro tratado pelo hook useCharacters em actionError
    }
  };

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

      <PageHero title="Personagens" subtitle={`Sua coleção, builds e progresso · ${stats.ownedCount} de ${stats.totalCount} personagens · Perfil ${activeProfile.name}`} actions={<Button onClick={() => setIsAddModalOpen(true)}>Adicionar personagem</Button>}/>
      {buildsError && <p role="alert">{buildsError}</p>}
      {/* Barra de Filtros */}
      <CharacterFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <div className="ui-toolbar">
        <select aria-label="Estado da build" value={buildStatus} onChange={event => setBuildStatus(event.target.value)}><option value="all">Todas as builds</option><option value="completa">Completa</option><option value="utilizavel">Utilizável</option><option value="precisa_melhorar">Precisa melhorar</option><option value="incompleta">Incompleta</option><option value="sem_build">Sem build</option></select>
        <select aria-label="Nível do personagem" value={levelFilter} onChange={event => setLevelFilter(event.target.value)}><option value="all">Todos os níveis</option><option value="90">Nível 90</option><option value="below">Abaixo de 90</option></select>
        <ViewToggle value={layout} onChange={setLayout}/><span className="ui-muted">{visibleCharacters.length} personagens</span>
      </div>
      {!visibleCharacters.length ? <EmptyState title="Nenhum personagem encontrado" description="A coleção exibe apenas os personagens cadastrados neste perfil. Limpe os filtros ou adicione um personagem do catálogo." actionLabel="Adicionar personagem" onAction={() => setIsAddModalOpen(true)}/> :
        <div className={`character-collection character-collection--${layout}`}>{visibleCharacters.map(character => <button type="button" key={character.characterId} className="character-collection-card" aria-pressed={focused?.characterId === character.characterId} onClick={() => setFocusedId(character.characterId)}>
          <AssetImage entityType="character" entityId={character.characterId} alt={character.namePtBr} size={72}/>
          <div><strong>{character.namePtBr}</strong><span className="ui-gold">{character.rarity}★ <ElementIcon element={character.element} size={16}/></span><small>Nv. {character.level} · C{character.constellation}</small><BuildStatusBadge status={builds.find(b => b.characterId === character.characterId)?.status ?? 'sem_build'} size="sm"/></div>
        </button>)}</div>}
      {focused && <CharacterOverview key={focused.characterId} character={focused} build={builds.find(b => b.characterId === focused.characterId)} onEdit={() => setSelectedCharacter(focused)} onFarm={() => navigateTo('farm', { id: focused.characterId, query: focused.namePtBr })}/>}

      {/* Modal de Detalhes e Edição */}
      <CharacterDetailModal
        isOpen={Boolean(selectedCharacter)}
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        onSave={async (charId, input) => {
          await updateCharacter(charId, input);
          setSelectedCharacter((prev) => (prev ? { ...prev, ...input } : null));
        }}
        onToggleOwned={async (charId) => {
          const target = characters.find((c) => c.characterId === charId);
          if (target) {
            setCharacterToRemove(target);
          }
        }}
        isSaving={isSaving}
      />

      {/* Modal de Adição a partir do Catálogo Global */}
      <AddCharacterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        catalogCharacters={catalogCharacters}
        ownedCharacterIds={ownedCharacterIds}
        onAddCharacter={addCharacterToAccount}
        isSaving={isSaving}
      />

      {/* Modal de Confirmação de Remoção da Conta */}
      <Modal
        isOpen={Boolean(characterToRemove)}
        onClose={() => setCharacterToRemove(null)}
        title="Remover Personagem da Conta"
        maxWidth="440px"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="ghost" onClick={() => setCharacterToRemove(null)}>
              Cancelar
            </Button>
            <Button variant="danger" disabled={isSaving} onClick={() => void handleConfirmRemove()}>
              Remover da Conta
            </Button>
          </div>
        }
      >
        <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
          Tem certeza de que deseja remover{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{characterToRemove?.namePtBr}</strong> da
          sua conta?
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '12px',
              color: 'var(--accent-primary)',
            }}
          >
            Os dados do personagem no catálogo global e o histórico geral do jogo não serão apagados.
          </div>
        </div>
      </Modal>
    </div>
  );
};
