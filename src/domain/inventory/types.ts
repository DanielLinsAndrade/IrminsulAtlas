import type { MaterialCategory, Rarity } from '../catalog';

/**
 * Recursos de desejos e moedas vinculados a um perfil específico.
 * Conforme SPEC.md (Seção 9) e ARCHITECTURE.md (Seções 5 e 6).
 */
export interface ProfileResources {
  profileId: string;
  primogems: number;
  intertwinedFates: number;
  acquaintFates: number;
  starglitter: number;
  stardust: number;
  genesisCrystals: number;
  updatedAt: string;
}

/**
 * Identificadores únicos dos materiais de catálogo que representam recursos de desejos.
 * Esses itens possuem `profile_resources` como ÚNICA fonte de verdade,
 * não devendo possuir registros independentes em `inventory_items`.
 */
export const WISH_RESOURCE_MATERIAL_IDS = [
  'material_primogem',
  'material_intertwined_fate',
  'material_acquaint_fate',
  'material_genesis_crystal',
  'material_masterless_starglitter',
  'material_masterless_stardust',
] as const;

export type WishResourceMaterialId = (typeof WISH_RESOURCE_MATERIAL_IDS)[number];

export function isWishResourceMaterialId(id: string): id is WishResourceMaterialId {
  return (WISH_RESOURCE_MATERIAL_IDS as readonly string[]).includes(id);
}

/**
 * Dados para atualização parcial de recursos de desejos do perfil.
 */
export interface UpdateProfileResourcesInput {
  primogems?: number;
  intertwinedFates?: number;
  acquaintFates?: number;
  starglitter?: number;
  stardust?: number;
  genesisCrystals?: number;
}

/**
 * Cálculos derivados de equivalência de tiros conforme SPEC.md (Seção 9).
 */
export interface WishEquivalences {
  // Quantidades brutas
  directIntertwined: number;
  directAcquaint: number;
  rawPrimogems: number;
  rawGenesisCrystals: number;
  rawStarglitter: number;
  rawStardust: number;

  // Conversões e regras oficiais
  pullsFromPrimogems: number; // Primogemas / 160
  remainderPrimogems: number; // Primogemas % 160

  // Cristais Gênesis: convertem 1:1 para Primogemas (não diretamente para desejos)
  crystalsToPrimogems: number; // 1:1 com Primogemas
  totalPrimogemsWithCrystals: number; // Primogemas + Cristais Gênesis
  pullsFromGenesisCrystals: number; // Equivalência em tiros após conversão 1:1 para Primogemas
  pullsFromPrimogemsAndCrystals: number; // (Primogemas + Cristais) / 160
  remainderPrimogemsWithCrystals: number; // (Primogemas + Cristais) % 160

  // Brilho Estelar: 5 Brilhos = 1 Destino
  pullsFromStarglitter: number; // Starglitter / 5
  remainderStarglitter: number; // Starglitter % 5

  // Poeira Estelar: 75 Poeiras = 1 Destino com limite de compra por reset mensal da loja (máx 5/mês)
  stardustPullsMonthlyLimit: number; // min(5, stardust / 75)
  maxMonthlyStardustPulls: number; // 5
  rawPullsFromStardust: number; // Capacidade teórica bruta total de poeira (stardust / 75)
  pullsFromStardust: number; // Potencial real no reset mensal da loja (respeitando o teto de 5)
  remainderStardust: number;

  // Totais combinados para tomada de decisão (Poeira Estelar NUNCA entra como tiros imediatos ilimitados)
  totalPromotionalPulls: number; // Destinos Entrelaçados + Tiros de Primogemas/Cristais (160:1)
  totalPromotionalPullsWithStarglitter: number; // totalPromotionalPulls + Tiros de Brilho Estelar (5:1)
  totalStandardPulls: number; // Destinos Familiares
  totalStandardPullsMax: number; // Destinos Familiares + Tiros de Primogemas/Cristais + Tiros de Brilho Estelar
}

/**
 * Registro de item no inventário de evolução do perfil.
 * Conforme SPEC.md (Seção 15) e ARCHITECTURE.md (Seção 6).
 */
export interface InventoryItem {
  profileId: string;
  materialId: string;
  quantity: number;
  updatedAt: string;
}

/**
 * Item de inventário enriquecido com os metadados do catálogo de materiais.
 */
export interface InventoryItemWithDetails {
  materialId: string;
  gameKey: string;
  namePtBr: string;
  category: MaterialCategory;
  rarity: Rarity | null;
  region: string | null;
  iconUrl: string | null;
  quantity: number;
  updatedAt: string;
}
