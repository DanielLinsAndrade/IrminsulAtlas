import {
  isWishResourceMaterialId,
  type InventoryItem,
  type ProfileResources,
  type UpdateProfileResourcesInput,
} from '../../domain/inventory';
import {
  createDefaultResources,
  validateResourceQuantity,
} from '../../domain/inventory/calculations';
import { getDatabase } from './client';
import { canonicalMaterialId, mergeInventoryAliases } from './materialIdentity';

interface ProfileResourcesRow {
  profile_id: string;
  primogems: number;
  intertwined_fates: number;
  acquaint_fates: number;
  starglitter: number;
  stardust: number;
  genesis_crystals: number;
  updated_at: string;
}

interface InventoryItemRow {
  profile_id: string;
  material_id: string;
  quantity: number;
  updated_at: string;
}

function mapResourcesRow(row: ProfileResourcesRow): ProfileResources {
  return {
    profileId: row.profile_id,
    primogems: row.primogems ?? 0,
    intertwinedFates: row.intertwined_fates ?? 0,
    acquaintFates: row.acquaint_fates ?? 0,
    starglitter: row.starglitter ?? 0,
    stardust: row.stardust ?? 0,
    genesisCrystals: row.genesis_crystals ?? 0,
    updatedAt: row.updated_at,
  };
}

function mapInventoryRow(row: InventoryItemRow): InventoryItem {
  return {
    profileId: row.profile_id,
    materialId: row.material_id,
    quantity: row.quantity ?? 0,
    updatedAt: row.updated_at,
  };
}

export interface IInventoryRepository {
  getResources(profileId: string): Promise<ProfileResources>;
  saveResources(profileId: string, input: UpdateProfileResourcesInput): Promise<ProfileResources>;
  getInventory(profileId: string): Promise<InventoryItem[]>;
  getInventoryItem(profileId: string, materialId: string): Promise<InventoryItem | null>;
  setInventoryItem(profileId: string, materialId: string, quantity: number): Promise<InventoryItem>;
  setInventoryBatch(profileId: string, items: Array<{ materialId: string; quantity: number }>): Promise<void>;
  deleteInventoryItem(profileId: string, materialId: string): Promise<void>;
  clearInventory(profileId: string): Promise<void>;
}

export class SqliteInventoryRepository implements IInventoryRepository {
  public async getResources(profileId: string): Promise<ProfileResources> {
    const db = await getDatabase();
    const rows = await db.select<ProfileResourcesRow[]>(
      'SELECT * FROM profile_resources WHERE profile_id = $1 LIMIT 1',
      [profileId]
    );

    if (!rows || rows.length === 0) {
      return createDefaultResources(profileId);
    }

    return mapResourcesRow(rows[0]);
  }

