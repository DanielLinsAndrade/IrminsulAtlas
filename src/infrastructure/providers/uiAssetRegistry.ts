import type { Element, WeaponType } from '../../domain/catalog';
import type { ArtifactSlotKey } from '../../domain/builds/types';
import type { TravelerGender } from '../../domain/profiles/types';

/**
 * Registry de assets estáticos locais do Irminsul Atlas.
 * Todos os assets mapeados encontram-se servidos em /icons/.
 */
export const UI_ASSETS = {
  // Elementos do jogo (SVGs oficiais)
  elements: {
    anemo: '/icons/Element_Anemo.svg',
    cryo: '/icons/Element_Cryo.svg',
    dendro: '/icons/Element_Dendro.svg',
    electro: '/icons/Element_Electro.svg',
    geo: '/icons/Element_Geo.svg',
    hydro: '/icons/Element_Hydro.svg',
    pyro: '/icons/Element_Pyro.svg',
  } as Record<Element, string>,

  // Tipos de arma (PNGs oficiais)
  weapons: {
    sword: '/icons/Icon_Sword.png',
    claymore: '/icons/Icon_Claymore.png',
    polearm: '/icons/Icon_Polearm.png',
    bow: '/icons/Icon_Bow.png',
    catalyst: '/icons/Icon_Catalyst.png',
  } as Record<WeaponType, string>,

  // Slots de artefatos (PNGs oficiais)
  artifactSlots: {
    flower: '/icons/Icon_Flower_of_Life.png',
    plume: '/icons/Icon_Plume_of_Death.png',
    sands: '/icons/Icon_Sands_of_Eon.png',
    goblet: '/icons/Icon_Goblet_of_Eonothem.png',
    circlet: '/icons/Icon_Circlet_of_Logos.png',
  } as Record<ArtifactSlotKey, string>,

  // Ícones da barra de navegação principal (Sidebar)
  sidebar: {
    home: '/icons/Icon_Paimon_Menu.png',
    wishes: '/icons/Icon_Wish.png',
    banners: '/icons/Icon_Banners.png',
    characters: {
      default: '/icons/Icon_Character.png',
      aether: '/icons/Icon_Character_Aether.png',
      lumine: '/icons/Icon_Character_Lumine.png',
    },
    weapons: '/icons/Icon_Inventory_Weapons.png',
    inventory: '/icons/Icon_Inventory_Materials.png',
    builds: '/icons/Icon_Builds.png',
    farm: '/icons/Icon_Inventory_Artifacts.png',
    stats: '/icons/Icon_Estatisticas.png',
    achievements: '/icons/Icon_Achievements.png',
  },

  // Itens, moedas e contadores de recursos
  items: {
    primogem: '/icons/Item_Primogem.webp',
    intertwinedFate: '/icons/Item_Destino_Entrelacado.webp',
    intertwinedFateAlt: '/icons/Item_Destino_Entrelaçado.webp',
    acquaintFate: '/icons/Item_Acquaint_Fate.webp',
    genesisCrystal: '/icons/Item_Cristal_Genesis.webp',
    genesisCrystalAlt: '/icons/Item_Cristal_G_3Fnesis.webp',
    starglitter: '/icons/Item_Brilho_Estelar_Abandonado.png',
    starglitterAlt: '/icons/Item_Brilho_Estrelar_Abandonado.png',
    stardust: '/icons/brilhos_de_tiro.png',
    wishSparkles: '/icons/brilhos_de_tiro.png',
    friendshipXp: '/icons/xp de amizade.png',
    mora: '/icons/Item_Mora.webp',
    heroWit: '/icons/Item_Hero_Wit.webp',
    condensedResin: '/icons/Item_Resina_Condensada.webp',
    fragileResin: '/icons/Item_Resina_Fragil.webp',
    mysticOre: '/icons/Item_Mystic_Enhancement_Ore.png',
    fineOre: '/icons/Item_Fine_Enhancement_Ore.png',
    stellaT4: '/icons/stella t4.webp',
    stellaT5: '/icons/stella t5.webp',
  },

  // Visões Canônicas por Região e Elemento
  visions: {
    Mondstadt: {
      anemo: '/icons/visions/Vision_Mondstadt_Anemo.png',
      cryo: '/icons/visions/Vision_Mondstadt_Cryo.png',
      electro: '/icons/visions/Vision_Mondstadt_Electro.png',
      geo: '/icons/visions/Vision_Mondstadt_Geo.png',
      hydro: '/icons/visions/Vision_Mondstadt_Hydro.png',
      pyro: '/icons/visions/Vision_Mondstadt_Pyro.png',
      dendro: '/icons/visions/Vision_Mondstadt_Anemo.png',
    },
    Liyue: {
      anemo: '/icons/visions/Vision_Liyue_Anemo.png',
      cryo: '/icons/visions/Vision_Liyue_Cryo.png',
      dendro: '/icons/visions/Vision_Liyue_Dendro.png',
      electro: '/icons/visions/Vision_Liyue_Electro.png',
      geo: '/icons/visions/Vision_Liyue_Geo.png',
      hydro: '/icons/visions/Vision_Liyue_Hydro.png',
      pyro: '/icons/visions/Vision_Liyue_Pyro.png',
    },
    Inazuma: {
      anemo: '/icons/visions/Vision_Inazuma_Anemo.png',
      cryo: '/icons/visions/Vision_Inazuma_Cryo.png',
      dendro: '/icons/visions/Vision_Inazuma_Dendro.png',
      electro: '/icons/visions/Vision_Inazuma_Electro.png',
      geo: '/icons/visions/Vision_Inazuma_Geo.png',
      hydro: '/icons/visions/Vision_Inazuma_Hydro.png',
      pyro: '/icons/visions/Vision_Inazuma_Pyro.png',
    },
    Sumeru: {
      anemo: '/icons/visions/Vision_Sumeru_Anemo.png',
      cryo: '/icons/visions/Vision_Sumeru_Cryo.png',
      dendro: '/icons/visions/Vision_Sumeru_Dendro.png',
      electro: '/icons/visions/Vision_Sumeru_Electro.png',
      geo: '/icons/visions/Vision_Liyue_Geo.png',
      hydro: '/icons/visions/Vision_Sumeru_Hydro.png',
      pyro: '/icons/visions/Vision_Sumeru_Pyro.png',
    },
    Fontaine: {
      anemo: '/icons/visions/Vision_Fontaine_Anemo_Ousia.png',
      anemo_ousia: '/icons/visions/Vision_Fontaine_Anemo_Ousia.png',
      cryo: '/icons/visions/Vision_Fontaine_Cryo_Ousia.png',
      cryo_ousia: '/icons/visions/Vision_Fontaine_Cryo_Ousia.png',
      cryo_pneuma: '/icons/visions/Vision_Fontaine_Cryo_Pneuma.png',
      dendro: '/icons/visions/Vision_Fontaine_Dendro_Pneuma.png',
      dendro_pneuma: '/icons/visions/Vision_Fontaine_Dendro_Pneuma.png',
      electro: '/icons/visions/Vision_Fontaine_Electro_Ousia.png',
      electro_ousia: '/icons/visions/Vision_Fontaine_Electro_Ousia.png',
      geo: '/icons/visions/Vision_Fontaine_Geo_Ousia.png',
      geo_ousia: '/icons/visions/Vision_Fontaine_Geo_Ousia.png',
      hydro: '/icons/visions/Vision_Fontaine_Hydro_Ousia.png',
      hydro_ousia: '/icons/visions/Vision_Fontaine_Hydro_Ousia.png',
      hydro_pneuma: '/icons/visions/Vision_Fontaine_Hydro_Pneuma.png',
      pyro: '/icons/visions/Vision_Fontaine_Pyro_Ousia.png',
      pyro_ousia: '/icons/visions/Vision_Fontaine_Pyro_Ousia.png',
      pyro_pneuma: '/icons/visions/Vision_Fontaine_Pyro_Pneuma.png',
    },
    Natlan: {
      anemo: '/icons/visions/Vision_Natlan_Anemo.png',
      cryo: '/icons/visions/Vision_Natlan_Cryo.png',
      dendro: '/icons/visions/Vision_Natlan_Dendro.png',
      electro: '/icons/visions/Vision_Natlan_Electro.png',
      geo: '/icons/visions/Vision_Natlan_Geo.png',
      hydro: '/icons/visions/Vision_Natlan_Hydro.png',
      pyro: '/icons/visions/Vision_Natlan_Pyro.png',
    },
    Snezhnaya: {
      anemo: '/icons/visions/Vision_Mondstadt_Anemo.png',
      cryo: '/icons/visions/Vision_Stellar_Cryo.png',
      dendro: '/icons/visions/Vision_Sumeru_Dendro.png',
      electro: '/icons/visions/Vision_Snezhnaya_Electro.png',
      geo: '/icons/visions/Vision_Liyue_Geo.png',
      hydro: '/icons/visions/Vision_Snezhnaya_Hydro.png',
      pyro: '/icons/visions/Vision_Snezhnaya_Pyro.png',
    },
    Traveler: {
      anemo: '/icons/visions/Vision_Traveler_Anemo.png',
      geo: '/icons/visions/Vision_Traveler_Geo.png',
      electro: '/icons/visions/Vision_Traveler_Electro.png',
      dendro: '/icons/visions/Vision_Traveler_Dendro.png',
      hydro: '/icons/visions/Vision_Traveler_Hydro.png',
      pyro: '/icons/visions/Vision_Traveler_Pyro.png',
      cryo: '/icons/visions/Vision_Traveler_Cryo.png',
      none: '/icons/visions/Vision_Traveler_None.png',
    },
    Special: {
      aloy: '/icons/visions/Vision_Aloy_Cryo.png',
      skirk: '/icons/visions/Vision_Skirk_Cryo.png',
      nicole: '/icons/visions/Vision_Nicole_Pyro.png',
      zibai: '/icons/visions/Vision_Zibai_Geo.png',
    },
  },
} as const;

