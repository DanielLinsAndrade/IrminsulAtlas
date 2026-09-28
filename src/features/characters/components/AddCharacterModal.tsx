import React, { useMemo, useState } from 'react';
import { VersionFilter } from '../../../components/VersionFilter';
import { matchesVersion } from '../../../domain/shared/versionFilter';
import type { CharacterData, Element, WeaponType } from '../../../domain/catalog';
import {
  AssetImage,
  Badge,
  Button,
  ElementIcon,
  Input,
  Modal,
  ModalBody,
  Select,
  WeaponTypeIcon,
} from '../../../components';

interface AddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogCharacters: CharacterData[];
  ownedCharacterIds: Set<string>;
  onAddCharacter: (characterId: string) => Promise<void>;
  isSaving: boolean;
}

const ALL_ELEMENTS: Element[] = ['pyro', 'hydro', 'anemo', 'electro', 'dendro', 'cryo', 'geo'];
const ALL_WEAPONS: WeaponType[] = ['sword', 'claymore', 'polearm', 'bow', 'catalyst'];

const REGION_OPTIONS = [
  { value: 'all', label: 'Todas as Regiões' },
  { value: 'Mondstadt', label: 'Mondstadt' },
  { value: 'Liyue', label: 'Liyue' },
  { value: 'Inazuma', label: 'Inazuma' },
  { value: 'Sumeru', label: 'Sumeru' },
  { value: 'Fontaine', label: 'Fontaine' },
  { value: 'Natlan', label: 'Natlan' },
];


