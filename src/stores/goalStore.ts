import { create } from "zustand";
import type { Goal, GoalDraft, GoalOccurrence } from "@/types/goal";

interface GoalStore {
  goals: Goal[];
  occurrences: GoalOccurrence[];
  isLoading: boolean;
  error: string | null;

  fetchGoals: (token: string) => Promise<void>;
  createGoal: (draft: GoalDraft, token: string) => Promise<void>;
  completeOccurrence: (
    goalId: string,
    occurrenceId: string,
    token: string
  ) => Promise<void>;
  deleteGoal: (goalId: string, token: string) => Promise<void>;

  setError: (message: string | null) => void;
}

const API_BASE = "/api/goals";

const withAuth = (token: string, extra: HeadersInit = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

const parseGoal = (g: any): Goal => ({
  id: g.id,
  userId: g.userId,
  title: g.title,
  category: g.category,
  frequency: g.frequency,
  repeatDay: g.repeatDay ?? null,
  endDate: g.endDate,
  createdAt: g.createdAt ?? null,
});

const parseOccurrence = (o: any): GoalOccurrence => ({
  id: o.id,
  goalId: o.goalId,
  deadline: o.deadline,
  completed: o.completed,
  completedAt: o.completedAt ?? null,
  createdAt: o.createdAt ?? null,
});

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  occurrences: [],
  isLoading: false,
  error: null,

  setError: (message) => set({ error: message }),

  // --------- GET /api/goals ----------
  fetchGoals: async (token: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: withAuth(token),
        cache: "no-store",
      });

      if (!response.ok) {
        let body: { error?: string } = {};
        try {
          body = (await response.json()) as { error?: string };
        } catch {
          // response not JSON
        }
        throw new Error(body.error || "Failed to load goals");
      }

      const data = (await response.json()) as {
        goals: Goal[];
        occurrences: GoalOccurrence[];
      };

      set({
        goals: (data.goals || []).map(parseGoal),
        occurrences: (data.occurrences || []).map(parseOccurrence),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to load goals. Please try again.",
      });
    }
  },

  // --------- POST /api/goals ----------
  createGoal: async (draft: GoalDraft, token: string) => {
    set({ error: null });

    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: withAuth(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        let body: { error?: string } = {};
        try {
          body = (await response.json()) as { error?: string };
        } catch {
          // probably an HTML error page / non-JSON
        }
        throw new Error(body.error || "Failed to create goal");
      }

      const data = (await response.json()) as {
        goal: Goal;
        occurrences: GoalOccurrence[];
      };

      const newGoal = parseGoal(data.goal);
      const newOccs = (data.occurrences || []).map(parseOccurrence);

      set((state) => ({
        goals: [...(state.goals || []), newGoal],
        occurrences: [...(state.occurrences || []), ...newOccs],
      }));
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to create goal. Please try again.",
      });
      throw err;
    }
  },

  // --------- POST /api/goals/:goalId/complete ----------
  completeOccurrence: async (
    goalId: string,
    occurrenceId: string,
    token: string
  ) => {
    set({ error: null });

    try {
      const response = await fetch(`${API_BASE}/${goalId}/complete`, {
        method: "POST",
        headers: withAuth(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ occurrenceId }),
      });

      if (!response.ok) {
        let body: { error?: string } = {};
        try {
          body = (await response.json()) as { error?: string };
        } catch {
          // ignore
        }
        throw new Error(body.error || "Failed to complete occurrence");
      }

      const data = (await response.json()) as {
        occurrence: GoalOccurrence;
        xpGain?: number;
      };

      const updatedOcc = parseOccurrence(data.occurrence);

      set((state) => ({
        occurrences: (state.occurrences || []).map((occ) =>
          occ.id === updatedOcc.id ? updatedOcc : occ
        ),
      }));
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to complete goal occurrence. Please try again.",
      });
      throw err;
    }
  },

  // --------- DELETE /api/goals/:goalId ----------
  deleteGoal: async (goalId: string, token: string) => {
    set({ error: null });

    try {
      const response = await fetch(`${API_BASE}/${goalId}`, {
        method: "DELETE",
        headers: withAuth(token),
      });

      if (!response.ok) {
        let body: { error?: string } = {};
        try {
          body = (await response.json()) as { error?: string };
        } catch {
          // ignore
        }
        throw new Error(body.error || "Failed to delete goal");
      }

      set((state) => ({
        goals: (state.goals || []).filter((g) => g.id !== goalId),
        occurrences: (state.occurrences || []).filter(
          (o) => o.goalId !== goalId
        ),
      }));
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to delete goal. Please try again.",
      });
      throw err;
    }
  },
}));
