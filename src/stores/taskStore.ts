import { create } from "zustand";

import type { Task, TaskDraft } from "@/types/task";

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  fetchTasks: (token: string) => Promise<void>;
  addTask: (task: TaskDraft, token: string) => Promise<void>;
  updateTaskProgress: (
    id: string,
    value: number,
    token: string,
  ) => Promise<void>;
  toggleTask: (id: string, token: string) => Promise<void>;
  deleteTask: (id: string, token: string) => Promise<void>;
  dismissTask: (id: string, token: string) => Promise<void>;
  updateTask: (
    id: string,
    updates: Partial<Omit<Task, "id">>,
    token: string,
  ) => Promise<void>;
  setError: (message: string | null) => void;
}

const API_BASE = "/api/tasks";

const withAuth = (token: string, extra: HeadersInit = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

const parseTask = (task: Task): Task => ({
  id: task.id,
  title: task.title,
  dueDate: task.dueDate ?? null,
  category: task.category,
  completed: task.completed,
  progress: task.progress,
  completedAt: task.completedAt ?? null,
  isGoal: task.isGoal,
  goalFrequency: task.goalFrequency,
});


export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  isRefreshing: false,
  error: null,

  setError: (message) => set({ error: message }),

  fetchTasks: async (token) => {
    const hasExistingTasks = get().tasks.length > 0;
    set({
      isLoading: !hasExistingTasks,
      isRefreshing: hasExistingTasks,
      error: null,
    });

    try {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: withAuth(token),
        cache: "no-store",
      });

      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || "Failed to load tasks");
      }

      const data = (await response.json()) as Task[];
      set({
        tasks: data.map(parseTask),
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load tasks. Please try again.",
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  addTask: async (task, token) => {
    set({ error: null });
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: withAuth(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || "Failed to create task");
      }

      const created = parseTask(await response.json());
      set((state) => ({
        tasks: [...state.tasks, created],
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create task. Please try again.",
      });
      throw error;
    }
  },

  updateTaskProgress: async (id, value, token) => {
    const completed = value === 100;
    await get().updateTask(id, { progress: value, completed }, token);
  },

  toggleTask: async (id, token) => {
    const task = get().tasks.find((item) => item.id === id);
    if (!task) return;

    const nextCompleted = !task.completed;
    const progress = nextCompleted ? 100 : 0;
    await get().updateTask(id, { completed: nextCompleted, progress }, token);
  },

  deleteTask: async (id, token) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: withAuth(token),
      });

      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || "Failed to delete task");
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete task. Please try again.",
      });
      throw error;
    }
  },

  dismissTask: async (id, token) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}/dismiss`, {
        method: "POST",
        headers: withAuth(token),
      });

      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || "Failed to dismiss task");
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to dismiss task. Please try again.",
      });
      throw error;
    }
  },

  updateTask: async (
    id: string,
    updates: Partial<Omit<Task, "id">>,
    token: string,
  ) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: withAuth(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || "Failed to update task");
      }

      const updated = parseTask(await response.json());
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update task. Please try again.",
      });
      throw error;
    }
  },
}));