export const AddCharacterModal: React.FC<AddCharacterModalProps> = ({
  isOpen,
  onClose,
  catalogCharacters,
  ownedCharacterIds,
  onAddCharacter,
  isSaving,
}) => {
  const [search, setSearch] = useState('');
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [selectedWeapon, setSelectedWeapon] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedVersion, setSelectedVersion] = useState<string>('all');

  const filteredList = useMemo(() => {
    return catalogCharacters.filter((c) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = c.namePtBr.toLowerCase().includes(query);
        const matchesKey = c.gameKey.toLowerCase().includes(query);
        if (!matchesName && !matchesKey) return false;
      }
      if (selectedElement !== 'all' && c.element !== selectedElement) return false;
      if (selectedWeapon !== 'all' && c.weaponType !== selectedWeapon) return false;
      if (selectedRarity !== 'all' && String(c.rarity) !== selectedRarity) return false;
      if (selectedRegion !== 'all' && c.region !== selectedRegion) return false;
      if (!matchesVersion(c.releaseVersionId, selectedVersion)) return false;
      return true;
    });
  }, [catalogCharacters, search, selectedElement, selectedWeapon, selectedRarity, selectedRegion, selectedVersion]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedElement('all');
    setSelectedWeapon('all');
    setSelectedRarity('all');
    setSelectedRegion('all');
    setSelectedVersion('all');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catálogo Geral — Adicionar Personagens"
      maxWidth="1020px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Exibindo {filteredList.length} de {catalogCharacters.length} personagens do jogo ({ownedCharacterIds.size} já na sua conta)
          </span>
          <Button variant="secondary" onClick={onClose}>
            Concluir
          </Button>
        </div>
      }
    >
      <ModalBody className="character-catalog-body">
        {/* Filtros do Modal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'var(--bg-surface)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Linha 1: Busca e Selects */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '13px' }}
            />
            <Select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              options={[
                { value: 'all', label: 'Todas as Raridades' },
                { value: '5', label: '5 Estrelas (★★★★★)' },
                { value: '4', label: '4 Estrelas (★★★★)' },
              ]}
            />
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              options={REGION_OPTIONS}
            />
            <VersionFilter
              label="Versão dos personagens"
              value={selectedVersion}
              onChange={setSelectedVersion}
            />
          </div>

          {/* Linha 2: Chips rápidos de Elemento e Tipo de Arma */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>
              Elemento:
            </span>
            <button
              type="button"
              onClick={() => setSelectedElement('all')}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
                background: selectedElement === 'all' ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: selectedElement === 'all' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              Todos
            </button>
            {ALL_ELEMENTS.map((elem) => (
              <button
                key={elem}
                type="button"
                onClick={() => setSelectedElement(elem === selectedElement ? 'all' : elem)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  background: selectedElement === elem ? 'var(--bg-active)' : 'var(--bg-card)',
                  color: selectedElement === elem ? 'var(--text-primary)' : 'var(--text-secondary)',
                  outline: selectedElement === elem ? '2px solid var(--accent-primary)' : 'none',
                }}
              >
                <ElementIcon element={elem} size={14} />
                <span style={{ textTransform: 'capitalize' }}>{elem}</span>
              </button>
            ))}

            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 4px' }} />

            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>
              Arma:
            </span>
            <button
              type="button"
              onClick={() => setSelectedWeapon('all')}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
                background: selectedWeapon === 'all' ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: selectedWeapon === 'all' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              Todas
            </button>
            {ALL_WEAPONS.map((wt) => (
              <button
                key={wt}
                type="button"
                onClick={() => setSelectedWeapon(wt === selectedWeapon ? 'all' : wt)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  background: selectedWeapon === wt ? 'var(--bg-active)' : 'var(--bg-card)',
                  color: selectedWeapon === wt ? 'var(--text-primary)' : 'var(--text-secondary)',
                  outline: selectedWeapon === wt ? '2px solid var(--accent-primary)' : 'none',
                }}
              >
                <WeaponTypeIcon weaponType={wt} size={14} />
                <span style={{ textTransform: 'capitalize' }}>{wt}</span>
              </button>
            ))}

            {(search || selectedElement !== 'all' || selectedWeapon !== 'all' || selectedRarity !== 'all' || selectedRegion !== 'all' || selectedVersion !== 'all') && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} style={{ marginLeft: 'auto', fontSize: '11px' }}>
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* Grid de Personagens do Catálogo */}
        <div
          style={{
            maxHeight: '480px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '10px',
            padding: '4px',
          }}
        >
          {filteredList.map((cat) => {
            const isOwned = ownedCharacterIds.has(cat.id);
            const is5Star = cat.rarity === 5;
            const rarityColor = is5Star ? '#fbbf24' : '#c084fc';

            return (
              <div
                key={cat.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: isOwned ? 'var(--bg-card)' : 'rgba(15, 23, 42, 0.4)',
                  border: isOwned
                    ? `1px solid ${is5Star ? 'rgba(245, 158, 11, 0.5)' : 'rgba(168, 85, 247, 0.5)'}`
                    : '1px solid var(--border-subtle)',
                  filter: isOwned ? 'none' : 'grayscale(0.9) opacity(0.75)',
                  transition: 'filter 0.2s ease, transform 0.15s ease, border-color 0.2s ease',
                  cursor: isOwned ? 'default' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isOwned) {
                    e.currentTarget.style.filter = 'none';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOwned) {
                    e.currentTarget.style.filter = 'grayscale(0.9) opacity(0.75)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }
                }}
              >
                {/* Badges de Elemento e Status */}
                <div style={{ position: 'absolute', top: '6px', left: '6px' }}>
                  <ElementIcon element={cat.element} size={16} />
                </div>
                <div style={{ position: 'absolute', top: '6px', right: '6px' }}>
                  <WeaponTypeIcon weaponType={cat.weaponType} size={14} />
                </div>

                {/* Avatar Portrait */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${rarityColor}`,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.8)',
                    marginTop: '12px',
                  }}
                >
                  <AssetImage
                    entityType="character"
                    entityId={cat.id}
                    alt={cat.namePtBr}
                    size={64}
                    shape="square"
                  />
                </div>

                {/* Nome e Estrelas */}
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                  title={cat.namePtBr}
                >
                  {cat.namePtBr}
                </div>

                <div style={{ color: rarityColor, fontSize: '11px', letterSpacing: '1px', marginTop: '2px' }}>
                  {'★'.repeat(cat.rarity)}
                </div>

                {/* Botão de Ação ou Status */}
                <div style={{ marginTop: '8px', width: '100%' }}>
                  {isOwned ? (
                    <Badge variant="success" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                      Já Possui
                    </Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => void onAddCharacter(cat.id)}
                      style={{ width: '100%', fontSize: '11px', padding: '3px 6px' }}
                    >
                      + Adicionar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ModalBody>
    </Modal>
  );
};
