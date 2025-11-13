import { Evolution, Task } from "./history";

export const mockEvolutions: Evolution[] = [
  {
    id: "e1",
    level: 2,
    form: "baby",
    evolvedAt: "2025-02-01T10:00:00Z"
  },
  {
    id: "e2",
    level: 3,
    form: "teen",
    evolvedAt: "2025-02-10T14:30:00Z"
  },
  {
    id: "e3",
    level: 4,
    form: "adult",
    evolvedAt: "2025-02-20T16:45:00Z"
  }
];

export const mockTasks: Task[] = [
  { id: "t1", title: "Clean desk", completedAt: "2025-02-02T09:00:00Z" },
  { id: "t2", title: "Study 1 hour", completedAt: "2025-02-05T12:30:00Z" },
  { id: "t3", title: "Workout", completedAt: "2025-02-12T08:15:00Z" },
  { id: "t4", title: "Cook lunch", completedAt: "2025-02-18T18:10:00Z" }
];
