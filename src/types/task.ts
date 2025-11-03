export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
}

export interface TaskDraft {
  title: string;
  dueDate: string | null;
  category: string;
  completed: boolean;
  progress: number;
}