/**
 * Retorna o ícone oficial do elemento.
 */
export function getElementIconUrl(element: Element): string {
  return UI_ASSETS.elements[element] || UI_ASSETS.elements.anemo;
}

/**
 * Retorna o ícone oficial do tipo de arma.
 */
export function getWeaponTypeIconUrl(weaponType: WeaponType): string {
  return UI_ASSETS.weapons[weaponType] || UI_ASSETS.weapons.sword;
}

/**
 * Retorna o ícone oficial do slot de artefato.
 */
export function getArtifactSlotIconUrl(slotKey: ArtifactSlotKey): string {
  return UI_ASSETS.artifactSlots[slotKey] || UI_ASSETS.artifactSlots.flower;
}

/**
 * Retorna o ícone de personagem para a Sidebar com base no gênero do Viajante do perfil ativo.
 */
export function getSidebarCharacterIconUrl(gender?: TravelerGender | string | null): string {
  if (gender === 'lumine') {
    return UI_ASSETS.sidebar.characters.lumine;
  }
  if (gender === 'aether') {
    return UI_ASSETS.sidebar.characters.aether;
  }
  return UI_ASSETS.sidebar.characters.aether;
}

/**
 * Retorna o ícone canônico da Visão correspondente à região, elemento e alinhamento do personagem.
 */