  public async saveResources(
    profileId: string,
    input: UpdateProfileResourcesInput
  ): Promise<ProfileResources> {
    const current = await this.getResources(profileId);

    const primogems =
      input.primogems !== undefined
        ? validateResourceQuantity(input.primogems, 'Primogemas')
        : current.primogems;

    const intertwined =
      input.intertwinedFates !== undefined
        ? validateResourceQuantity(input.intertwinedFates, 'Destinos Entrelaçados')
        : current.intertwinedFates;

    const acquaint =
      input.acquaintFates !== undefined
        ? validateResourceQuantity(input.acquaintFates, 'Destinos Familiares')
        : current.acquaintFates;

    const starglitter =
      input.starglitter !== undefined
        ? validateResourceQuantity(input.starglitter, 'Brilho Estelar')
        : current.starglitter;

    const stardust =
      input.stardust !== undefined
        ? validateResourceQuantity(input.stardust, 'Poeira Estelar')
        : current.stardust;

    const genesis =
      input.genesisCrystals !== undefined
        ? validateResourceQuantity(input.genesisCrystals, 'Cristais Gênesis')
        : current.genesisCrystals;

    const updatedAt = new Date().toISOString();
    const db = await getDatabase();

    await db.execute(
      `INSERT OR REPLACE INTO profile_resources (
        profile_id, primogems, intertwined_fates, acquaint_fates,
        starglitter, stardust, genesis_crystals, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [profileId, primogems, intertwined, acquaint, starglitter, stardust, genesis, updatedAt]
    );

    return {
      profileId,
      primogems,
      intertwinedFates: intertwined,
      acquaintFates: acquaint,
      starglitter,
      stardust,
      genesisCrystals: genesis,
      updatedAt,
    };
  }

  public async getInventory(profileId: string): Promise<InventoryItem[]> {
    const db = await getDatabase();
    const rows = await db.select<InventoryItemRow[]>(
      'SELECT * FROM inventory_items WHERE profile_id = $1',
      [profileId]
    );

    return mergeInventoryAliases((rows || []).map(mapInventoryRow)).filter(item => !isWishResourceMaterialId(item.materialId));
  }

  public async getInventoryItem(profileId: string, materialId: string): Promise<InventoryItem | null> {
    materialId = canonicalMaterialId(materialId);
    if (isWishResourceMaterialId(materialId)) {
      return null;
    }

    const db = await getDatabase();
    const rows = await db.select<InventoryItemRow[]>(
      'SELECT * FROM inventory_items WHERE profile_id = $1 AND material_id = $2 LIMIT 1',
      [profileId, materialId]
    );

    if (!rows || rows.length === 0) return null;
    return mapInventoryRow(rows[0]);
  }

  public async setInventoryItem(
    profileId: string,
    materialId: string,
    quantity: number
  ): Promise<InventoryItem> {
    materialId = canonicalMaterialId(materialId);
    if (isWishResourceMaterialId(materialId)) {
      throw new Error(
        `O item "${materialId}" é um recurso de desejos e deve ser gerenciado exclusivamente através de profile_resources para garantir uma única fonte de verdade.`
      );
    }

    const validQty = validateResourceQuantity(quantity, 'Quantidade');
    const updatedAt = new Date().toISOString();
    const db = await getDatabase();

    await db.execute(
      `INSERT OR REPLACE INTO inventory_items (
        profile_id, material_id, quantity, updated_at
      ) VALUES ($1, $2, $3, $4)`,
      [profileId, materialId, validQty, updatedAt]
    );

    return {
      profileId,
      materialId,
      quantity: validQty,
      updatedAt,
    };
  }

  public async setInventoryBatch(
    profileId: string,
    items: Array<{ materialId: string; quantity: number }>
  ): Promise<void> {
    const db = await getDatabase();
    const updatedAt = new Date().toISOString();

    const canonicalItems = mergeInventoryAliases(items.map(item => ({ ...item, profileId, updatedAt })));
    for (const item of canonicalItems) {
      if (isWishResourceMaterialId(item.materialId)) {
        throw new Error(
          `O item "${item.materialId}" é um recurso de desejos e deve ser gerenciado exclusivamente através de profile_resources para garantir uma única fonte de verdade.`
        );
      }

      const validQty = validateResourceQuantity(item.quantity, 'Quantidade');
      await db.execute(
        `INSERT OR REPLACE INTO inventory_items (
          profile_id, material_id, quantity, updated_at
        ) VALUES ($1, $2, $3, $4)`,
        [profileId, item.materialId, validQty, updatedAt]
      );
    }
  }

  public async deleteInventoryItem(profileId: string, materialId: string): Promise<void> {
    materialId = canonicalMaterialId(materialId);
    const db = await getDatabase();
    await db.execute(
      'DELETE FROM inventory_items WHERE profile_id = $1 AND material_id = $2',
      [profileId, materialId]
    );
  }

  public async clearInventory(profileId: string): Promise<void> {
    const db = await getDatabase();
    await db.execute('DELETE FROM inventory_items WHERE profile_id = $1', [profileId]);
  }
}

export const inventoryRepository: IInventoryRepository = new SqliteInventoryRepository();
