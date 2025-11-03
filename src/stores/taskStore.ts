import { create } from "zustand";

import type { Task, TaskDraft } from "@/types/task";

interface TaskStore {
  tasks: Task[];
  addTask: (task: TaskDraft) => void;
  updateTaskProgress: (id: number, value: number) => void;
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (taskData) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          id: Date.now(),
          ...taskData,
        },
      ],
    })),
  updateTaskProgress: (id, value) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              progress: value,
              completed: value === 100 ? true : task.completed,
            }
          : task,
      ),
    })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== id) return task;

        const completed = !task.completed;
        return {
          ...task,
          completed,
          progress: completed ? 100 : 0,
        };
      }),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
}));
