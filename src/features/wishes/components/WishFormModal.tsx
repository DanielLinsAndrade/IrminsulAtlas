import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AssetImage, Button, Input, Modal, Select } from '../../../components';
import type { CharacterData, WeaponData } from '../../../domain/catalog';
import type {
  BannerType,
  CreateWishInput,
  FiftyFiftyStatus,
  UpdateWishInput,
  WishEntry,
  WishItemType,
} from '../../../domain/wishes/types';
import { defaultGameDataProvider } from '../../../infrastructure/providers';
import { WEAPON_FATE_LABELS, WEAPON_PATH_LABELS, type WeaponFateState, type WeaponPathResult } from '../../../domain/wishes/weaponFate';
import { bannerEligibilityError } from '../../../domain/wishes/bannerEligibility';
import { CHRONICLED_POOLS } from '../../../domain/wishes/chronicledPools';
import { CATALOG_VERSIONS } from '../../../domain/catalog/versions';

interface WishFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateWishInput | UpdateWishInput) => Promise<void>;
  initialBannerType?: BannerType;
  editingWish?: WishEntry | null;
  isSaving?: boolean;
}

interface WishFormContentProps {
  editingWish?: WishEntry | null;
  initialBannerType: BannerType;
  onClose: () => void;
  onSubmit: (input: CreateWishInput | UpdateWishInput) => Promise<void>;
  isSaving: boolean;
}

const COMMON_VERSIONS = [...CATALOG_VERSIONS].reverse();

interface CatalogItemSuggestion {
  id: string;
  namePtBr: string;
  itemType: WishItemType;
  rarity: number;
}

const WishFormContent: React.FC<WishFormContentProps> = ({
  editingWish,
  initialBannerType,
  onClose,
  onSubmit,
  isSaving,
}) => {
  const isEditing = Boolean(editingWish);
  const [validationError, setValidationError] = useState('');
  const [weaponFateState, setWeaponFateState] = useState<WeaponFateState | ''>(editingWish?.weaponFateState ?? '');
  const [weaponPathResult, setWeaponPathResult] = useState<WeaponPathResult | ''>(editingWish?.weaponPathResult ?? '');

  // Estados do formulário
  const [bannerType, setBannerType] = useState<BannerType>(
    editingWish ? editingWish.bannerType : initialBannerType
  );
  const [itemType, setItemType] = useState<WishItemType>(
    editingWish
      ? editingWish.itemType
      : initialBannerType === 'weapon'
      ? 'weapon'
      : 'character'
  );
  const [itemId, setItemId] = useState<string>(editingWish?.itemId ?? '');
  const [itemName, setItemName] = useState<string>(editingWish?.itemName ?? '');
  const [rarity, setRarity] = useState<number>(editingWish?.rarity ?? 5);
  const [pityIndex, setPityIndex] = useState<string>(
    editingWish ? String(editingWish.pityIndex) : ''
  );
  const [occurredAt, setOccurredAt] = useState<string>(
    editingWish
      ? editingWish.occurredAt.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [gameVersionId, setGameVersionId] = useState<string>(
    editingWish?.gameVersionId ?? ''
  );
  const [bannerName, setBannerName] = useState<string>(
    editingWish?.bannerName ?? ''
  );

  // Estado da Máquina 50/50 (3 estados)
  const initialFiftyFiftyStatus: FiftyFiftyStatus = useMemo(() => {
    if (!editingWish) return 'won';
    if (!editingWish.isFeatured) return 'lost';
    if (editingWish.wonPityRate) return 'won';
    return 'guaranteed';
  }, [editingWish]);

  const [fiftyFiftyStatus, setFiftyFiftyStatus] = useState<FiftyFiftyStatus>(initialFiftyFiftyStatus);
  const [isFeatured4Star, setIsFeatured4Star] = useState<boolean>(editingWish?.isFeatured ?? true);
  const [notes, setNotes] = useState<string>(editingWish?.notes ?? '');

  // Catálogo carregado
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [weapons, setWeapons] = useState<WeaponData[]>([]);

  // Autocomplete UI state
  const [searchQuery, setSearchQuery] = useState<string>(editingWish?.itemName ?? '');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      await defaultGameDataProvider.ensureCatalogLoaded();
      const [cList, wList] = await Promise.all([
        defaultGameDataProvider.getAllCharacters(),
        defaultGameDataProvider.getAllWeapons(),
      ]);
      setCharacters(cList);
      setWeapons(wList);
    })();
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sugestões do Autocomplete
  const suggestions: CatalogItemSuggestion[] = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const charMatches: CatalogItemSuggestion[] = characters
      .filter((c) => c.namePtBr.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .map((c) => ({
        id: c.id,
        namePtBr: c.namePtBr,
        itemType: 'character',
        rarity: c.rarity,
      }));

    const weaponMatches: CatalogItemSuggestion[] = weapons
      .filter((w) => w.namePtBr.toLowerCase().includes(q) || w.id.toLowerCase().includes(q))
      .map((w) => ({
        id: w.id,
        namePtBr: w.namePtBr,
        itemType: 'weapon',
        rarity: w.rarity,
      }));

    // Prioriza de acordo com o tipo de banner selecionado
    if (bannerType === 'weapon') {
      return [...weaponMatches, ...charMatches].slice(0, 10);
    }
    return [...charMatches, ...weaponMatches].slice(0, 10);
  }, [searchQuery, characters, weapons, bannerType]);

  const handleSelectSuggestion = (item: CatalogItemSuggestion) => {
    setItemId(item.id);
    setItemName(item.namePtBr);
    setItemType(item.itemType);
    setRarity(item.rarity);
    setSearchQuery(item.namePtBr);
    setIsDropdownOpen(false);

    // Sugere defaults baseados no tipo do banner
    if (bannerType === 'standard') {
      setFiftyFiftyStatus('won');
    }
  };

  const maxPity = bannerType === 'weapon' ? 80 : 90;

