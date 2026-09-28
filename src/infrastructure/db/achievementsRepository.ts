import type {
  AchievementOverallSummary,
  AchievementWithStatus,
} from '../../domain/achievements/types';
import { CATALOG_IDS, SEED_ACHIEVEMENTS } from '../../domain/achievements/seedData';
import { getDatabaseInstance } from './client';

export interface AchievementRow {
  id: string;
  category: string;
  name_pt_br: string;
  description_pt_br: string;
  reward_primogems: number;
  version_id: string | null;
  order_index: number;
  created_at: string;
}

export interface ProfileAchievementRow {
  profile_id: string;
  achievement_id: string;
  completed: number;
  completed_at: string | null;
  notes: string | null;
}

export class AchievementsRepository {
  public async ensureAchievementsSeeded(): Promise<void> {
    const db = await getDatabaseInstance();
    const rows = await db.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM achievements'
    );
    const count = rows && rows[0] ? Number(rows[0].count) : 0;
    if (count >= SEED_ACHIEVEMENTS.length) return;

    const now = new Date().toISOString();
    for (const ach of SEED_ACHIEVEMENTS) {
      await db.execute(
        `INSERT OR IGNORE INTO achievements (
          id, category, name_pt_br, description_pt_br, reward_primogems, version_id, order_index, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          ach.id,
          ach.category,
          ach.namePtBr,
          ach.descriptionPtBr,
          ach.rewardPrimogems,
          ach.versionId ?? null,
          ach.orderIndex,
          now,
        ]
      );
    }
  }

  public async getAllAchievementIds(): Promise<Set<string>> {
    await this.ensureAchievementsSeeded();
    const db = await getDatabaseInstance();
    const rows = await db.select<{ id: string }[]>('SELECT id FROM achievements');
    return new Set((rows || []).map((r) => r.id));
  }

  public async importAchievementsBatch(
    profileId: string,
    entries: { achievementId: string; completed: boolean; completedAt?: string | null }[]
  ): Promise<{ insertedOrUpdated: number }> {
    if (!profileId || entries.length === 0) return { insertedOrUpdated: 0 };
    if (entries.some(entry => !CATALOG_IDS.has(entry.achievementId))) throw new Error('Conquista obsoleta ou desconhecida no catálogo canônico.');
    await this.ensureAchievementsSeeded();
    const db = await getDatabaseInstance();

    const now = new Date().toISOString();
    const values = entries.map(item => [profileId, item.achievementId, item.completed ? 1 : 0,
      item.completed ? (item.completedAt === undefined ? now : item.completedAt) : null]);
    await db.execute(
        `INSERT INTO profile_achievements (profile_id, achievement_id, completed, completed_at)
         SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'),
                json_extract(value, '$[2]'), json_extract(value, '$[3]')
         FROM json_each($1) WHERE true
         ON CONFLICT(profile_id, achievement_id) DO UPDATE SET
           completed = excluded.completed,
           completed_at = excluded.completed_at`,
        [JSON.stringify(values)]
      );
    return { insertedOrUpdated: entries.length };
  }

  public async getAchievementsWithStatus(
    profileId: string,
    category?: string
  ): Promise<AchievementWithStatus[]> {
    await this.ensureAchievementsSeeded();
    const db = await getDatabaseInstance();

    let query = `
      SELECT 
        a.id, a.category, a.name_pt_br, a.description_pt_br, a.reward_primogems,
        a.version_id, a.order_index, a.created_at,
        COALESCE(pa.completed, 0) as completed,
        pa.completed_at
      FROM achievements a
      LEFT JOIN profile_achievements pa 
        ON pa.achievement_id = a.id AND pa.profile_id = $1
    `;
    const params: unknown[] = [profileId];

    if (category) {
      query += ' WHERE a.category = $2';
      params.push(category);
    }

    query += ' ORDER BY a.category ASC, a.order_index ASC, a.name_pt_br ASC';

    type JoinedRow = AchievementRow & { completed: number; completed_at: string | null };
    const rows = await db.select<JoinedRow[]>(
      query,
      params
    );

    return (rows || []).map((r: JoinedRow) => ({
      id: r.id,
      category: r.category,
      namePtBr: r.name_pt_br,
      descriptionPtBr: r.description_pt_br,
      rewardPrimogems: r.reward_primogems,
      versionId: r.version_id,
      orderIndex: r.order_index,
      createdAt: r.created_at,
      completed: Boolean(r.completed),
      completedAt: r.completed_at,
    }));
  }

  public async toggleAchievement(
    profileId: string,
    achievementId: string,
    explicitCompleted?: boolean
  ): Promise<boolean> {
    if (!CATALOG_IDS.has(achievementId)) throw new Error('Conquista obsoleta ou desconhecida no catálogo canônico.');
    const db = await getDatabaseInstance();
    const rows = await db.select<ProfileAchievementRow[]>(
      'SELECT * FROM profile_achievements WHERE profile_id = $1 AND achievement_id = $2',
      [profileId, achievementId]
    );

    const now = new Date().toISOString();
    let nextState: boolean;

    if (explicitCompleted !== undefined) {
      nextState = explicitCompleted;
    } else if (rows && rows.length > 0) {
      nextState = !rows[0].completed;
    } else {
      nextState = true;
    }

    const completedAt = nextState ? now : null;

    await db.execute(
      `INSERT INTO profile_achievements (profile_id, achievement_id, completed, completed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(profile_id, achievement_id) DO UPDATE SET
         completed = excluded.completed,
         completed_at = excluded.completed_at`,
      [profileId, achievementId, nextState ? 1 : 0, completedAt]
    );

    return nextState;
  }

  public async getAchievementSummary(profileId: string): Promise<AchievementOverallSummary> {
    const all = await this.getAchievementsWithStatus(profileId);

    const categoriesMap = new Map<string, AchievementWithStatus[]>();
    for (const ach of all) {
      const list = categoriesMap.get(ach.category) || [];
      list.push(ach);
      categoriesMap.set(ach.category, list);
    }

    const totalAchievements = all.length;
    let completedAchievements = 0;
    let totalPrimogems = 0;
    let earnedPrimogems = 0;

    const categorySummaries = Array.from(categoriesMap.entries()).map(([cat, list]) => {
      let cCompleted = 0;
      let cTotalPrimos = 0;
      let cEarnedPrimos = 0;

      for (const a of list) {
        cTotalPrimos += a.rewardPrimogems;
        totalPrimogems += a.rewardPrimogems;
        if (a.completed) {
          cCompleted++;
          completedAchievements++;
          cEarnedPrimos += a.rewardPrimogems;
          earnedPrimogems += a.rewardPrimogems;
        }
      }

      return {
        category: cat,
        total: list.length,
        completed: cCompleted,
        totalPrimogems: cTotalPrimos,
        earnedPrimogems: cEarnedPrimos,
        percentage: list.length > 0 ? Math.round((cCompleted / list.length) * 100) : 0,
      };
    });

    const overallPercentage =
      totalAchievements > 0
        ? Math.round((completedAchievements / totalAchievements) * 1000) / 10
        : 0;

    return {
      totalAchievements,
      completedAchievements,
      totalPrimogems,
      earnedPrimogems,
      overallPercentage,
      categorySummaries,
    };
  }
}

export const achievementsRepository = new AchievementsRepository();
