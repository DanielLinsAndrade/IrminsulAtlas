import { useState, type ReactNode } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  const [error, setError] = useState('');
  return <span><a href={href} target="_blank" rel="noopener noreferrer" onClick={event => {
    if (!isTauri()) return;
    event.preventDefault(); setError('');
    void openUrl(href).catch(() => setError('Não foi possível abrir o link no navegador.'));
  }}>{children}</a>{error && <small role="alert">{error}</small>}</span>;
}
