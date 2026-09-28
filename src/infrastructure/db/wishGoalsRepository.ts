import { validateBannerGoalTarget } from '../../domain/profiles/traveler';
import type {
  CreateWishGoalInput,
  GoalPriority,
  GoalStatus,
  UpdateWishGoalInput,
  WishGoal,
} from '../../domain/wishes/goalTypes';
import { getDatabaseInstance } from './client';
import { validatePlannedVersion } from '../../domain/wishes/plannedVersion';

export interface WishGoalRow {
  id: string;
  profile_id: string;
  target_type: string;
  target_id: string;
  target_name: string;
  target_rank: number;
  priority: number;
  status: string;
  expected_version_id: string | null;
  reserved_wishes: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapRowToGoal(row: WishGoalRow): WishGoal {
  return {
    id: row.id,
    profileId: row.profile_id,
    targetType: row.target_type as 'character' | 'weapon',
    targetId: row.target_id,
    targetName: row.target_name,
    targetRank: row.target_rank,
    priority: row.priority as GoalPriority,
    status: row.status as GoalStatus,
    expectedVersionId: row.expected_version_id,
    reservedWishes: row.reserved_wishes,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class WishGoalsRepository {
  public async getGoalsByProfile(profileId: string): Promise<WishGoal[]> {
    const db = await getDatabaseInstance();
    const rows = await db.select<WishGoalRow[]>(
      'SELECT * FROM wish_goals WHERE profile_id = $1 ORDER BY sort_order ASC, priority ASC, created_at ASC',
      [profileId]
    );
    return (rows || []).map(mapRowToGoal);
  }

  public async createGoal(profileId: string, input: CreateWishGoalInput): Promise<WishGoal> {
    validateBannerGoalTarget(input.targetType, input.targetId, input.targetName);
    validatePlannedVersion(input.expectedVersionId);
    const db = await getDatabaseInstance();
    const now = new Date().toISOString();
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Pega o maior sort_order atual para adicionar ao final
    const existing = await this.getGoalsByProfile(profileId);
    const nextSortOrder = input.sortOrder !== undefined ? input.sortOrder : existing.length;

    await db.execute(
      `INSERT INTO wish_goals (
        id, profile_id, target_type, target_id, target_name, target_rank,
        priority, status, expected_version_id, reserved_wishes, notes,
        sort_order, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        profileId,
        input.targetType,
        input.targetId,
        input.targetName,
        input.targetRank ?? 0,
        input.priority ?? 1,
        input.status ?? 'planning',
        input.expectedVersionId ?? null,
        input.reservedWishes ?? 0,
        input.notes ?? null,
        nextSortOrder,
        now,
        now,
      ]
    );

    return {
      id,
      profileId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      targetRank: input.targetRank ?? 0,
      priority: input.priority ?? 1,
      status: input.status ?? 'planning',
      expectedVersionId: input.expectedVersionId ?? null,
      reservedWishes: input.reservedWishes ?? 0,
      notes: input.notes ?? null,
      sortOrder: nextSortOrder,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async updateGoal(id: string, input: UpdateWishGoalInput): Promise<WishGoal | null> {
    if (input.expectedVersionId !== undefined) validatePlannedVersion(input.expectedVersionId);
    const db = await getDatabaseInstance();
    const rows = await db.select<WishGoalRow[]>(
      'SELECT * FROM wish_goals WHERE id = $1',
      [id]
    );
    if (!rows || rows.length === 0) return null;

    const current = mapRowToGoal(rows[0]);
    const now = new Date().toISOString();

    const targetType = input.targetType ?? current.targetType;
    const targetId = input.targetId ?? current.targetId;
    const targetName = input.targetName ?? current.targetName;
    validateBannerGoalTarget(targetType, targetId, targetName);
    const targetRank = input.targetRank !== undefined ? input.targetRank : current.targetRank;
    const priority = input.priority !== undefined ? input.priority : current.priority;
    const status = input.status !== undefined ? input.status : current.status;
    const expectedVersionId = input.expectedVersionId !== undefined ? input.expectedVersionId : current.expectedVersionId;
    const reservedWishes = input.reservedWishes !== undefined ? input.reservedWishes : current.reservedWishes;
    const notes = input.notes !== undefined ? input.notes : current.notes;
    const sortOrder = input.sortOrder !== undefined ? input.sortOrder : current.sortOrder;

    await db.execute(
      `UPDATE wish_goals SET
        target_type = $1, target_id = $2, target_name = $3, target_rank = $4,
        priority = $5, status = $6, expected_version_id = $7, reserved_wishes = $8,
        notes = $9, sort_order = $10, updated_at = $11
      WHERE id = $12`,
      [
        targetType,
        targetId,
        targetName,
        targetRank,
        priority,
        status,
        expectedVersionId,
        reservedWishes,
        notes,
        sortOrder,
        now,
        id,
      ]
    );

    return {
      ...current,
      targetType,
      targetId,
      targetName,
      targetRank,
      priority,
      status,
      expectedVersionId,
      reservedWishes,
      notes,
      sortOrder,
      updatedAt: now,
    };
  }

  public async deleteGoal(id: string): Promise<boolean> {
    const db = await getDatabaseInstance();
    const res = await db.execute('DELETE FROM wish_goals WHERE id = $1', [id]);
    return res.rowsAffected > 0;
  }

  public async markGoalCompleted(id: string): Promise<WishGoal | null> {
    return this.updateGoal(id, { status: 'completed' });
  }

  public async reorderGoals(profileId: string, goalIdsInOrder: string[]): Promise<void> {
    const db = await getDatabaseInstance();
    for (let i = 0; i < goalIdsInOrder.length; i++) {
      await db.execute(
        'UPDATE wish_goals SET sort_order = $1 WHERE id = $2 AND profile_id = $3',
        [i, goalIdsInOrder[i], profileId]
      );
    }
  }
}

export const wishGoalsRepository = new WishGoalsRepository();