export function getCharacterVisionUrl(params: {
  element: Element;
  region?: string | null;
  characterId?: string;
  arkhe?: 'pneuma' | 'ousia' | null;
}): string {
  const { element, region, characterId, arkhe } = params;
  const idLower = (characterId || '').toLowerCase();

  // Casos Especiais por personagem
  if (idLower.includes('aloy')) {
    return UI_ASSETS.visions.Special.aloy;
  }
  if (idLower.includes('skirk')) {
    return UI_ASSETS.visions.Special.skirk;
  }
  if (idLower.includes('aether') || idLower.includes('lumine') || idLower.includes('traveler')) {
    return (
      UI_ASSETS.visions.Traveler[element as keyof typeof UI_ASSETS.visions.Traveler] ||
      UI_ASSETS.visions.Traveler.anemo
    );
  }

  // Normalização de Região
  const reg = (region || '').trim();
  const regLower = reg.toLowerCase();

  if (regLower === 'fontaine' || idLower.includes('furina') || idLower.includes('neuvillette') || idLower.includes('wriothesley') || idLower.includes('clorinde') || idLower.includes('navia')) {
    const isPneuma = arkhe === 'pneuma' || idLower.includes('lyney') || idLower.includes('freminet') || idLower.includes('charlotte') || idLower.includes('emilie');
    if (element === 'hydro') {
      return isPneuma ? UI_ASSETS.visions.Fontaine.hydro_pneuma : UI_ASSETS.visions.Fontaine.hydro_ousia;
    }
    if (element === 'cryo') {
      return isPneuma ? UI_ASSETS.visions.Fontaine.cryo_pneuma : UI_ASSETS.visions.Fontaine.cryo_ousia;
    }
    if (element === 'pyro') {
      return isPneuma ? UI_ASSETS.visions.Fontaine.pyro_pneuma : UI_ASSETS.visions.Fontaine.pyro_ousia;
    }
    if (element === 'dendro') {
      return UI_ASSETS.visions.Fontaine.dendro_pneuma;
    }
    if (element === 'electro') {
      return UI_ASSETS.visions.Fontaine.electro_ousia;
    }
    if (element === 'geo') {
      return UI_ASSETS.visions.Fontaine.geo_ousia;
    }
    if (element === 'anemo') {
      return UI_ASSETS.visions.Fontaine.anemo_ousia;
    }
    return UI_ASSETS.visions.Fontaine.hydro_ousia;
  }

  if (regLower === 'natlan' || idLower.includes('mualani') || idLower.includes('kinich') || idLower.includes('kachina') || idLower.includes('xilonen') || idLower.includes('chasca') || idLower.includes('citlali') || idLower.includes('mavuika') || idLower.includes('ororon')) {
    const natlanVision = UI_ASSETS.visions.Natlan[element];
    if (natlanVision) return natlanVision;
  }

  if (regLower === 'inazuma' || idLower.includes('raiden') || idLower.includes('ayaka') || idLower.includes('kazuha') || idLower.includes('yoimiya') || idLower.includes('itto') || idLower.includes('chiori')) {
    const inazumaVision = UI_ASSETS.visions.Inazuma[element];
    if (inazumaVision) return inazumaVision;
  }

  if (regLower === 'sumeru' || idLower.includes('nahida') || idLower.includes('alhaitham') || idLower.includes('wanderer') || idLower.includes('cyno') || idLower.includes('tighnari')) {
    const sumeruVision = UI_ASSETS.visions.Sumeru[element as keyof typeof UI_ASSETS.visions.Sumeru];
    if (sumeruVision) return sumeruVision;
  }

  if (regLower === 'liyue' || idLower.includes('zhongli') || idLower.includes('hutao') || idLower.includes('xiao') || idLower.includes('ganyu') || idLower.includes('yelan')) {
    const liyueVision = UI_ASSETS.visions.Liyue[element];
    if (liyueVision) return liyueVision;
  }

  if (regLower === 'snezhnaya' || idLower.includes('tartaglia') || idLower.includes('childe')) {
    const snezhnayaVision = UI_ASSETS.visions.Snezhnaya[element as keyof typeof UI_ASSETS.visions.Snezhnaya];
    if (snezhnayaVision) return snezhnayaVision;
  }

  // Padrão: Mondstadt
  const mondstadtVision = UI_ASSETS.visions.Mondstadt[element as keyof typeof UI_ASSETS.visions.Mondstadt];
  if (mondstadtVision) return mondstadtVision;

  // Fallback seguro: SVG oficial do elemento
  return getElementIconUrl(element);
}

