import { useEffect, useState } from 'react';
import { listCustomArt, type CustomArt } from '../infrastructure/providers/customArtRepository';
import { cropStyle } from '../lib/artCrop';
export function ScreenArt({ route }: { route: string }) {
  const [art, setArt] = useState<CustomArt | undefined>();
  useEffect(() => { let alive = true; const load = () => { void listCustomArt().then(items => { if (alive) setArt(items.find(item => !item.characterId && item.context === route)); }).catch(cause => console.warn('Fundo personalizado indisponível', cause)); }; load(); window.addEventListener('wishlog-art-changed', load); return () => { alive = false; window.removeEventListener('wishlog-art-changed', load); }; }, [route]);
  return art ? <img key={art.id} className="screen-custom-art" src={art.dataUri} alt="" style={cropStyle({ ...art, zoom: art.zoom ?? 1 })} onError={event => { event.currentTarget.style.display = 'none'; }} /> : null;
}
