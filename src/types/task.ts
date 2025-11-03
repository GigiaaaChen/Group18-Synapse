export interface Task {
  id: number;
  title: string;
  dueDate: string;
  category: string;
  completed: boolean;
  progress: number;
}

export type TaskDraft = Omit<Task, "id">;