/**
 * Retorna a URL do ícone de retrato local do personagem com fallback seguro.
 */
export function getCharacterPortraitUrl(characterId: string): string {
  return findBundledAsset(characterPortraits, characterId, /^(char_|character_)/);
}

/**
 * Retorna a splash art local do personagem, quando o pacote bundled possui uma.
 */
export function getCharacterSplashUrl(characterId: string): string {
  const full = characterSplashes.filter(path => /_splash_full\./.test(path));
  return findBundledAsset(full, characterId, /^(char_|character_)/, /_splash_full$/)
    || findBundledAsset(characterSplashes, characterId, /^(char_|character_)/, /_splash$/);
}

/**
 * Retorna a URL do ícone de arma local com fallback seguro.
 */
export function getWeaponIconUrl(weaponId: string): string {
  return findBundledAsset(weaponIcons, weaponId, /^(wpn_|weapon_)/);
}

const characterPortraits = Object.keys(import.meta.glob('/public/icons/characters/*.png'));
const characterSplashes = Object.keys(import.meta.glob('/public/icons/characters/splash/*.{png,jpg,webp}'));
const weaponIcons = Object.keys(import.meta.glob('/public/icons/weapons/*.png'));
const materialIcons = Object.keys(import.meta.glob('/public/icons/materials/*.png'));
const artifactIcons = Object.keys(import.meta.glob('/public/icons/artifacts/*.png'));

function findBundledAsset(paths: string[], id: string, prefix: RegExp, suffix?: RegExp): string {
  const normalize = (value: string) => {
    const key = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(prefix, '');
    return (suffix ? key.replace(suffix, '') : key).replace(/[^a-z0-9]/g, '');
  };
  const match = paths.find((path) => normalize(path.split('/').pop()!.replace(/\.(png|jpg|webp)$/, '')) === normalize(id));
  return match?.replace('/public', '') ?? '';
}

/**
 * Retorna a URL do ícone de conjunto de artefatos local com fallback seguro.
 */
export function getArtifactSetIconUrl(setId: string): string {
  return findBundledAsset(artifactIcons, setId, /^(artifact_)/);
}

/**
 * Retorna a URL do ícone de material/recurso local com fallback seguro.
 */
export function getMaterialIconUrl(materialId: string): string {
  return findBundledAsset(materialIcons, materialId, /^(material_|mat_)/);
}
