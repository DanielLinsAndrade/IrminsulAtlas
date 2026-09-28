export interface Achievement {
  id: string;
  category: string;
  namePtBr: string;
  descriptionPtBr: string;
  rewardPrimogems: number; // 5, 10, 20
  versionId: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface ProfileAchievement {
  profileId: string;
  achievementId: string;
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
}

export interface AchievementWithStatus extends Achievement {
  completed: boolean;
  completedAt: string | null;
}

export interface AchievementCategorySummary {
  category: string;
  total: number;
  completed: number;
  totalPrimogems: number;
  earnedPrimogems: number;
  percentage: number;
}

export interface AchievementOverallSummary {
  totalAchievements: number;
  completedAchievements: number;
  totalPrimogems: number;
  earnedPrimogems: number;
  overallPercentage: number;
  categorySummaries: AchievementCategorySummary[];
}

export interface SeelieImportPreview {
  totalFound: number;
  recognizedCount: number;
  alreadyDoneCount: number;
  toMarkDoneCount: number;
  toUnmarkCount: number;
  unknownIds: string[];
  entriesToApply: { achievementId: string; completed: boolean; completedAt?: string | null }[];
}
