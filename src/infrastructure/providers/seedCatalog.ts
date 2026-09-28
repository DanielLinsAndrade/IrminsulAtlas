import type {
  ArtifactSetData,
  CharacterData,
  MaterialData,
  WeaponData,
} from '../../domain/catalog';

export const SEED_CHARACTERS: CharacterData[] = [
  {
    id: 'character_raiden_shogun',
    gameKey: 'RaidenShogun',
    namePtBr: 'Shogun Raiden',
    rarity: 5,
    element: 'electro',
    weaponType: 'polearm',
    releaseVersionId: '2.1',
    sourceProvider: 'hoyowiki',
    sourceEntryId: '10000052',
    iconUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/character_icon/UI_AvatarIcon_Shougun.png',
    splashUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/character_image/UI_AvatarIcon_Shougun_Costume_Default.png',
  },
  {
    id: 'character_amber',
    gameKey: 'Amber',
    namePtBr: 'Amber',
    rarity: 4,
    element: 'pyro',
    weaponType: 'bow',
    releaseVersionId: '1.0',
    sourceProvider: 'hoyowiki',
    sourceEntryId: '10000021',
    iconUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/character_icon/UI_AvatarIcon_Ambor.png',
    splashUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/character_image/UI_AvatarIcon_Ambor_Costume_Default.png',
  },
];

export const SEED_WEAPONS: WeaponData[] = [
  {
    id: 'weapon_engulfing_lightning',
    gameKey: 'EngulfingLightning',
    namePtBr: 'Luz do Cortador de Grama',
    rarity: 5,
    weaponType: 'polearm',
    releaseVersionId: '2.1',
    sourceProvider: 'hoyowiki',
    sourceEntryId: '13509',
    iconUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/equip/UI_EquipIcon_Pole_Narukami.png',
  },
  {
    id: 'weapon_dull_blade',
    gameKey: 'DullBlade',
    namePtBr: 'Lâmina Sem Fio',
    rarity: 1,
    weaponType: 'sword',
    releaseVersionId: '1.0',
    sourceProvider: 'hoyowiki',
    sourceEntryId: '11101',
    iconUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/equip/UI_EquipIcon_Sword_Blunt.png',
  },
];

export const SEED_MATERIALS: MaterialData[] = [
  {
    id: 'material_intertwined_fate',
    gameKey: 'IntertwinedFate',
    namePtBr: 'Destino Entrelaçado',
    category: 'currency',
    rarity: 5,
    region: null,
    sourceProvider: 'hoyowiki',
    sourceEntryId: '223',
    iconUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/equip/UI_ItemIcon_223.png',
  },
  {
    id: 'material_primogem',
    gameKey: 'Primogem',
    namePtBr: 'Primogema',
    category: 'currency',
    rarity: 5,
    region: null,
    sourceProvider: 'hoyowiki',
    sourceEntryId: '201',
    iconUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/equip/UI_ItemIcon_201.png',
  },
  {
    id: 'material_vajrada_amethyst_chunk',
    gameKey: 'VajradaAmethystChunk',
    namePtBr: 'Pedaço de Ametista Vajrada',
    category: 'character_ascension',
    rarity: 4,
    region: 'Inazuma',
    sourceProvider: 'hoyowiki',
    sourceEntryId: '104143',
    iconUrl: 'https://upload-os-bbs.hoyolab.com/game_record/genshin/equip/UI_ItemIcon_104143.png',
  },
];

import defaultCatalog from '../importers/datasets/defaultCatalog.json';

export const SEED_ARTIFACT_SETS: ArtifactSetData[] = (defaultCatalog.artifactSets || []) as ArtifactSetData[];

