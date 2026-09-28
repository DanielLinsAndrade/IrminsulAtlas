import type { ProfileResources, WishEquivalences } from './types';
import { INVENTORY_LIMITS } from '../constants/limits';

export const PRIMOGEMS_PER_WISH = 160;
export const STARGLITTER_PER_WISH = 5;
export const STARDUST_PER_WISH = 75;
export const MAX_MONTHLY_STARDUST_PULLS_PER_TYPE = 5; // Limite oficial por reset mensal da loja da Paimon

/**
 * Valida se uma quantidade de recurso é um número inteiro não-negativo válido e seguro.
 * Lança erro descritivo caso a validação falhe.
 */
export function validateResourceQuantity(value: unknown, fieldName = 'quantidade'): number {
  if (value === null || value === undefined || value === '') {
    throw new Error(`O campo "${fieldName}" não pode ser vazio.`);
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    throw new Error(`O campo "${fieldName}" deve ser um número válido.`);
  }

  if (!Number.isInteger(num)) {
    throw new Error(`O campo "${fieldName}" deve ser um número inteiro.`);
  }

  if (num < INVENTORY_LIMITS.QUANTITY.MIN) {
    throw new Error(`O campo "${fieldName}" não pode ser negativo.`);
  }

  if (!Number.isSafeInteger(num) || num > INVENTORY_LIMITS.QUANTITY.MAX) {
    throw new Error(`O campo "${fieldName}" excede a quantidade segura permitida.`);
  }

  return num;
}

/**
 * Cria uma estrutura de recursos zerada com data atual para um perfil.
 */
export function createDefaultResources(profileId: string): ProfileResources {
  return {
    profileId,
    primogems: 0,
    intertwinedFates: 0,
    acquaintFates: 0,
    starglitter: 0,
    stardust: 0,
    genesisCrystals: 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calcula as equivalências exatas de tiros promocionais e padrão a partir dos recursos de desejos.
 * Conforme regras oficiais do Genshin Impact e SPEC.md (Seção 9):
 * 1. 160 Primogemas = 1 tiro;
 * 2. Cristais Gênesis convertem 1:1 para Primogemas (não convertem diretamente para desejos);
 * 3. 5 Brilhos Estelares sem Dono = 1 Destino (troca ilimitada na loja);
 * 4. 75 Poeiras Estelares sem Dono = 1 Destino, respeitando o teto de compra por reset mensal da loja (máx 5/mês);
 *    Poeira Estelar não é incluída como valor ilimitado nos tiros promocionais imediatamente disponíveis.
 */
export function calculateWishEquivalences(resources: Partial<ProfileResources> | null | undefined): WishEquivalences {
  const primogems = Math.max(0, Math.floor(resources?.primogems ?? 0));
  const intertwined = Math.max(0, Math.floor(resources?.intertwinedFates ?? 0));
  const acquaint = Math.max(0, Math.floor(resources?.acquaintFates ?? 0));
  const starglitter = Math.max(0, Math.floor(resources?.starglitter ?? 0));
  const stardust = Math.max(0, Math.floor(resources?.stardust ?? 0));
  const genesis = Math.max(0, Math.floor(resources?.genesisCrystals ?? 0));

  // Primogemas puras (160 = 1 tiro)
  const pullsFromPrimogems = Math.floor(primogems / PRIMOGEMS_PER_WISH);
  const remainderPrimogems = primogems % PRIMOGEMS_PER_WISH;

  // Cristais Gênesis: convertem 1:1 para Primogemas (não diretamente para desejos)
  const crystalsToPrimogems = genesis;
  const totalPrimogemsWithCrystals = primogems + crystalsToPrimogems;
  const pullsFromGenesisCrystals = Math.floor(genesis / PRIMOGEMS_PER_WISH);
  const pullsFromPrimogemsAndCrystals = Math.floor(totalPrimogemsWithCrystals / PRIMOGEMS_PER_WISH);
  const remainderPrimogemsWithCrystals = totalPrimogemsWithCrystals % PRIMOGEMS_PER_WISH;

  // Brilho Estelar sem Dono (5 = 1 Destino)
  const pullsFromStarglitter = Math.floor(starglitter / STARGLITTER_PER_WISH);
  const remainderStarglitter = starglitter % STARGLITTER_PER_WISH;

  // Poeira Estelar sem Dono (75 = 1 Destino com limite de compra por reset mensal da loja de 5/mês)
  const rawPullsFromStardust = Math.floor(stardust / STARDUST_PER_WISH);
  const stardustPullsMonthlyLimit = Math.min(MAX_MONTHLY_STARDUST_PULLS_PER_TYPE, rawPullsFromStardust);
  const remainderStardust = stardust % STARDUST_PER_WISH;

  // Totais combinados
  // Tiros promocionais prontos: Destinos diretos + Primogemas (incluindo Cristais convertidos 1:1)
  const totalPromotionalPulls = intertwined + pullsFromPrimogemsAndCrystals;
  // Tiros promocionais com Brilho Estelar
  const totalPromotionalPullsWithStarglitter = totalPromotionalPulls + pullsFromStarglitter;

  // Banner padrão: Destinos Familiares diretos
  const totalStandardPulls = acquaint;
  // Potencial padrão máximo: Destinos Familiares + Tiros convertíveis de gemas/cristais + Brilho Estelar
  const totalStandardPullsMax = acquaint + pullsFromPrimogemsAndCrystals + pullsFromStarglitter;

  return {
    directIntertwined: intertwined,
    directAcquaint: acquaint,
    rawPrimogems: primogems,
    rawGenesisCrystals: genesis,
    rawStarglitter: starglitter,
    rawStardust: stardust,

    pullsFromPrimogems,
    remainderPrimogems,
    crystalsToPrimogems,
    pullsFromGenesisCrystals,
    totalPrimogemsWithCrystals,
    pullsFromPrimogemsAndCrystals,
    remainderPrimogemsWithCrystals,
    pullsFromStarglitter,
    remainderStarglitter,

    stardustPullsMonthlyLimit,
    maxMonthlyStardustPulls: MAX_MONTHLY_STARDUST_PULLS_PER_TYPE,
    rawPullsFromStardust,
    pullsFromStardust: stardustPullsMonthlyLimit,
    remainderStardust,

    totalPromotionalPulls,
    totalPromotionalPullsWithStarglitter,
    totalStandardPulls,
    totalStandardPullsMax,
  };
}
