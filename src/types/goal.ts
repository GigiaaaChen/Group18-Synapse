export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: string;
  frequency: "daily" | "weekly";
  repeatDay: number | null;
  endDate: string;           // e.g. "2025-11-13"
  createdAt?: string | null; // ISO timestamp from DB
}

export interface GoalOccurrence {
  id: string;
  goalId: string;
  deadline: string;          // ISO timestamp
  completed: boolean;
  completedAt: string | null;
  createdAt?: string | null; // ISO timestamp
}

export interface GoalDraft {
  title: string;
  category: string;
  frequency: "daily" | "weekly";
  endDate: string;           // "YYYY-MM-DD" from <input type="date">
  repeatDay?: number | null; // 0–6 for weekly, null for daily
}
