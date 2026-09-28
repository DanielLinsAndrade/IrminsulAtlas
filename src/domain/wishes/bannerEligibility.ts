import catalog from '../../infrastructure/importers/datasets/defaultCatalog.json';
import acquisition from './weaponAcquisition.json';
import type { CreateWishInput } from './types';
import { CHRONICLED_POOLS } from './chronicledPools';
import { RECENT_WISH_WEAPONS } from './recentWishWeapons';

const permanentCharacters: Record<string,string> = { diluc:'1.0',jean:'1.0',mona:'1.0',qiqi:'1.0',keqing:'1.0',tighnari:'3.1',dehya:'3.6',yumemizukimizuki:'5.5' };
const permanentFiveWeapons = new Set(['aquilafavonia','skywardblade','wolfsgravestone','skywardpride','primordialjadewingedspear','skywardspine','lostprayertothesacredwinds','skywardatlas','amosbow','skywardharp']);
const permanentFourWeapons = new Set(['favoniussword','sacrificialsword','theflute','lionsroar','favoniusgreatsword','sacrificialgreatsword','thebell','rainslasher','favoniuslance','dragonsbane','favoniuscodex','sacrificialfragments','eyeofperception','thewidsith','favoniuswarbow','sacrificialbow','thestringless','rust']);
const atLeast = (version: string | null | undefined, minimum: string) => !version || version.localeCompare(minimum, undefined, { numeric: true }) >= 0;
export function bannerEligibilityError(input: Pick<CreateWishInput,'bannerType'|'itemType'|'itemId'|'rarity'|'gameVersionId'>): string | null {
  const item = (input.itemType === 'character' ? catalog.characters : catalog.weapons).find(i => i.id === input.itemId);
  if (!item) return 'Selecione um item do catálogo local.';
  if (item.rarity !== input.rarity) return 'Raridade incompatível com o catálogo local.';
  if (item.releaseVersionId && !atLeast(input.gameVersionId, item.releaseVersionId)) return 'O item ainda não existia na versão selecionada.';
  const key = item.gameKey.toLowerCase().replace(/[^a-z0-9]/g,'');
  const invalid = 'Este item não pode ser obtido neste tipo de banner.';
  if (input.bannerType === 'chronicled') {
    const pool = CHRONICLED_POOLS[input.gameVersionId ?? ''];
    if (!pool) return 'Selecione uma edição do Crônico com pool histórico verificado (4.5, 5.3, 5.6, 6.0, 6.4 ou 6.5). Edições não configuradas não são presumidas.';
    if (input.itemType === 'character') return pool.characters.includes(key) ? null : 'Personagem ausente do pool desta edição do Crônico.';
    if (input.rarity === 5) return pool.weapons5.includes(key) ? null : 'Arma ausente do pool desta edição do Crônico.';
    if (input.rarity === 4) return permanentFourWeapons.has(key) || pool.extraWeapons4.includes(key) ? null : 'Arma ausente do pool desta edição do Crônico.';
  }
  if (input.itemType === 'character') {
    if (['aether','lumine','aloy'].includes(key) || input.rarity < 4) return invalid;
    if (input.bannerType === 'weapon' && input.rarity === 5) return invalid;
    if ((input.bannerType === 'character' || input.bannerType === 'weapon') && ['amber','kaeya','lisa'].includes(key)) return invalid;
    if (input.bannerType === 'standard' && input.rarity === 5 && (!permanentCharacters[key] || !atLeast(input.gameVersionId, permanentCharacters[key]))) return invalid;
    if ((input.bannerType === 'standard' || input.bannerType === 'weapon') && input.rarity === 4 && input.gameVersionId === item.releaseVersionId && item.releaseVersionId !== '1.0') return 'Este personagem só entra no pool permanente na versão seguinte ao lançamento.';
  } else {
    if (input.rarity < 3 || (input.bannerType === 'character' && input.rarity === 5)) return invalid;
    const source = (acquisition.weapons as Record<string,{location:string}>)[key];
    const recent = RECENT_WISH_WEAPONS[key];
    if (recent && !atLeast(input.gameVersionId,recent.since)) return 'Esta arma ainda não estava disponível em orações nesta versão.';
    if (source && !/gacha|wish/i.test(source.location)) return invalid;
    if (input.rarity === 3 && !source) return 'Origem desta arma ainda não verificada para orações.';
    if (input.rarity === 4 && !source && !recent && !permanentFourWeapons.has(key)) return 'Pool desta arma ainda não verificado. O catálogo de itens não implica disponibilidade em orações.';
    if ((input.bannerType === 'standard' || input.bannerType === 'character') && input.rarity === 4 && !permanentFourWeapons.has(key)) return invalid;
    if (input.bannerType === 'standard' && input.rarity === 5 && !permanentFiveWeapons.has(key)) return invalid;
  }
  return null;
}
export function assertBannerItem(input: Parameters<typeof bannerEligibilityError>[0]): void {
  const error = bannerEligibilityError(input);
  if (error) throw new Error(error);
}
