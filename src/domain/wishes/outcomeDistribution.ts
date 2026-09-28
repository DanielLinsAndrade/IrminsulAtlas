import type { BannerType, WishEntry } from './types';

export function outcomeDistribution(banner: BannerType, wishes: WishEntry[]) {
  const five = wishes.filter(w => w.rarity === 5 && w.bannerType === banner);
  if (banner === 'character') return { title: 'Decisões de 50/50', labels: ['Vitórias', 'Derrotas'], values: [five.filter(w => w.isFeatured && w.wonPityRate).length, five.filter(w => !w.isFeatured).length], colors: ['#69d5b0','#ee7e8d'], helper: 'Garantidos não entram na taxa.' };
  if (banner === 'weapon') return { title: 'Resultados promocionais', labels: ['Promocionais','Não promocionais'], values: [five.filter(w => w.isFeatured).length,five.filter(w => !w.isFeatured).length], colors: ['#e9bd6b','#9981cb'], helper: 'Promocional não significa arma escolhida no Caminho Divino.' };
  if (banner === 'standard') return { title: 'Personagens e armas', labels: ['Personagens','Armas'], values: [five.filter(w => w.itemType === 'character').length,five.filter(w => w.itemType === 'weapon').length], colors: ['#78cbeb','#7286e4'], helper: 'Distribuição dos resultados 5★ registrados.' };
  return { title: 'Destinos registrados', labels: ['Escolhidos','Outros destinos'], values: [five.filter(w => w.isFeatured).length,five.filter(w => !w.isFeatured).length], colors: ['#c4a1f0','#79729c'], helper: 'Escolhidos inclui os resultados garantidos informados.' };
}
