import { create } from "zustand";
import type { Task, TaskDraft } from "@/types/task";

type TimeEntry = {
  id: string;
  taskId: string;
  startedAt: string;
};

type HistoryEntry = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
};

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: (token: string) => Promise<void>;
  addTask: (task: Partial<TaskDraft>, token: string) => Promise<void>;
  updateTaskProgress: (id: string, value: number, token: string) => Promise<void>;
  toggleTask: (id: string, token: string) => Promise<void>;
  deleteTask: (id: string, token: string) => Promise<void>;
  updateTask: (
    id: string,
    updates: Partial<Omit<Task, "id">>,
    token: string,
  ) => Promise<void>;
  setError: (message: string | null) => void;

  activeTimer: TimeEntry | null;
  historyByTask: Record<string, HistoryEntry[]>;
  startTimer: (taskId: string, token?: string) => Promise<void>;
  stopTimer: (token?: string) => Promise<void>;
  fetchTaskHistory: (taskId: string, token?: string) => Promise<void>;
}

const API_BASE = "/api/tasks";
const TIME_API_BASE = "/api/time_entries";

const withAuth = (token: string, extra: HeadersInit = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

const parseTask = (task: Task): Task => ({
  id: task.id,
  user_id: task.user_id,
  title: task.title,
  category: task.category ?? null,
  due_date: task.due_date ?? null,
  completed: !!task.completed,
  progress: Number(task.progress ?? 0),
  is_goal: !!task.is_goal,
  goal_cadence: task.goal_cadence ?? null,
  goal_target_per_period: task.goal_target_per_period ?? null,
  goal_category: task.goal_category ?? null,
  goal_active: task.goal_active ?? true,
});

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setError: (message) => set({ error: message }),

  fetchTasks: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: withAuth(token),
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || "Failed to load tasks");
      }
      const data = (await response.json()) as Task[];
      set({ tasks: data.map(parseTask), isLoading: false, error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load tasks. Please try again.",
        isLoading: false,
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
        credentials: "include",
      });
      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || "Failed to create task");
      }
      const created = parseTask(await response.json());
      set((state) => ({
        tasks: [created, ...state.tasks],
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
        credentials: "include",
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

  updateTask: async (id, updates, token) => {
    set({ error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: withAuth(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(updates),
        credentials: "include",
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

  activeTimer: null,
  historyByTask: {},

  startTimer: async (taskId, token) => {
    const headers: HeadersInit = token
      ? withAuth(token, { "Content-Type": "application/json" })
      : { "Content-Type": "application/json" };

    const prevActive = get().activeTimer;

    const res = await fetch(TIME_API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify({ taskId }),
      credentials: "include",
    });
    if (!res.ok) {
      const msg = "Failed to start timer";
      get().setError(msg);
      throw new Error(msg);
    }
    const { id } = (await res.json()) as { id: string };
    set({ activeTimer: { id, taskId, startedAt: new Date().toISOString() } });
    
    if (prevActive?.taskId) {
      try {
        await get().fetchTaskHistory(prevActive.taskId, token);
      } catch {}
    }
  },

  stopTimer: async (token) => {
    const timer = get().activeTimer;
    if (!timer) return;
    const headers: HeadersInit = token
      ? withAuth(token, { "Content-Type": "application/json" })
      : { "Content-Type": "application/json" };
    const res = await fetch(TIME_API_BASE, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: timer.id }),
      credentials: "include",
    });
    if (!res.ok) {
      const msg = "Failed to stop timer";
      get().setError(msg);
      throw new Error(msg);
    }
    set({ activeTimer: null });
    await get().fetchTaskHistory(timer.taskId, token);
  },

  fetchTaskHistory: async (taskId, token) => {
    const headers: HeadersInit = token ? withAuth(token) : {};
    const res = await fetch(
      `${TIME_API_BASE}/history?taskId=${encodeURIComponent(taskId)}`,
      { headers, credentials: "include" },
    );
    if (!res.ok) return;
    const { entries } = (await res.json()) as { entries: HistoryEntry[] };
    set((s) => ({
      historyByTask: {
        ...s.historyByTask,
        [taskId]: entries,
      },
    }));
  },
}));
