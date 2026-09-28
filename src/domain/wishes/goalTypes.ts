export type GoalPriority = 1 | 2 | 3; // 1 = Alta, 2 = Média, 3 = Baixa

export type GoalStatus = 'planning' | 'reserved' | 'completed' | 'canceled';

export interface WishGoal {
  id: string;
  profileId: string;
  targetType: 'character' | 'weapon';
  targetId: string;
  targetName: string;
  targetRank: number; // 0-6 para personagens (C0-C6), 1-5 para armas (R1-R5)
  priority: GoalPriority;
  status: GoalStatus;
  expectedVersionId: string | null;
  reservedWishes: number;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishGoalInput {
  targetType: 'character' | 'weapon';
  targetId: string;
  targetName: string;
  targetRank?: number;
  priority?: GoalPriority;
  status?: GoalStatus;
  expectedVersionId?: string | null;
  reservedWishes?: number;
  notes?: string | null;
  sortOrder?: number;
}

export interface UpdateWishGoalInput {
  targetType?: 'character' | 'weapon';
  targetId?: string;
  targetName?: string;
  targetRank?: number;
  priority?: GoalPriority;
  status?: GoalStatus;
  expectedVersionId?: string | null;
  reservedWishes?: number;
  notes?: string | null;
  sortOrder?: number;
}

export interface WishGoalSimulation {
  goal: WishGoal;
  currentSavingsPulls: number; // Tiros totais disponíveis (Destinos + Primogems/160 + Gênesis/160)
  pullsRequiredWorstCase: number;
  pullsRequiredExpected: number;
  surplusOrDeficitWorstCase: number;
  surplusOrDeficitExpected: number;
  isGuaranteed: boolean;
  canGuaranteeWorstCase: boolean;
  canGuaranteeExpected: boolean;
}
