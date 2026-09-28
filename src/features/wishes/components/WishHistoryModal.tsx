import { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter } from '../../../components';
import { useShell } from '../../../app/providers';
import { parseWishHistory, previewWishHistory, type PortableWish } from '../../../domain/wishes/history';
import { wishesRepository } from '../../../infrastructure/db';
import { defaultGameDataProvider as localGameDataProvider } from '../../../infrastructure/providers';

export function WishHistoryModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { activeProfile } = useShell();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{ entries: PortableWish[]; skipped: number } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  async function analyze() {
    if (!activeProfile) return;
    setBusy(true); setError(''); setPreview(null); setDone('');
    try {
      if (text.length > 20_000_000) throw new Error('Arquivo excede 20 MB.');
      const [characters, weapons, existing] = await Promise.all([localGameDataProvider.getAllCharacters(), localGameDataProvider.getAllWeapons(), wishesRepository.getWishesByProfile(activeProfile.id)]);
      setPreview(previewWishHistory(parseWishHistory(text, characters, weapons), existing, activeProfile.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao analisar histórico.'); }
    finally { setBusy(false); }
  }
  async function apply() {
    if (!activeProfile || !preview) return;
    setBusy(true); setError('');
    try {
      const count = await wishesRepository.importHistory(activeProfile.id, preview.entries);
      setDone(`${count} registros importados. O pity atual manual não foi alterado.`); setPreview(null); onImported();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao importar. Nenhum lote parcial foi gravado.'); }
    finally { setBusy(false); }
  }
  return <Modal isOpen title="Importar histórico de tiros" onClose={() => { if (!busy) onClose(); }} maxWidth="700px"><ModalBody>
    <p>Formato Irminsul Atlas JSON v1 · perfil {activeProfile?.name}. A importação adiciona registros, sem substituir o histórico existente. IDs já presentes são ignorados.</p>
    <label>Arquivo JSON<input type="file" accept=".json,application/json" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (!file) return; setPreview(null); if (file.size > 20_000_000) { setError('Arquivo excede 20 MB.'); return; } void file.text().then(value => setText(value)).catch(cause => setError(String(cause))); }} /></label>
    <label>Ou cole o conteúdo<textarea rows={8} value={text} disabled={busy} onChange={event => { setText(event.target.value); setPreview(null); }} style={{ width: '100%' }} /></label>
    {error && <p role="alert" className="ui-error">{error}</p>}{done && <p role="status">{done}</p>}
    {preview && <p role="status">Prévia: {preview.entries.length} novos registros; {preview.skipped} já presentes. A ordem do arquivo será preservada.</p>}
  </ModalBody><ModalFooter><Button variant="secondary" disabled={busy} onClick={onClose}>Fechar</Button><Button disabled={busy || !text.trim()} onClick={() => void analyze()}>Analisar</Button><Button disabled={busy || !preview?.entries.length} onClick={() => void apply()}>Confirmar importação</Button></ModalFooter></Modal>;
}