function formatIsoDateSafely(datetimeLocalStr: string, originalIsoStr?: string): string {
  if (!datetimeLocalStr) return new Date().toISOString();
  if (originalIsoStr && originalIsoStr.startsWith(datetimeLocalStr)) {
    return originalIsoStr;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeLocalStr)) {
    return `${datetimeLocalStr}:00.000Z`;
  }
  return new Date(datetimeLocalStr).toISOString();
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = itemName.trim() || searchQuery.trim();
    const eligibility = bannerEligibilityError({ bannerType, itemType, itemId, rarity, gameVersionId });
    if (eligibility && (!editingWish || editingWish.itemId !== itemId || editingWish.bannerType !== bannerType || editingWish.gameVersionId !== gameVersionId || editingWish.rarity !== rarity)) { setValidationError(eligibility); return; }
    if (!finalName) return;

    const formattedDate = formatIsoDateSafely(occurredAt, editingWish?.occurredAt);

    // Mapeia máquina de 50/50 para flags isFeatured e wonPityRate
    let isFeatured: boolean;
    let wonPityRate: boolean;

    if (rarity === 5) {
      if (bannerType === 'character' || bannerType === 'chronicled') {
        if (fiftyFiftyStatus === 'won') {
          isFeatured = true;
          wonPityRate = true;
        } else if (fiftyFiftyStatus === 'lost') {
          isFeatured = false;
          wonPityRate = false;
        } else {
          // 'guaranteed'
          isFeatured = true;
          wonPityRate = false;
        }
      } else {
        // Padrão / Armas
        isFeatured = bannerType === 'weapon' ? isFeatured4Star : true;
        wonPityRate = false;
      }
    } else {
      isFeatured = isFeatured4Star;
      wonPityRate = false;
    }

    const parsedPity = pityIndex.trim() !== '' ? Number(pityIndex) : undefined;

    await onSubmit({
      bannerType,
      itemType,
      itemId: itemId || `custom_${Date.now()}`,
      itemName: finalName,
      rarity,
      pityIndex: parsedPity && parsedPity > 0 ? parsedPity : undefined,
      occurredAt: formattedDate,
      gameVersionId: gameVersionId.trim() || null,
      bannerName: bannerName.trim() || null,
      isFeatured,
      wonPityRate,
      notes: notes.trim() || null,
      weaponFateState: bannerType === 'weapon' ? weaponFateState || null : null,
      weaponPathResult: bannerType === 'weapon' ? weaponPathResult || null : null,
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {validationError && <p role="alert" className="ui-error">{validationError}</p>}
        {bannerType === 'chronicled' && <label>Edição histórica do Crônico<select aria-label="Edição do Crônico" value={CHRONICLED_POOLS[gameVersionId] ? gameVersionId : ''} onChange={e => setGameVersionId(e.target.value)}><option value="">Selecione o pool verificado</option>{Object.entries(CHRONICLED_POOLS).map(([version,pool]) => <option value={version} key={version}>{pool.name}</option>)}</select><small>O pool é específico da edição. O histórico já importado permanece intacto.</small></label>}
        {bannerType === 'weapon' && rarity === 5 && <label>Resultado do Caminho Divino<select aria-label="Resultado do Caminho Divino" value={weaponPathResult} onChange={e => setWeaponPathResult(e.target.value as WeaponPathResult | '')}><option value="">Não informado</option>{Object.entries(WEAPON_PATH_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><small>Informe se veio a arma escolhida. Promocional e arma escolhida são informações distintas.</small></label>}
        {bannerType === 'weapon' && <label>Caminho Divino · estado histórico<select aria-label="Pontos do Destino" value={weaponFateState} onChange={e => setWeaponFateState(e.target.value as WeaponFateState | '')}><option value="">Não informado</option>{Object.entries(WEAPON_FATE_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><small>Estado registrado manualmente para aquela época; independente do 50/50 de personagem.</small></label>}
        {/* 1. Tipo de Banner */}
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Tipo de Banner *
        </label>
        <Select
          value={bannerType}
          onChange={(e) => setBannerType(e.target.value as BannerType)}
          options={[
            { value: 'character', label: 'Personagem (Oração de Evento)' },
            { value: 'weapon', label: 'Arma (Invocação do Epítome)' },
            { value: 'standard', label: 'Mochileiro (Invocação Comum)' },
            { value: 'chronicled', label: 'Banner Crônico (Oração Mista Regional)' },
          ]}
        />
      </div>

      {/* 2. Autocomplete Unificado de Item e Raridade Bloqueada */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Item Obtido (Personagem ou Arma) *
        </label>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setItemName(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Digite o nome oficial (ex: Mavuika, Báculo de Homa, Favonius)..."
              required
            />

            {/* Dropdown de sugestões */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  zIndex: 50,
                }}
              >
                {suggestions.map((sug) => {
                  const is5Star = sug.rarity === 5;
                  const is4Star = sug.rarity === 4;
                  const rColor = is5Star ? '#fbbf24' : is4Star ? '#c084fc' : '#94a3b8';

                  return (
                    <button
                      key={`${sug.itemType}_${sug.id}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-primary, #f8fafc)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AssetImage
                          entityType={sug.itemType}
                          entityId={sug.id}
                          alt={sug.namePtBr}
                          size={28}
                          shape="square"
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: rColor }}>
                            {sug.namePtBr}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                            {sug.itemType === 'character' ? 'Personagem' : 'Arma'}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: rColor }}>
                        {'★'.repeat(sug.rarity)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badge de Raridade Bloqueada / Seletor */}
          <div style={{ width: '130px', flexShrink: 0 }}>
            <Select
              value={String(rarity)}
              onChange={(e) => setRarity(Number(e.target.value))}
              disabled={Boolean(itemId)}
              options={[
                { value: '5', label: '5★ Lendário' },
                { value: '4', label: '4★ Épico' },
                { value: '3', label: '3★ Comum' },
              ]}
              style={{
                borderColor: rarity === 5 ? '#fbbf24' : rarity === 4 ? '#c084fc' : undefined,
                color: rarity === 5 ? '#fbbf24' : rarity === 4 ? '#c084fc' : undefined,
                fontWeight: 700,
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Versão do Jogo e Data / Hora */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Versão do Jogo
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              list="game-versions-list"
              value={gameVersionId}
              onChange={(e) => setGameVersionId(e.target.value)}
              placeholder="Ex: 5.4"
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '13px',
              }}
            />
            <datalist id="game-versions-list">
              {COMMON_VERSIONS.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Data e Hora
          </label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              colorScheme: 'dark',
            }}
            required
          />
        </div>
      </div>

      {/* 4. Pity Manual */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '14px',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Contagem de Pity {rarity === 5 ? `(1 a ${maxPity})` : rarity === 4 ? '(1 a 10)' : ''}
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Deixe vazio para cálculo automático contínuo
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            min={1}
            max={rarity === 5 ? maxPity : 90}
            value={pityIndex}
            onChange={(e) => setPityIndex(e.target.value)}
            placeholder={rarity === 5 ? 'Ex: 76 (tiro no qual veio o 5★)' : 'Automático'}
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
            }}
          />
          {rarity === 5 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 40, 75, 80].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPityIndex(String(p))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Status 50/50 (Para 5★ em banners de personagem ou registro) */}
      {rarity === 5 && (bannerType === 'character' || bannerType === 'chronicled') && (
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            padding: '14px',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {bannerType === 'chronicled' ? 'Resultado do Destino Crônico *' : 'Status do 50/50 para este 5★ *'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {(
              [
                { id: 'won', label: 'Venceu 50/50', desc: 'Personagem limitado sem garantia prévia', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: '#34d399' },
                { id: 'lost', label: 'Perdeu 50/50', desc: 'Veio um 5★ do mochileiro', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: '#f87171' },
                { id: 'guaranteed', label: 'Garantido', desc: 'Limitado obtido com garantia de perda anterior', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8' },
              ] as const
            ).map((opt) => {
              const isSelected = fiftyFiftyStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFiftyFiftyStatus(opt.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${opt.border}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected ? opt.bg : 'rgba(15, 23, 42, 0.6)',
                    color: isSelected ? opt.color : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
                    {isSelected ? '● ' : '○ '}{bannerType === 'chronicled' ? opt.id === 'won' ? 'Destino escolhido' : opt.id === 'lost' ? 'Outro destino' : 'Destino garantido' : opt.label}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8, lineHeight: 1.2 }}>
                    {bannerType === 'chronicled' ? 'Resultado informado para esta edição do Crônico' : opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Destaque para 4★ */}
      {(rarity === 4 || (rarity === 5 && bannerType === 'weapon')) && (
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#f1f5f9', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isFeatured4Star}
              onChange={(e) => setIsFeatured4Star(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Item {rarity}★ em Destaque no Banner Atual</span>
          </label>
        </div>
      )}

      {/* 6. Nome do Banner e Anotações (Opcionais) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Nome do Banner (Opcional)
          </label>
          <Input
            value={bannerName}
            onChange={(e) => setBannerName(e.target.value)}
            placeholder="Ex: Chamas da Alvorada..."
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Anotações (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Veio no primeiro 10-pull, etc."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '13px',
            }}
          />
        </div>
      </div>
      </div>

      {/* 7. Botões de Ação */}
      <div className="modal-footer" style={{ padding: '14px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(16, 17, 34, 0.5)', flexShrink: 0 }}>
        <Button variant="secondary" type="button" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isSaving || (!itemName.trim() && !searchQuery.trim())}>
          {isSaving ? 'Salvando...' : isEditing ? 'Atualizar Oração' : 'Adicionar Oração'}
        </Button>
      </div>
    </form>
  );
};

export const WishFormModal: React.FC<WishFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialBannerType = 'character',
  editingWish,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingWish ? 'Editar Registro de Oração' : 'Registrar Nova Oração (Tiro)'}
      maxWidth="620px"
    >
      <WishFormContent
        key={editingWish ? editingWish.id : `new-${initialBannerType}`}
        editingWish={editingWish}
        initialBannerType={initialBannerType}
        onClose={onClose}
        onSubmit={onSubmit}
        isSaving={isSaving}
      />
    </Modal>
  );
};
