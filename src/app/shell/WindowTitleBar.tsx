import { useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { BrandMark } from '../../components/BrandMark';
import { PRODUCT } from '../../config/product';

export function WindowTitleBar() {
  const [error, setError] = useState('');
  if (!isTauri()) return null;
  async function action(operation: 'minimize' | 'toggleMaximize' | 'close' | 'startDragging') {
    try { await getCurrentWindow()[operation](); setError(''); }
    catch (cause) { setError(`Não foi possível controlar a janela: ${String(cause)}`); }
  }
  return <div className="window-titlebar">
    <div className="window-drag-region" onMouseDown={event => { if (event.button === 0 && event.detail === 1) void action('startDragging'); }} onDoubleClick={() => void action('toggleMaximize')}><BrandMark size={20} decorative /><span>{PRODUCT.name}</span>{error && <small role="alert">{error}</small>}</div>
    <button aria-label="Minimizar janela" onClick={() => void action('minimize')}><svg viewBox="0 0 16 16"><path d="M3 8h10"/></svg></button>
    <button aria-label="Maximizar ou restaurar janela" onClick={() => void action('toggleMaximize')}><svg viewBox="0 0 16 16"><rect x="3.5" y="3.5" width="9" height="9"/></svg></button>
    <button className="window-close" aria-label="Fechar janela" onClick={() => void action('close')}><svg viewBox="0 0 16 16"><path d="m4 4 8 8m0-8-8 8"/></svg></button>
  </div>;
}
