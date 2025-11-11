export type Task = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  due_date: string | null;
  completed: boolean;
  progress: number;

  is_goal: boolean;
  goal_cadence: "daily" | "weekly" | null;
  goal_target_per_period: number | null;
  goal_category: string | null;
  goal_active: boolean;
};

export interface TaskDraft {
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;

  is_goal?: boolean;
  goal_cadence?: "daily" | "weekly" | null;
  goal_target_per_period?: number | null;
  goal_category?: string | null;
  goal_active?: boolean;
}
