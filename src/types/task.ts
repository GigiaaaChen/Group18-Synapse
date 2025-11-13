export type GoalFrequency = "daily" | "weekly" | null;

export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
  completedAt: string | null;
  isGoal: boolean;
  goalFrequency: GoalFrequency;
}

export interface TaskDraft {
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
  isGoal: boolean;
  goalFrequency: GoalFrequency;
}
