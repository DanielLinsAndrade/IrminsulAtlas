import type { TravelerGender } from '../profiles/types';

/** Marcadores oficiais podem aparecer isolados ou em qualquer ordem, inclusive no meio de palavras. */
export function resolveTravelerText(text: string, traveler?: TravelerGender | null): string {
  if (!/\{[MF]#/.test(text)) return text;
  const selected = traveler === 'lumine' ? 'F' : 'M';
  return text.replace(/^#/, '').replace(/\{([MF])#([^}]*)\}/g, (_, gender: string, content: string) => gender === selected ? content : '');
}
