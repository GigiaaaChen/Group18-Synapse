"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { useTaskStore } from "@/stores/taskStore";

const formatMMSS = (startedAt: string, endedAt: string) => {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const secs = Math.max(0, Math.floor((end - start) / 1000));
  const mm = Math.floor(secs / 60).toString().padStart(2, "0");
  const ss = (secs % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};
const daysUntilDue = (dueDate: string) => {
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((+due - +today) / 86400000);
};

type Reminder = { id: string; title: string; dueDate: string; days: number; storageKey: string };
const todayKey = () => {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const dateKey = () => {
  const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const weekKey = () => {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${pad2(week)}`;
};

export default function TaskPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const tasks = useTaskStore((s) => s.tasks);
  const isLoadingTasks = useTaskStore((s) => s.isLoading);
  const taskError = useTaskStore((s) => s.error);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTaskProgress = useTaskStore((s) => s.updateTaskProgress);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const setError = useTaskStore((s) => s.setError);

  const activeTimer = useTaskStore((s) => s.activeTimer);
  const startTimer = useTaskStore((s) => s.startTimer);
  const stopTimer = useTaskStore((s) => s.stopTimer);
  const historyByTask = useTaskStore((s) => s.historyByTask);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskCategory, setTaskCategory] = useState("personal");
  const [newProgress, setNewProgress] = useState(0);

  const [isGoal, setIsGoal] = useState(false);
  const [goalCadence, setGoalCadence] = useState<"daily" | "weekly">("daily");
  const [goalTarget, setGoalTarget] = useState<number>(30);
  const [goalCategory, setGoalCategory] = useState<string>("");

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [goalReminders, setGoalReminders] = useState<{ text: string; title: string }[]>([]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  const authToken =
    (session as any)?.session?.token ??
    (session as any)?.token ??
    undefined;

  useEffect(() => {
    if (!authToken) return;
    fetchTasks(authToken).catch(() => {});
  }, [authToken, fetchTasks]);

  useEffect(() => {
    if (!authToken) return;

    const now = new Date();
    const h = now.getHours();
    const dailyKey = `goalremind:daily:${todayKey()}`;

    const headers: HeadersInit = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const runDaily = async () => {
      if (h < 12) return;
      if (localStorage.getItem(dailyKey)) return;
      const res = await fetch("/api/cron/daily?consume=1", {
        headers,
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({ reminders: [] }));
      if (Array.isArray(data.reminders) && data.reminders.length) {
        setGoalReminders((prev) => [
          ...prev,
          ...data.reminders.map((r: any) => ({ text: r.text, title: r.title })),
        ]);
        localStorage.setItem(dailyKey, "1");
      }
    };

    const weeklyKeyStr = `goalremind:weekly:${weekKey()}`;

    const runWeekly = async () => {
      const dow = now.getDay();
      if (!(dow === 0 && h >= 9)) return;
      if (localStorage.getItem(weeklyKeyStr)) return;
      const res = await fetch("/api/cron/weekly?consume=1", {
        headers,
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({ reminders: [] }));
      if (Array.isArray(data.reminders) && data.reminders.length) {
        setGoalReminders((prev) => [
          ...prev,
          ...data.reminders.map((r: any) => ({ text: r.text, title: r.title })),
        ]);
        localStorage.setItem(weeklyKeyStr, "1");
      }
    };

    runDaily().catch(() => {});
    runWeekly().catch(() => {});
  }, [authToken]);

  useEffect(() => {
    const kToday = todayKey();
    const next: Reminder[] = [];
    for (const t of tasks) {
      if (!t?.due_date || t.completed) continue;
      const d = daysUntilDue(t.due_date);
      if (d >= 1 && d <= 3) {
        const key = `reminder:${t.id}:${t.due_date}:${kToday}`;
        try {
          if (!localStorage.getItem(key)) {
            next.push({ id: t.id, title: t.title, dueDate: t.due_date, days: d, storageKey: key });
          }
        } catch {}
      }
    }
    setReminders(next);
  }, [tasks]);

  const handleAddTask = async () => {
    if (taskTitle.trim() === "") return alert("Please enter a task title!");
    if (!authToken) return router.push("/signin");
    try {
      await addTask(
        {
          title: taskTitle,
          dueDate: isGoal ? null : (taskDate ? taskDate : null),
          category: taskCategory,
          completed: false,
          progress: newProgress,
          is_goal: isGoal,
          goal_cadence: isGoal ? goalCadence : null,
          goal_target_per_period: isGoal ? goalTarget : null,
          goal_category: isGoal ? (goalCategory || taskCategory) : null,
          goal_active: isGoal ? true : undefined,
        },
        authToken,
      );
      setTaskTitle("");
      setTaskDate("");
      setTaskCategory("personal");
      setNewProgress(0);
      setIsGoal(false);
      setGoalCadence("daily");
      setGoalTarget(30);
      setGoalCategory("");
    } catch {}
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: "#4CAF50",
      work: "#2196F3",
      health: "#FF9800",
      study: "#9C27B0",
      exercise: "#FF7043",
      hobby: "#8E24AA",
      general: "#888",
    };
    return colors[category] || "#888";
  };

  const getDisplayCategory = (task: any) =>
    task.is_goal ? (task.goal_category || task.category || "general") : (task.category || "general");

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  };

  const taskBoxStyle: CSSProperties = {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    maxWidth: "800px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  if (isPending) {
    return (
      <div style={containerStyle}>
        <div style={taskBoxStyle}>
          <h1 style={{ fontSize: "32px", color: "#333", textAlign: "center" }}>
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={containerStyle}>
      <div style={taskBoxStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Link
            href="/"
            style={{
              backgroundColor: "#e0e0e0",
              color: "#333",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            ← Back to Welcome
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <span style={{ color: "#666", fontSize: "14px" }}>
              {session.user.name || session.user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                backgroundColor: "#ff4757",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: "32px", color: "#333", marginBottom: "10px" }}>
          My Tasks
        </h1>

        {goalReminders.length > 0 && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#e8f5e9",
              color: "#1b5e20",
              fontSize: "14px",
              border: "1px solid #c8e6c9",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Goal reminders:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {goalReminders.map((r, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <span>“{r.title}” — {r.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reminders.length > 0 && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#fff3cd",
              color: "#8a6d3b",
              fontSize: "14px",
              border: "1px solid #ffe8a1",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Due soon:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {reminders.map((r) => (
                <li key={r.id} style={{ marginBottom: 6 }}>
                  <span>
                    “{r.title}” is due in {r.days} {r.days === 1 ? "day" : "days"} (Due: {r.dueDate})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      try { localStorage.setItem(r.storageKey, "1"); } catch {}
                      setReminders((prev) => prev.filter((x) => x.id !== r.id));
                    }}
                    style={{
                      marginLeft: 10,
                      background: "#f0ad4e",
                      color: "white",
                      border: "none",
                      padding: "2px 8px",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Dismiss for today
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {taskError && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              color: "#c62828",
              fontSize: "14px",
            }}
          >
            {taskError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Task name..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "2px solid #ddd",
            }}
          />

          {!isGoal && (
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              style={{
                padding: "12px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "2px solid #ddd",
              }}
            />
          )}

          <select
            value={taskCategory}
            onChange={(e) => setTaskCategory(e.target.value)}
            style={{
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "2px solid #ddd",
              backgroundColor: "white",
            }}
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="health">Health</option>
            <option value="study">Study</option>
            <option value="exercise">Exercise</option>
            <option value="hobby">Hobby</option>
          </select>

          <label className="flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={isGoal}
              onChange={(e) => setIsGoal(e.target.checked)}
            />
            Set as goal
          </label>

          {isGoal && (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
              <label className="grid gap-1" style={{ display: "grid", gap: 4 }}>
                <span className="text-sm">Cadence</span>
                <select
                  value={goalCadence}
                  onChange={(e) => setGoalCadence(e.target.value as "daily" | "weekly")}
                  style={{ padding: "10px", borderRadius: 8, border: "2px solid #ddd" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>

              <label className="grid gap-1" style={{ display: "grid", gap: 4 }}>
                <span className="text-sm">Target per period</span>
                <input
                  type="number"
                  min={1}
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(parseInt(e.target.value || "0", 10))}
                  style={{ padding: "10px", borderRadius: 8, border: "2px solid #ddd" }}
                />
              </label>

              <label className="grid gap-1" style={{ display: "grid", gap: 4 }}>
                <span className="text-sm">Goal category</span>
                <input
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  placeholder="Health / Study / Work"
                  style={{ padding: "10px", borderRadius: 8, border: "2px solid #ddd" }}
                />
              </label>
            </div>
          )}

          <label htmlFor="new-task-progress" style={{ fontSize: 14, color: "#666" }}>
            Progress: {newProgress}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            id="new-task-progress"
            value={newProgress}
            onChange={(e) => setNewProgress(Number(e.target.value))}
            style={{ width: "100%" }}
          />

          <button
            type="button"
            onClick={handleAddTask}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Add Task
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {isLoadingTasks ? (
            <p
              style={{
                textAlign: "center",
                color: "#666",
                fontSize: "16px",
                padding: "40px",
              }}
            >
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#999",
                fontSize: "16px",
                padding: "40px",
              }}
            >
              No tasks yet! Add your first task above.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  backgroundColor: "#fafafa",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${getCategoryColor(getDisplayCategory(task))}`,
                  gap: "15px",
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flex: 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {
                      if (!authToken) return;
                      setError(null);
                      toggleTask(task.id, authToken).catch(() => {});
                    }}
                    aria-label={`Mark ${task.title} as ${
                      task.completed ? "incomplete" : "complete"
                    }`}
                  />
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "18px",
                        color: task.completed ? "#777" : "#333",
                        textDecoration: task.completed ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </h3>

                    <div style={{ display: "flex", gap: "15px", fontSize: "14px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          color: "#666",
                          textTransform: "capitalize",
                          fontWeight: "bold",
                        }}
                      >
                        {getDisplayCategory(task)}
                      </span>

                      {task.is_goal ? (
                        <>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "#e8f5e9",
                              color: "#1b5e20",
                              fontSize: 12,
                            }}
                          >
                            Goal • {task.goal_cadence || "-"}
                          </span>
                          {typeof task.goal_target_per_period === "number" && (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "#e3f2fd",
                                color: "#0277bd",
                                fontSize: 12,
                              }}
                            >
                              Target per period: {task.goal_target_per_period}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {task.due_date && (
                            <span style={{ color: "#999" }}>Due: {task.due_date}</span>
                          )}
                          {task.due_date && !task.completed && daysUntilDue(task.due_date) > 7 && (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "#e3f2fd",
                                color: "#0277bd",
                                fontSize: 12,
                              }}
                            >
                              Planned
                            </span>
                          )}
                          {task.due_date && !task.completed && daysUntilDue(task.due_date) >= 1 && daysUntilDue(task.due_date) <= 7 && (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "#fff8e1",
                                color: "#ef6c00",
                                fontSize: 12,
                              }}
                            >
                              Recent
                            </span>
                          )}
                        </>
                      )}

                      {task.completed && (
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#e8f5e9",
                          }}
                        >
                          Completed
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      {(historyByTask?.[task.id] ?? []).map((h: any) => (
                        <div key={h.id} style={{ fontSize: 12, color: "#666" }}>
                          • {new Date(h.startedAt).toLocaleString()} →{" "}
                          {new Date(h.endedAt).toLocaleString()} ({formatMMSS(h.startedAt, h.endedAt)})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {!task.completed && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#666" }}>{task.progress}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.progress}
                      onChange={(e) => {
                        if (!authToken) return;
                        setError(null);
                        updateTaskProgress(task.id, Number(e.target.value), authToken).catch(
                          () => {},
                        );
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                )}

                {!task.completed &&
                  (activeTimer?.taskId === task.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        stopTimer(authToken);
                      }}
                      style={{
                        backgroundColor: "#ff4757",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        marginLeft: 8,
                      }}
                    >
                      Stop Timer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        startTimer(task.id, authToken);
                      }}
                      style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        marginLeft: 8,
                      }}
                    >
                      Start Timer
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() => {
                    if (!authToken) return;
                    setError(null);
                    deleteTask(task.id, authToken).catch(() => {});
                  }}
                  style={{
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
