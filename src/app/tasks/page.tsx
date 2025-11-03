"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { useTaskStore } from "@/stores/taskStore";

export default function TaskPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoadingTasks = useTaskStore((state) => state.isLoading);
  const taskError = useTaskStore((state) => state.error);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTaskProgress = useTaskStore((state) => state.updateTaskProgress);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const setError = useTaskStore((state) => state.setError);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskCategory, setTaskCategory] = useState("personal");
  const [newProgress, setNewProgress] = useState(0);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  const authToken = session?.session?.token;

  useEffect(() => {
    if (!authToken) return;
    fetchTasks(authToken).catch(() => {
      // errors are handled inside the store
    });
  }, [authToken, fetchTasks]);

  const handleAddTask = async () => {
    if (taskTitle.trim() === "") {
      alert("Please enter a task title!");
      return;
    }

    if (!authToken) {
      router.push("/signin");
      return;
    }

    try {
      await addTask(
        {
          title: taskTitle,
          dueDate: taskDate ? taskDate : null,
          category: taskCategory,
          completed: false,
          progress: newProgress,
        },
        authToken,
      );

      setTaskTitle("");
      setTaskDate("");
      setTaskCategory("personal");
      setNewProgress(0);
    } catch {
      // store already captured the error
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: "#4CAF50",
      work: "#2196F3",
      health: "#FF9800",
      study: "#9C27B0",
    };
    return colors[category] || "#gray";
  };

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

  if (!session) {
    return null;
  }

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
          </select>

          <label
            htmlFor="new-task-progress"
            style={{ fontSize: 14, color: "#666" }}
          >
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
                  borderLeft: `4px solid ${getCategoryColor(task.category)}`,
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
                      toggleTask(task.id, authToken).catch(() => {
                        // handled by store
                      });
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
                        textDecoration: task.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {task.title}
                    </h3>
                    <div
                      style={{ display: "flex", gap: "15px", fontSize: "14px" }}
                    >
                      <span
                        style={{
                          color: "#666",
                          textTransform: "capitalize",
                          fontWeight: "bold",
                        }}
                      >
                        {task.category}
                      </span>
                      {task.dueDate && (
                        <span style={{ color: "#999" }}>
                          Due: {task.dueDate}
                        </span>
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
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {task.progress}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.progress}
                      onChange={(e) => {
                        if (!authToken) return;
                        setError(null);
                        updateTaskProgress(
                          task.id,
                          Number(e.target.value),
                          authToken,
                        ).catch(() => {
                          // handled by store
                        });
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!authToken) return;
                    setError(null);
                    deleteTask(task.id, authToken).catch(() => {
                      // handled by store
                    });
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
