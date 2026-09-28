import { useShell } from '../../app/providers';
import { isAvailableTraveler, travelerIdentity } from '../../domain/profiles/traveler';
import { useEffect, useState } from 'react';
import { Button, Modal } from '../../components';
import { PageHero } from '../../components/PageLayout';
import { defaultGameDataProvider } from '../../infrastructure/providers';
import { listCustomArt, readArtFile, saveCustomArt, validateArtLibrary, type CustomArt, type ArtContext, type ArtVariant } from '../../infrastructure/providers/customArtRepository';
import type { CharacterData } from '../../domain/catalog';
import { downloadJson } from '../../lib/downloadJson';
import { ArtCropEditor } from '../../components/ArtCropEditor';
import { cropStyle } from '../../lib/artCrop';
import { appSettingsRepository } from '../../infrastructure/db/appSettingsRepository';
import './ArtsView.css';
import { SPLASH_DEFAULTS } from '../../domain/catalog/artDefaults';

export function ArtsView() {
  const { activeProfile } = useShell();
  const [items, setItems] = useState<CustomArt[]>([]);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [characterId, setCharacterId] = useState('');
  const [context, setContext] = useState<ArtContext>('character');
  const [variant, setVariant] = useState<ArtVariant>('splash');
  const [file, setFile] = useState<File | null>(null);
  const [focusX, setFocusX] = useState(50);
  const [focusY, setFocusY] = useState(35);
  const [zoom, setZoom] = useState<number>(SPLASH_DEFAULTS.character.zoom);
  const [preview, setPreview] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ message: string; apply: () => Promise<void> } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<CustomArt | null>(null);
  useEffect(() => { let alive = true; void Promise.all([listCustomArt(), defaultGameDataProvider.getAllCharacters()]).then(([arts, catalog]) => { if (alive) { setItems(arts); setCharacters(catalog); } }).catch(cause => { if (alive) setError(String(cause)); }); return () => { alive = false; }; }, []);
  const isScreen = ['dashboard','banners','builds'].includes(context);
  useEffect(() => {
    let alive = true;
    if (file) void readArtFile(file).then(uri => { if (alive) setPreview(uri); }).catch(cause => { if (alive) { setPreview(''); setError(String(cause)); } });
    return () => { alive = false; };
  }, [file]);
  async function save(confirmed = false) {
    if (!file || (!isScreen && !characterId)) return;
    setBusy(true); setError('');
    try {
      if (!isScreen && (!isAvailableTraveler(characterId, activeProfile?.travelerGender) || (context === 'goal' && travelerIdentity(characterId)))) throw new Error('Personagem indisponível neste contexto.');
      const id = isScreen ? '' : characterId;
      const dataUri = await readArtFile(file);
      const existing = items.find(a => a.characterId === id && a.context === context && (isScreen || a.variant === variant));
      if (existing && !confirmed) { setConfirmAction({ message: 'Substituir a arte associada a este contexto?', apply: () => save(true) }); return; }
      const art: CustomArt = { id: crypto.randomUUID(), name: file.name, characterId: id, context, variant, dataUri, focusX, focusY, zoom, createdAt: new Date().toISOString() };
      const next = [...items.filter(a => a.id !== existing?.id), art];
      await saveCustomArt(next); setItems(next); setFile(null); setPreview('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao salvar arte.'); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true); setError('');
    try { const next = items.filter(a => a.id !== id); await saveCustomArt(next); setItems(next); }
    catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  async function restore(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError('');
    try {
      if (file.size > 30_000_000) throw new Error('Backup excede 30 MB.');
      const payload = JSON.parse(await file.text());
      if (payload.format !== 'wishlog_art_library' || payload.schemaVersion !== 1) throw new Error('Formato de backup de artes incompatível.');
      const imported = validateArtLibrary(payload.entries);
      const next = [...items];
      for (const art of imported) if (!next.some(existing => existing.id === art.id || (existing.characterId === art.characterId && existing.context === art.context && existing.variant === art.variant))) next.push(art);
      await saveCustomArt(next); setItems(next);
    } catch (cause) { setError(String(cause)); } finally { setBusy(false); }
  }
  return <div className="ui-page"><PageHero title="Artes" subtitle="Sua biblioteca local de personagens, builds e painéis. Compartilhada entre os perfis desta instalação." />
    {error && <p role="alert" className="ui-error">{error}</p>}
    <section className="ui-panel"><h2>Backup da biblioteca</h2><p className="ui-muted">As artes são compartilhadas e não fazem parte do backup de perfis. Exporte esta biblioteca separadamente. A restauração adiciona associações ausentes, sem substituir as existentes.</p><div className="art-library-backup"><Button variant="secondary" disabled={busy} onClick={() => downloadJson('irminsul-atlas-art-library.json', JSON.stringify({ format: 'wishlog_art_library', schemaVersion: 1, entries: items }, null, 2))}>Exportar biblioteca</Button><label>Restaurar biblioteca<input disabled={busy} type="file" accept="application/json,.json" onChange={e => void restore(e.target.files?.[0])} /></label></div></section>
    <section className="ui-panel"><h2>Associar arte local</h2><p className="ui-muted">PNG, JPEG ou WebP até 5 MB. Os arquivos são copiados para a biblioteca persistente, sem depender da pasta original. Limpar cache não remove artes.</p>
      <div className="art-association-fields"><label>Contexto<select value={context} onChange={e => setContext(e.target.value as ArtContext)}><option value="character">Personagem (todos os cards)</option><option value="build">Build do personagem</option><option value="goal">Card de alvo</option><option value="dashboard">Fundo da Home</option><option value="banners">Fundo do Planejamento</option><option value="builds">Fundo de Builds</option></select></label>
      {!isScreen && <label>Personagem<select value={characterId} onChange={e => setCharacterId(e.target.value)}><option value="">Selecione</option>{characters.filter(c => isAvailableTraveler(c.id, activeProfile?.travelerGender) && (context !== 'goal' || !travelerIdentity(c.id))).map(c => <option key={c.id} value={c.id}>{c.namePtBr}</option>)}</select></label>}
      <label>Uso<select value={variant} onChange={e => setVariant(e.target.value as ArtVariant)}><option value="splash">Splash</option><option value="portrait">Portrait</option><option value="card">Banner / card art</option></select></label>
      <label className="art-association-file">Imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { setPreview(''); setFile(e.target.files?.[0] ?? null); }} /></label></div>
      {preview && <div style={{ height: 320, overflow: 'hidden', borderRadius: 12 }}><img alt="Prévia da nova arte" src={preview} style={{ width: '100%', height: '100%', ...cropStyle({ focusX, focusY, zoom }) }} /></div>}
      <div className="art-association-controls"><label>Foco horizontal <output>{focusX}%</output><input type="range" min="0" max="100" value={focusX} onChange={e => setFocusX(Number(e.target.value))} /></label><label>Foco vertical <output>{focusY}%</output><input type="range" min="0" max="100" value={focusY} onChange={e => setFocusY(Number(e.target.value))} /></label><label>Zoom <output>{zoom.toFixed(2)}×</output><input type="range" min="1" max="4" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label></div>
      <div className="art-association-actions"><Button variant="secondary" onClick={() => { setFocusX(50); setFocusY(50); setZoom(1); }}>Recentralizar</Button><Button disabled={busy || !preview || (!isScreen && !characterId)} onClick={() => void save()}>Importar e associar</Button></div>
    </section>
    {editing && <ArtCropEditor src={editing.dataUri} initial={{ focusX: editing.focusX, focusY: editing.focusY, zoom: editing.zoom ?? 1 }} onClose={() => setEditing(null)} onApply={async crop => { const current = await listCustomArt(); const next = current.map(a => a.id === editing.id ? { ...a, ...crop } : a); const settings = await appSettingsRepository.getAllSettings(); for (const [key,value] of Object.entries(settings)) if (key.startsWith('art_crop:') && JSON.parse(value).assetId === editing.id) await appSettingsRepository.deleteSetting(key); await saveCustomArt(next); setItems(next); }} />}
    <section className="arts-library">{items.filter(art => isAvailableTraveler(art.characterId, activeProfile?.travelerGender) && (art.context !== 'goal' || !travelerIdentity(art.characterId))).map(art => <article className="ui-panel" key={art.id}><div style={{ height: 190, overflow: 'hidden' }}><img src={art.dataUri} alt={art.name} style={{ width: '100%', height: '100%', ...cropStyle({ ...art, zoom: art.zoom ?? 1 }) }} onError={e => { e.currentTarget.style.display = 'none'; }} /></div><h3>{characters.find(c => c.id === art.characterId)?.namePtBr ?? 'Arte de tela'}</h3><p className="ui-muted">{art.name} · {art.context} · {art.variant}</p><Button variant="secondary" onClick={() => setEditing(art)}>Editar enquadramento</Button><Button variant="secondary" disabled={busy} onClick={() => setConfirmAction({ message: 'Remover esta arte da biblioteca local? O arquivo original não será excluído.', apply: () => remove(art.id) })}>Remover / desassociar</Button></article>)}</section>
    {confirmAction && <Modal isOpen title="Confirmar alteração da biblioteca" onClose={() => !busy && setConfirmAction(null)} footer={<><Button variant="secondary" disabled={busy} onClick={() => setConfirmAction(null)}>Cancelar</Button><Button disabled={busy} onClick={async () => { await confirmAction.apply(); setConfirmAction(null); }}>Confirmar</Button></>}>{confirmAction.message}</Modal>}
    {!items.length && <p className="ui-empty">Nenhuma arte personalizada. Os assets padrão continuam disponíveis.</p>}
  </div>;
}
