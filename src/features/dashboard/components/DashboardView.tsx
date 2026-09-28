import React, { useEffect, useMemo, useState } from 'react';
import { useShell } from '../../../app/providers';
import type { CharacterBuild } from '../../../domain/builds/types';
import type { AchievementOverallSummary } from '../../../domain/achievements';
import type { AssetRef, CharacterData, WeaponData } from '../../../domain/catalog';
import { calculateWishEquivalences, type ProfileResources } from '../../../domain/inventory';
import type { WishGoal } from '../../../domain/wishes/goalTypes';
import { calculatePityProgression } from '../../../domain/wishes/pityEngine';
import type { BannerCurrentPity, BannerType, WishEntry } from '../../../domain/wishes/types';
import {
  achievementsRepository,
  buildsRepository,
  inventoryRepository,
  wishGoalsRepository,
  wishesRepository,
} from '../../../infrastructure/db';
import {
  defaultAssetProvider,
  defaultGameDataProvider,
  UI_ASSETS,
  getElementIconUrl,
} from '../../../infrastructure/providers';
import { WishHistoryChart } from './WishHistoryChart';
import { resolveProfileAvatar } from '../../../infrastructure/providers/publicProfileProvider';
import './DashboardView.css';
import { TotalWishesCard } from './TotalWishesCard';
import { DailyFarm } from './DailyFarm';
import { PendingAchievements } from './PendingAchievements';
import { findCustomArt, listCustomArt } from '../../../infrastructure/providers/customArtRepository';
import { usePublicProfile } from '../../../hooks/usePublicProfile';
import { AssetImage } from '../../../components';
import { profilePictureAsset } from '../../../infrastructure/providers/profilePictureAsset';
import { ArtCropEditor } from '../../../components/ArtCropEditor';
import { appSettingsRepository } from '../../../infrastructure/db/appSettingsRepository';

type AssetMap = Record<string, { src: string; fallbackSrc?: string; focus?: string; zoom?: number; assetId?: string }>;

const homeAssetUri = (asset: AssetRef) => (
  asset.source !== 'fallback' && !/^https?:/i.test(asset.uri) ? asset.uri : ''
);

const formatNumber = (value: number) => value.toLocaleString('pt-BR');
const relativeDate = (date: string) => {
  if (!date || !Number.isFinite(Date.parse(date))) return 'Sem data';
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Há 1 dia';
  return `Há ${days} dias`;
};

const IconArrow = () => <span className="dashboard-arrow" aria-hidden="true">›</span>;
const hideBrokenDecoration = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.style.visibility = 'hidden';
};

interface HomeAssetProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className: string;
  focus?: string;
  zoom?: number;
}

const HomeAsset: React.FC<HomeAssetProps> = ({ src, fallbackSrc, alt, className, focus, zoom = 1 }) => {
  const [errors, setErrors] = useState<string[]>([]);
  const currentSrc = [src, fallbackSrc].find((uri) => uri && !errors.includes(uri));
  const failed = !currentSrc;
  return (
    <span className={`${className} ${failed ? 'is-fallback' : ''} ${currentSrc?.includes('/splash/') ? 'is-splash' : ''}`} aria-label={alt}>
      {currentSrc && !failed && (
        <img
          src={currentSrc}
          alt={alt}
          style={focus ? { objectPosition: focus, transform: `scale(${zoom})`, transformOrigin: focus } : undefined}
          onError={() => setErrors((previous) => [...previous, currentSrc])}
        />
      )}
      {failed && <span className="dashboard-asset-fallback" aria-hidden="true" />}
    </span>
  );
};

const getGoalTag = (goal: WishGoal) => {
  if (goal.priority === 1) return 'Principal';
  if (goal.priority === 2) return 'Secundário';
  return 'Futuro';
};

const getGoalDescription = (goal: WishGoal) => goal.notes?.trim() || (
  goal.targetType === 'character'
    ? 'Seu próximo desejo.'
    : 'Um novo poder.'
);

