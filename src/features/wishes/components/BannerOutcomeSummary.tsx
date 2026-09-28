import type { BannerType, WishEntry } from '../../../domain/wishes/types';
import { standardPrediction } from '../../../domain/wishes/presentation';
import { WEAPON_FATE_LABELS, WEAPON_PATH_LABELS } from '../../../domain/wishes/weaponFate';
import './BannerOutcomeSummary.css';
export function BannerOutcomeSummary({ banner, wishes }: { banner: BannerType; wishes: WishEntry[] }) {
  const five = wishes.filter(w => w.bannerType === banner && w.rarity === 5);
  if (banner === 'character') return null;
  if (banner === 'standard') {
    const characters = five.filter(w => w.itemType === 'character').length;
    const estimate = standardPrediction(wishes);
    return <section className="banner-outcome"><h3>Distribuição de 5★</h3><dl><div><dt>Personagens</dt><dd>{characters} <small>({five.length ? Math.round(characters / five.length * 100) : 0}%)</small></dd></div><div><dt>Armas</dt><dd>{five.length - characters} <small>({five.length ? Math.round((five.length - characters) / five.length * 100) : 0}%)</small></dd></div></dl><div className="banner-prediction"><span>Próximo tipo estimado</span><strong>{estimate ? estimate === 'character' ? 'Personagem' : 'Arma' : 'Histórico insuficiente'}</strong></div><p className="banner-helper">Estimativa baseada no histórico recente; não representa garantia oficial.</p></section>;
  }
  if (banner === 'chronicled') return <section className="banner-outcome"><h3>Destino do Banner Crônico</h3><dl><div><dt>Destinos escolhidos</dt><dd>{five.filter(w => w.isFeatured && w.wonPityRate).length}</dd></div><div><dt>Outros destinos</dt><dd>{five.filter(w => !w.isFeatured).length}</dd></div><div><dt>Garantidos</dt><dd>{five.filter(w => w.isFeatured && !w.wonPityRate).length}</dd></div></dl><p className="banner-helper">Estado registrado por edição. Pontos do Destino não passam para a próxima edição.</p></section>;
  return <section className="banner-outcome"><h3>Resultado do Caminho Divino</h3><dl>{Object.entries(WEAPON_PATH_LABELS).map(([state,label]) => <div key={state}><dt>{label}</dt><dd>{five.filter(w => w.weaponPathResult === state).length}</dd></div>)}<div><dt>Não informado</dt><dd>{five.filter(w => !w.weaponPathResult).length}</dd></div></dl><div className="banner-outcome__secondary"><dl><div><dt>Promocionais</dt><dd>{five.filter(w => w.isFeatured).length}</dd></div><div><dt>Não promocionais</dt><dd>{five.filter(w => !w.isFeatured).length}</dd></div></dl></div><details><summary>Pontos do Destino · estados registrados</summary><dl>{Object.entries(WEAPON_FATE_LABELS).map(([state,label]) => <div key={state}><dt>{label}</dt><dd>{five.filter(w => w.weaponFateState === state).length}</dd></div>)}</dl></details><p className="banner-helper">O Caminho considera a arma escolhida, não apenas ser promocional. Pontos não se acumulam entre edições.</p></section>;
}
