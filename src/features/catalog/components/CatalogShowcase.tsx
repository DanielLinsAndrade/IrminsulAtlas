import React, { useEffect, useState } from 'react';
import type { AssetRef, CatalogState } from '../../../domain/catalog';
import { defaultAssetProvider } from '../../../infrastructure/providers';
import { useCatalog } from '../../../hooks/useCatalog';
import {
  AssetImage,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSubtitle,
  CardTitle,
} from '../../../components';

export const CatalogShowcase: React.FC = () => {
  const {
    characters,
    weapons,
    materials,
    artifactSets,
    metadata,
    isLoading: isCatalogLoading,
    refreshCatalog,
  } = useCatalog();

  const [selectedCharId] = useState<string | null>(null);
  const [selectedWeaponId] = useState<string | null>(null);
  const [selectedMaterialId] = useState<string | null>(null);

  const selectedChar = (selectedCharId ? characters.find((c) => c.id === selectedCharId) : null) ?? characters[0] ?? null;
  const selectedWeapon = (selectedWeaponId ? weapons.find((w) => w.id === selectedWeaponId) : null) ?? weapons[0] ?? null;
  const selectedMaterial = (selectedMaterialId ? materials.find((m) => m.id === selectedMaterialId) : null) ?? materials[0] ?? null;

  const [charAsset, setCharAsset] = useState<AssetRef | null>(null);
  const [weaponAsset, setWeaponAsset] = useState<AssetRef | null>(null);
  const [matAsset, setMatAsset] = useState<AssetRef | null>(null);

  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Resolve assets dinamicamente quando a seleção ou o modo offline muda
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const charId = selectedChar?.id || 'character_raiden_shogun';
      const weaponId = selectedWeapon?.id || 'weapon_engulfing_lightning';
      const matId = selectedMaterial?.id || 'material_intertwined_fate';

      const [ca, wa, ma] = await Promise.all([
        defaultAssetProvider.getCharacterAsset(charId, 'icon'),
        defaultAssetProvider.getWeaponAsset(weaponId, 'icon'),
        defaultAssetProvider.getMaterialAsset(matId, 'icon'),
      ]);

      if (isMounted) {
        setCharAsset(ca);
        setWeaponAsset(wa);
        setMatAsset(ma);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedChar, selectedWeapon, selectedMaterial, reloadTrigger]);

  const toggleOfflineMode = () => {
    const next = !isOfflineMode;
    setIsOfflineMode(next);
    defaultAssetProvider.setOfflineMode(next);
    setReloadTrigger((v) => v + 1);
  };

  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await refreshCatalog();
      setSyncFeedback('Catálogo sincronizado com sucesso!');
      setReloadTrigger((v) => v + 1);
    } catch {
      setSyncFeedback('Erro ao sincronizar catálogo.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const getSourceBadge = (asset: AssetRef | null) => {
    if (!asset) return null;
    if (asset.source === 'cache') {
      return <Badge variant="success" size="sm">Cache Local</Badge>;
    }
    if (asset.source === 'fallback') {
      return <Badge variant="warning" size="sm">Fallback Visual</Badge>;
    }
    return <Badge variant="info" size="sm">Remoto (HoYoLab CDN)</Badge>;
  };

  const getCatalogStateBadge = (state?: CatalogState) => {
    if (state === 'development') {
      return <Badge variant="warning" size="sm">Snapshot Dev (Parcial)</Badge>;
    }
    if (state === 'partial') {
      return <Badge variant="info" size="sm">Catálogo Parcial</Badge>;
    }
    return <Badge variant="success" size="sm">Catálogo Completo</Badge>;
  };

  const getSourceProviderLabel = (provider?: string) => {
    if (provider === 'manual_bootstrap' || provider === 'bundled_bootstrap') {
      return 'Dataset Local Embutido (Curadoria Manual)';
    }
    if (provider === 'hoyowiki') {
      return 'HoYoWiki (Amostra Local)';
    }
    return provider || 'Dataset Local';
  };

  return (
    <Card style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-surface)' }}>
      <CardHeader>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-gold)', fontSize: '18px' }}>✦</span>
            <CardTitle>Catálogo do Jogo & Importação Inicial (Etapa 6)</CardTitle>
            <Badge variant="primary" size="sm">Catálogo local</Badge>
          </div>
          <CardSubtitle>
            Dados estáticos populados no SQLite local, desacoplados de perfis de usuário, com suporte a modo offline.
          </CardSubtitle>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncCatalog}
            disabled={isSyncing || isCatalogLoading}
            title="Atualiza e persiste o catálogo no SQLite local de forma idempotente"
          >
            {isSyncing ? 'Atualizando...' : '↻ Atualizar Catálogo'}
          </Button>
          <Button
            variant={isOfflineMode ? 'danger' : 'outline'}
            size="sm"
            onClick={toggleOfflineMode}
            title="Alterna a simulação de conectividade para testar cache e fallback"
          >
            {isOfflineMode ? '● Modo Offline Ativo' : 'Simular Offline'}
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {/* Barra de Metadados do Catálogo */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
              {getCatalogStateBadge(metadata?.catalogState)}
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)' }}>Snapshot: </span>
              <strong style={{ color: 'var(--color-primary-light)' }}>{metadata?.contentVersion || '5.4.0-dev-bootstrap'}</strong>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)' }}>Schema: </span>
              <strong style={{ color: 'var(--text-secondary)' }}>v{metadata?.schemaVersion || '1.0'}</strong>
            </div>

            {syncFeedback && (
              <Badge variant={syncFeedback.includes('Erro') ? 'danger' : 'success'} size="sm">
                {syncFeedback}
              </Badge>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Origem dos Dados: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{getSourceProviderLabel(metadata?.sourceProvider)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Contagens: </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {characters.length} personagens • {weapons.length} armas • {materials.length} materiais • {artifactSets.length} conjuntos de artefatos
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Personagem do Catálogo */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <AssetImage
              asset={charAsset}
              entityType="character"
              entityId={selectedChar?.id || 'character_raiden_shogun'}
              alt={selectedChar?.namePtBr || 'Personagem'}
              size={64}
              shape="rounded"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                  {selectedChar?.namePtBr || 'Shogun Raiden'}
                </strong>
                <Badge variant="gold" size="sm">{selectedChar?.rarity || 5} ★</Badge>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Elemento {selectedChar?.element} • Arma {selectedChar?.weaponType}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {getSourceBadge(charAsset)}
              </div>
            </div>
          </div>

          {/* Arma do Catálogo */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <AssetImage
              asset={weaponAsset}
              entityType="weapon"
              entityId={selectedWeapon?.id || 'weapon_engulfing_lightning'}
              alt={selectedWeapon?.namePtBr || 'Arma'}
              size={64}
              shape="rounded"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                  {selectedWeapon?.namePtBr || 'Luz do Cortador de Grama'}
                </strong>
                <Badge variant="gold" size="sm">{selectedWeapon?.rarity || 5} ★</Badge>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Tipo {selectedWeapon?.weaponType} • Versão {selectedWeapon?.releaseVersionId}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {getSourceBadge(weaponAsset)}
              </div>
            </div>
          </div>

          {/* Material do Catálogo */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <AssetImage
              asset={matAsset}
              entityType="material"
              entityId={selectedMaterial?.id || 'material_intertwined_fate'}
              alt={selectedMaterial?.namePtBr || 'Material'}
              size={64}
              shape="rounded"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                  {selectedMaterial?.namePtBr || 'Destino Entrelaçado'}
                </strong>
                <Badge variant="gold" size="sm">{selectedMaterial?.rarity || 5} ★</Badge>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Categoria {selectedMaterial?.category}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {getSourceBadge(matAsset)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(30, 27, 75, 0.4)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span>
              ✦ <strong>Amostra de Desenvolvimento:</strong> O catálogo atual consiste em uma amostra inicial curada para viabilizar testes, navegação e persistência offline sem scraping em tempo de execução.
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Status de Rede: {isOfflineMode ? 'Modo Offline Forçado' : 'Online / Automático'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ✦ <strong>Independência de Perfis:</strong> O catálogo do jogo é estritamente global e compartilhado no SQLite local; a importação ocorre de forma idempotente sem afetar os perfis dos usuários.
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
