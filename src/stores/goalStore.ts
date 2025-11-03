"use client";

import { create } from "zustand";
import type { Goal, GoalProgress, GoalCategory, GoalPeriod } from "@/types/goal";

interface GoalState {
  goals: Goal[];
  progress: GoalProgress[];
  isLoading: boolean;
  error: string | null;

  fetchGoals: (token: string) => Promise<void>;
  upsertGoal: (g: { category: GoalCategory; period: GoalPeriod; minutesTarget: number }, token: string) => Promise<void>;
  fetchSummary: (token: string) => Promise<void>;
  setError: (msg: string | null) => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  progress: [],
  isLoading: false,
  error: null,

  setError(msg) {
    set({ error: msg });
  },

  async fetchGoals(token) {
    set({ isLoading: true, error: null });
    const res = await fetch("/api/goals", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      set({ isLoading: false, error: error || "Failed to load goals" });
      return;
    }
    const data = (await res.json()) as Goal[];
    set({ goals: data, isLoading: false });
  },

  async upsertGoal(payload, token) {
    set({ error: null });
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      set({ error: error || "Failed to save goal" });
      return;
    }
    await get().fetchGoals(token);
    await get().fetchSummary(token);
  },

  async fetchSummary(token) {
    set({ error: null });
    const res = await fetch("/api/goals/summary", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      set({ error: error || "Failed to load goal progress" });
      return;
    }
    const data = (await res.json()) as GoalProgress[];
    set({ progress: data });
  },
}));
