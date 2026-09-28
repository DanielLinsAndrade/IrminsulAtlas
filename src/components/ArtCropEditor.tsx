import { useState } from 'react';
import { Button, Modal, ModalBody } from './index';
import './ArtCropEditor.css';
import { cropStyle, type ArtCrop } from '../lib/artCrop';
export function ArtCropEditor({ src, initial, onApply, onClose, aspectRatio = 1.5, fit = 'cover' }: { src: string; initial: ArtCrop; onApply: (crop: ArtCrop) => Promise<void>; onClose: () => void; aspectRatio?: number; fit?: 'contain' | 'cover' }) {
  const [crop, setCrop] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <Modal isOpen title="Enquadrar arte" onClose={() => { if (!busy) onClose(); }} footer={<><Button disabled={busy} variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={busy} onClick={async () => { setBusy(true); try { await onApply(crop); onClose(); } catch (cause) { setError(String(cause)); } finally { setBusy(false); } }}>Aplicar</Button></>}>
    <ModalBody className="art-crop-body"><p className="art-crop-hint">Ajuste a posição e a aproximação. A prévia acompanha cada movimento.</p>
    <div className="art-crop-preview" style={{ aspectRatio, width: `min(100%, ${360 * aspectRatio}px)`, flexShrink: 0, alignSelf: 'center' }}><img src={src} alt="Prévia do enquadramento" style={{ width: '100%', height: '100%', ...cropStyle(crop), objectFit: fit }} /></div>
    {(['focusX','focusY','zoom'] as const).map(field => <label key={field} style={{ display: 'block', marginTop: 14 }}>{field === 'focusX' ? 'Foco horizontal' : field === 'focusY' ? 'Foco vertical' : 'Zoom'}: {crop[field]}<input style={{ width: '100%' }} aria-label={field === 'focusX' ? 'Foco horizontal' : field === 'focusY' ? 'Foco vertical' : 'Zoom'} type="range" min={field === 'zoom' ? 1 : 0} max={field === 'zoom' ? 4 : 100} step={field === 'zoom' ? .05 : 1} value={crop[field]} onChange={e => setCrop({ ...crop, [field]: Number(e.target.value) })} /></label>)}
    <Button disabled={busy} variant="secondary" onClick={() => setCrop({ focusX: 50, focusY: 50, zoom: 1 })}>Recentralizar</Button>{error && <p role="alert">{error}</p>}</ModalBody>
  </Modal>;
}
