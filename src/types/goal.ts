export type GoalPeriod = "daily" | "weekly";
export type GoalCategory = "personal" | "work" | "health" | "study";

export interface Goal {
  id: string;
  userId: string;
  category: GoalCategory;
  period: GoalPeriod;
  minutesTarget: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalProgress {
  category: GoalCategory;
  period: GoalPeriod;
  minutesTarget: number;
  minutesLogged: number;
  minutesRemaining: number;
  met: boolean;
}
