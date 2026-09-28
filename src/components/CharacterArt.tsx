import { useEffect, useRef, useState } from 'react';
import { AssetImage } from './AssetImage';
import { defaultAssetProvider } from '../infrastructure/providers';
import { findCustomArt, listCustomArt, type ArtContext } from '../infrastructure/providers/customArtRepository';
import './CharacterArt.css';
import { ArtCropEditor } from './ArtCropEditor';
import { SPLASH_DEFAULTS } from '../domain/catalog/artDefaults';
import { cropStyle } from '../lib/artCrop';
import { appSettingsRepository } from '../infrastructure/db/appSettingsRepository';

export function CharacterArt({ characterId, name, context, className = '', presentation = context === 'build' ? 'focused' : 'standard' }: { characterId: string; name: string; context: ArtContext; className?: string; presentation?: 'standard' | 'focused' | 'integrated' }) {
  const [art, setArt] = useState<{ src: string; assetId: string; splash: boolean; x: number; y: number; zoom?: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState(1.5);
  const cropKey = `art_crop:${context}:${characterId}`;
  const [failed, setFailed] = useState<string[]>([]);
  const [error, setError] = useState('');
  const fit = context === 'goal' || presentation === 'focused' ? 'cover' : 'contain';
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const library = await listCustomArt();
        let custom = context === 'character'
          ? findCustomArt(library, characterId, context, 'splash') ?? findCustomArt(library, characterId, context, 'card')
          : findCustomArt(library, characterId, context, 'card') ?? findCustomArt(library, characterId, context, 'splash') ?? findCustomArt(library, characterId, context, 'portrait');
        const standard = custom ? null : await defaultAssetProvider.getCharacterAsset(characterId, 'splash');
        if (!custom && standard?.isFallback) custom = findCustomArt(library, characterId, context, 'portrait');
        const saved = await appSettingsRepository.getSetting(cropKey);
        const crop = saved ? JSON.parse(saved) : null;
        const selected = custom ? { src: custom.dataUri, assetId: custom.id, splash: custom.variant !== 'portrait', x: custom.focusX, y: custom.focusY, zoom: custom.zoom ?? 1 } : { src: standard!.uri, assetId: standard!.uri, splash: !standard!.isFallback, x: SPLASH_DEFAULTS[context].focusX, y: SPLASH_DEFAULTS[context].focusY, zoom: !standard!.isFallback ? SPLASH_DEFAULTS[context].zoom : 1 };
        if (crop && crop.assetId === selected.assetId && [crop.focusX,crop.focusY,crop.zoom].every(Number.isFinite) && crop.focusX >= 0 && crop.focusX <= 100 && crop.focusY >= 0 && crop.focusY <= 100 && crop.zoom >= 1 && crop.zoom <= 4) Object.assign(selected, { x: crop.focusX, y: crop.focusY, zoom: crop.zoom });
        if (alive) setArt(selected);
      } catch (cause) { if (alive) setError(cause instanceof Error ? cause.message : 'Arte indisponível'); }
    };
    void load(); window.addEventListener('wishlog-art-changed', load);
    return () => { alive = false; window.removeEventListener('wishlog-art-changed', load); };
  }, [characterId, context, cropKey]);
  return <div ref={frame} className={`character-art ${className}`} data-presentation={presentation} data-splash={art?.splash} title={error || undefined}>
    {presentation === 'integrated' && art && !failed.includes(art.src) && <img className="character-art-atmosphere" src={art.src} alt="" aria-hidden="true" />}
    <div className="character-art-plane">{art && !failed.includes(art.src) ? <img className="character-art-focus" src={art.src} alt={name} style={{ ...cropStyle({ focusX: art.x, focusY: art.y, zoom: art.zoom ?? 1 }), objectFit: fit }} onError={() => setFailed(previous => [...previous, art.src])} /> : <AssetImage entityType="character" entityId={characterId} alt={name} size={160} style={{ width: '100%', height: '100%', border: 0, background: 'transparent' }} />}</div>
    {art && <button type="button" className="art-edit-button" aria-label={`Enquadrar arte de ${name}`} onClick={e => { e.stopPropagation(); const rect = frame.current?.getBoundingClientRect(); if (rect?.height) setAspectRatio(rect.width / rect.height); setEditing(true); }}><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 12-12 4 4L8 20H4Z" fill="none" stroke="currentColor" strokeWidth="2" /></svg></button>}
    {editing && art && <ArtCropEditor fit={fit} aspectRatio={presentation === 'integrated' ? aspectRatio * 2.4 : aspectRatio} src={art.src} initial={{ focusX: art.x, focusY: art.y, zoom: art.zoom ?? 1 }} onClose={() => setEditing(false)} onApply={async crop => { await appSettingsRepository.setSetting(cropKey, JSON.stringify({ ...crop, context, characterId, assetId: art.assetId })); window.dispatchEvent(new Event('wishlog-art-changed')); }} />}
  </div>;
}