export const DashboardView: React.FC = () => {
  const { activeProfile, navigateTo } = useShell();
  const publicProfile = usePublicProfile(activeProfile?.uid);
  const profileId = activeProfile?.id ?? null;
  const [loading, setLoading] = useState(Boolean(profileId));
  const [resources, setResources] = useState<ProfileResources | null>(null);
  const [pity, setPity] = useState<Record<BannerType, BannerCurrentPity> | null>(null);
  const [goals, setGoals] = useState<WishGoal[]>([]);
  const [farmBuilds, setFarmBuilds] = useState<CharacterBuild[]>([]);
  const [characters, setCharacters] = useState<Map<string, CharacterData>>(new Map());
  const [weapons, setWeapons] = useState<Map<string, WeaponData>>(new Map());
  const [achievements, setAchievements] = useState<AchievementOverallSummary | null>(null);
  const [wishes, setWishes] = useState<WishEntry[]>([]);
  const [goalAssets, setGoalAssets] = useState<AssetMap>({});
  const [activityAssets, setActivityAssets] = useState<AssetMap>({});
  const [editingGoal, setEditingGoal] = useState<WishGoal | null>(null);
  const [artRevision, setArtRevision] = useState(0);
  useEffect(() => { const refresh = () => setArtRevision(value => value + 1); window.addEventListener('wishlog-art-changed', refresh); return () => window.removeEventListener('wishlog-art-changed', refresh); }, []);

  useEffect(() => {
    let mounted = true;
    if (!profileId) {
      return () => { mounted = false; };
    }
    void Promise.all([
      inventoryRepository.getResources(profileId),
      wishesRepository.getBannerCurrentPity(profileId),
      wishGoalsRepository.getGoalsByProfile(profileId),
      buildsRepository.getProfileBuilds(profileId),
      achievementsRepository.getAchievementSummary(profileId),
      wishesRepository.getWishesByProfile(profileId),
      defaultGameDataProvider.getAllCharacters(),
    ]).then(async ([resourceData, pityData, goalData, buildData, achievementData, wishData, catalog]) => {
      if (!mounted) return;
      const visibleGoals = goalData
        .filter((goal) => goal.status === 'planning' || goal.status === 'reserved')
        .sort((a, b) => a.priority - b.priority || a.sortOrder - b.sortOrder);
      const recent = wishData.filter((wish) => wish.rarity >= 4).slice(0, 6);
      setResources(resourceData);
      setPity(pityData);
      setGoals(visibleGoals);
      setFarmBuilds(buildData.filter((build) => build.farmEnabled && build.farmStatus !== 'completed'));
      setAchievements(achievementData);
      setWishes(wishData);
      const characterMap = new Map(catalog.map((character) => [character.id, character]));
      const weaponMap = new Map<string, WeaponData>();
      setCharacters(new Map(characterMap));
      setLoading(false);

      const artLibrary = await listCustomArt().catch(cause => { console.warn('Artes personalizadas indisponíveis; usando assets padrão', cause); return []; });
      const goalEntries = await Promise.all(visibleGoals.slice(0, 3).map(async (goal) => {
        if (goal.targetType === 'character') {
          const character = await defaultGameDataProvider.getCharacter(goal.targetId);
          if (character) characterMap.set(goal.targetId, character);
        } else {
          const weapon = await defaultGameDataProvider.getWeapon(goal.targetId);
          if (weapon) weaponMap.set(goal.targetId, weapon);
        }
        const asset = goal.targetType === 'character'
          ? await defaultAssetProvider.getCharacterAsset(goal.targetId, 'splash')
          : await defaultAssetProvider.getWeaponAsset(goal.targetId, 'icon');
        const portrait = goal.targetType === 'character'
          ? await defaultAssetProvider.getCharacterAsset(goal.targetId, 'icon')
          : asset;
        const custom = goal.targetType === 'character' ? findCustomArt(artLibrary, goal.targetId, 'goal', 'card') ?? findCustomArt(artLibrary, goal.targetId, 'goal', 'splash') ?? findCustomArt(artLibrary, goal.targetId, 'goal', 'portrait') : undefined;
        const src = custom?.dataUri ?? homeAssetUri(asset);
        const assetId = custom?.id ?? src;
        const saved = await appSettingsRepository.getSetting(`art_crop:goal:${goal.targetId}`);
        const override = saved ? JSON.parse(saved) : null;
        const crop = override?.assetId === assetId && [override.focusX,override.focusY,override.zoom].every(Number.isFinite) && override.focusX >= 0 && override.focusX <= 100 && override.focusY >= 0 && override.focusY <= 100 && override.zoom >= 1 && override.zoom <= 4 ? override : custom;
        return [goal.id, { src, assetId, fallbackSrc: homeAssetUri(portrait), focus: crop ? `${crop.focusX}% ${crop.focusY}%` : undefined, zoom: crop?.zoom ?? 1 }] as const;
      }));
      const activityEntries = await Promise.all(recent.map(async (wish) => {
        const asset = wish.itemType === 'character'
          ? await defaultAssetProvider.getCharacterAsset(wish.itemId, 'icon')
          : await defaultAssetProvider.getWeaponAsset(wish.itemId, 'icon');
        return [wish.id, { src: homeAssetUri(asset) }] as const;
      }));
      if (mounted) {
        setCharacters(new Map(characterMap));
        setWeapons(weaponMap);
        setGoalAssets(Object.fromEntries(goalEntries));
        setActivityAssets(Object.fromEntries(activityEntries));
      }
    }).catch((error) => {
      console.error('Erro ao carregar a Home:', error);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [profileId, artRevision]);

  const equivalences = useMemo(() => calculateWishEquivalences(resources), [resources]);
  const characterPity = pity?.character?.current5StarPity ?? 0;
  const weaponPity = pity?.weapon?.current5StarPity ?? 0;
  const guarantee = calculatePityProgression(wishes, 'character').is5StarGuaranteed;
  const recentWishes = wishes.filter((wish) => wish.rarity >= 4).slice(0, 6);
  const totalPulls = wishes.length;

  if (loading) {
    return <div className="dashboard-loading"><span className="dashboard-loading-orb" />Carregando sua jornada...</div>;
  }

  const resourceCards = [
    { label: 'Primogemas', value: formatNumber(resources?.primogems ?? 0), icon: UI_ASSETS.items.primogem, sub: `${equivalences.pullsFromPrimogemsAndCrystals} tiros em gemas`, route: 'inventory' },
    { label: 'Destinos Entrelaçados', value: formatNumber(resources?.intertwinedFates ?? 0), icon: UI_ASSETS.items.intertwinedFate, sub: `Total: ${equivalences.totalPromotionalPulls} tiros`, route: 'inventory' },
    { label: 'Destinos Familiares', value: formatNumber(resources?.acquaintFates ?? 0), icon: UI_ASSETS.items.acquaintFate, sub: 'Invocação do Mochileiro', route: 'inventory' },
    { label: 'Brilho Estelar', value: formatNumber(resources?.starglitter ?? 0), icon: UI_ASSETS.items.starglitter, sub: `${equivalences.pullsFromStarglitter} tiros possíveis`, route: 'inventory' },
  ];

  const pityCards = [
    { label: 'Pity de Personagem', value: `${characterPity} / 90`, rawValue: characterPity, icon: UI_ASSETS.sidebar.characters.default, progress: characterPity / 90, route: 'wishes' },
    { label: 'Pity de Arma', value: `${weaponPity} / 80`, rawValue: weaponPity, icon: UI_ASSETS.sidebar.weapons, progress: weaponPity / 80, route: 'wishes' },
    { label: 'Tiros Disponíveis', value: formatNumber(equivalences.totalPromotionalPullsWithStarglitter), icon: UI_ASSETS.items.intertwinedFate, sub: `≈ ${formatNumber(equivalences.totalPromotionalPullsWithStarglitter * 160)} primogemas`, route: 'inventory' },
    { label: 'Status do 50/50', value: guarantee ? 'Garantido' : '50 / 50', icon: UI_ASSETS.sidebar.characters.default, sub: guarantee ? 'Seu próximo 5★ é garantido' : 'Próximo 5★ segue a regra do banner', route: 'wishes' },
  ];

  return (
    <div className="dashboard-view">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="dashboard-hero__stars" aria-hidden="true" />
        <div className="dashboard-hero__content">
          <div className="dashboard-hero__identity">
            {publicProfile?.avatarId && <AssetImage asset={profilePictureAsset(publicProfile)} entityType="character" entityId={resolveProfileAvatar(publicProfile.avatarId) ?? ''} alt="Foto do perfil" size={72} shape="circle" />}
            <div>
            <h1 id="dashboard-title">Olá, <span>{publicProfile?.nickname || activeProfile?.name || 'Viajante'}</span>!</h1>
            <p>{publicProfile?.signature || activeProfile?.notes || 'Que seus próximos desejos tragam grandes surpresas.'}</p>
            <span className="dashboard-hero__meta">
              <b>{activeProfile?.server ? activeProfile.server.toUpperCase() : 'PERFIL LOCAL'}</b>
              {activeProfile?.adventureRank ? <b>AR {activeProfile.adventureRank}</b> : null}
              {activeProfile?.uid ? <b>UID: <strong>{activeProfile.uid}</strong></b> : null}
            </span>
            </div>
          </div>
          <div className="dashboard-hero__quote">Novos horizontes<br />sempre nos aguardam.</div>
        </div>
      </section>

      <section className="dashboard-resource-grid" aria-label="Recursos do perfil">
        {resourceCards.map((card) => (
          <button key={card.label} type="button" className="dashboard-resource-card" onClick={() => navigateTo(card.route as never)}>
            <img src={card.icon} alt="" onError={hideBrokenDecoration} />
            <span><small>{card.label}</small><strong>{card.value}</strong><em>{card.sub}</em></span>
            <IconArrow />
          </button>
        ))}
        {pityCards.map((card) => (
          <button key={card.label} type="button" className="dashboard-resource-card dashboard-resource-card--secondary" onClick={() => navigateTo(card.route as never)}>
            <img src={card.icon} alt="" onError={hideBrokenDecoration} />
            <span><small>{card.label}</small><strong className={card.label === 'Status do 50/50' && guarantee ? 'is-guaranteed' : ''}>{'rawValue' in card && <span className="dashboard-sr-only">{card.rawValue}</span>}{card.value}</strong>
              {'progress' in card && typeof card.progress === 'number' && <i><b style={{ width: `${Math.min(100, card.progress * 100)}%` }} /></i>}
              {'sub' in card && <em>{card.sub}</em>}
            </span>
            <IconArrow />
          </button>
        ))}
        <TotalWishesCard resources={resources} characterPity={characterPity} weaponPity={weaponPity} />
      </section>
      {editingGoal && goalAssets[editingGoal.id] && <ArtCropEditor src={goalAssets[editingGoal.id].src} initial={{ focusX: Number(goalAssets[editingGoal.id].focus?.split('%')[0] ?? 50), focusY: Number(goalAssets[editingGoal.id].focus?.split(' ')[1]?.replace('%','') ?? 35), zoom: goalAssets[editingGoal.id].zoom ?? 1 }} onClose={() => setEditingGoal(null)} onApply={async crop => { await appSettingsRepository.setSetting(`art_crop:goal:${editingGoal.targetId}`, JSON.stringify({ ...crop, context:'goal', characterId:editingGoal.targetId, assetId:goalAssets[editingGoal.id].assetId })); window.dispatchEvent(new Event('wishlog-art-changed')); }} />}
      <div className="dashboard-main-grid">
          <section className="dashboard-panel dashboard-goals-panel">
            <div className="dashboard-panel__header"><div><h2>Próximos Alvos</h2><p>Planeje seus desejos e mantenha o foco.</p></div><button type="button" onClick={() => navigateTo('banners')}>Ver todos <IconArrow /></button></div>
            {goals.length === 0 ? <div className="dashboard-empty"><span>Nenhuma meta em planejamento</span><small>Defina seus próximos objetivos de desejos para acompanhar o foco.</small><button type="button" onClick={() => navigateTo('banners')}>Criar meta</button></div> : (
              <div className="dashboard-goals-grid" style={{ '--goal-count': Math.min(goals.length, 3) } as React.CSSProperties}>
                {goals.slice(0, 3).map((goal) => {
                  const character = goal.targetType === 'character' ? characters.get(goal.targetId) : undefined;
                  const rarity = character?.rarity ?? weapons.get(goal.targetId)?.rarity;
                  return <div key={goal.id} style={{ position: 'relative', minWidth: 0 }}><button type="button" className="dashboard-goal-card" style={{ width: '100%', height: '100%' }} title={`Prioridade: P${goal.priority} · ${goal.status === 'reserved' ? 'Reservado' : 'Planejado'}`} onClick={() => navigateTo('banners')}>
                    <HomeAsset
                      {...goalAssets[goal.id]}
                      alt={`Arte de ${goal.targetName}`}
                      className="dashboard-goal-card__asset"
                    />
                    <span className="dashboard-goal-card__shade" />
                    <span className={`dashboard-goal-card__indicator ${goal.status === 'reserved' ? 'is-reserved' : ''}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d={goal.status === 'reserved' ? 'm6 12 4 4 8-8' : 'M12 6v12M6 12h12'} /></svg>
                    </span>
                    <span className="dashboard-goal-card__body">
                      <span className="dashboard-goal-card__meta">
                        {character?.element ? <img src={getElementIconUrl(character.element)} alt={`Elemento ${character.element}`} onError={hideBrokenDecoration} /> : null}
                      </span>
                      <strong>{goal.targetName}</strong>
                      {rarity && <span className="dashboard-goal-card__rarity" aria-label={`${rarity} estrelas`}>{'★'.repeat(rarity)}</span>}
                      <em className={`dashboard-goal-card__tag dashboard-goal-card__tag--${goal.priority}`}>{getGoalTag(goal)}</em>
                      <span className="dashboard-goal-card__description">{getGoalDescription(goal)}</span>
                      <span className="dashboard-goal-card__footer">
                        <b>{goal.targetType === 'character' ? `C${goal.targetRank}` : `R${goal.targetRank}`}</b>
                        <span>{goal.reservedWishes} tiros <IconArrow /></span>
                      </span>
                    </span>
                  </button>{goalAssets[goal.id]?.src && <button type="button" className="art-edit-button" aria-label={`Enquadrar alvo ${goal.targetName}`} onClick={() => setEditingGoal(goal)}><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 12-12 4 4L8 20H4Z" fill="none" stroke="currentColor" strokeWidth="2" /></svg></button>}</div>;
                })}
              </div>
            )}
          </section>

          <section className="dashboard-lower-grid">
            <div className="dashboard-panel dashboard-chart-panel">
              <div className="dashboard-panel__header"><div><h2>Histórico de Tiros</h2><p>{totalPulls ? `${totalPulls} registros no perfil` : 'Seus registros aparecerão aqui'}</p></div><button type="button" onClick={() => navigateTo('wishes')}>Ver histórico <IconArrow /></button></div>
              {wishes.some(w => w.rarity === 5) ? <div className="dashboard-history-chart"><WishHistoryChart wishes={wishes} /></div> : <div className="dashboard-empty dashboard-empty--compact">Registre um tiro 5★ para visualizar seu histórico.</div>}
            </div>
            <DailyFarm />
          </section>
          <section className="dashboard-panel dashboard-activity-panel">
            <div className="dashboard-panel__header"><div><h2>Atividade Recente</h2><p>Últimos itens registrados</p></div><button type="button" onClick={() => navigateTo('wishes')}>Ver tudo <IconArrow /></button></div>
            {recentWishes.length === 0 ? <div className="dashboard-empty dashboard-empty--compact">Nenhum tiro registrado</div> : <div className="dashboard-activity-list">
              {recentWishes.map((wish) => <button type="button" key={wish.id} className="dashboard-activity-item" onClick={() => navigateTo('wishes')}>
                <HomeAsset
                  {...activityAssets[wish.id]}
                  alt={`Ícone de ${wish.itemName}`}
                  className="dashboard-activity-item__asset"
                />
                <span className="dashboard-activity-item__details"><strong>{wish.itemName}</strong><small><span>{wish.rarity}★</span> · {wish.itemType === 'character' ? 'Personagem' : 'Arma'} · <span>{wish.pityIndex}º tiro</span></small></span><time>{relativeDate(wish.occurredAt)}</time>
              </button>)}
            </div>}
          </section>
          <div className="dashboard-side-summary-grid">
            <section className="dashboard-mini-summary"><strong>Fila de Farm</strong><span>{farmBuilds.length} {farmBuilds.length === 1 ? 'plano ativo' : 'planos ativos'}</span>{farmBuilds.length > 0 ? <div className="dashboard-farm-preview">{farmBuilds.map((build) => <button type="button" key={build.id} onClick={() => navigateTo('farm')}><AssetImage entityType="character" entityId={build.characterId} alt="" size={36} />{characters.get(build.characterId)?.namePtBr ?? build.characterId} <small>Em Farm · Alvo: Nv. {build.characterTargetLevel}</small></button>)}</div> : <div className="dashboard-farm-preview"><span>Nenhum personagem na fila de farm</span></div>}<button type="button" onClick={() => navigateTo('farm')}>Abrir fila <IconArrow /></button></section>
            {achievements && <section className="dashboard-mini-summary dashboard-achievement-summary"><strong>Conquistas</strong><PendingAchievements /><span>{achievements.completedAchievements} / {achievements.totalAchievements} concluídas</span><i><b style={{ width: `${achievements.overallPercentage}%` }} /></i><button type="button" onClick={() => navigateTo('achievements')}>Ver catálogo <IconArrow /></button></section>}
          </div>
      </div>
    </div>
  );
};
