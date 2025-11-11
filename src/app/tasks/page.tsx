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
  
  // XP state - stored in localStorage

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");

// XP state - stored in localStorage
const [totalXP, setTotalXP] = useState(() => {  
  if (typeof window !== 'undefined') {  
    const savedXP = localStorage.getItem("userXP");
    return savedXP ? Number(savedXP) : 0;  
  }
  return 0;
});

const [previousProgress, setPreviousProgress] = useState<Record<number, number>>(() => {  // 🎯 Lazy initialization
  if (typeof window !== 'undefined') {  
    const savedProgress = localStorage.getItem("taskProgress");
    return savedProgress ? JSON.parse(savedProgress) : {}; 
  }
  return {};
});

// Calculate level from XP
const currentLevel = Math.floor(totalXP / 100) + 1;

// Save XP to localStorage whenever it changes
useEffect(() => {
  localStorage.setItem("userXP", totalXP.toString());
}, [totalXP]);


  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  const authToken = session?.session?.token;

  useEffect(() => {
    if (!authToken) return;
    fetchTasks(authToken).catch(() => {
      
    });
  }, [authToken, fetchTasks]);

  // Check if task is overdue
  const isTaskOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

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
      
    }
  };

  const handleProgressChange = async (taskId: number, newProgressValue: number) => {
    if (!authToken) return;
    
    // Calculate XP gain
    const oldProgress = previousProgress[taskId] || 0;
    const xpGain = newProgressValue - oldProgress;
    
    if (xpGain > 0) {
      const oldLevel = Math.floor(totalXP / 100) + 1;
      const newTotalXP = totalXP + xpGain;
      const levelAfterGain = Math.floor(newTotalXP / 100) + 1;
      
      setTotalXP(newTotalXP);
      
      // Check if leveled up
      if (levelAfterGain > oldLevel) {
        setNewLevel(levelAfterGain);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
    }
    
    // Update previous progress tracking
    setPreviousProgress(prev => ({
      ...prev,
      [taskId]: newProgressValue
    }));
    
    setError(null);
    try {
      await updateTaskProgress(taskId, newProgressValue, authToken);
    } catch {
     
    }
  };

  const handleToggleTask = async (taskId: number, currentProgress: number) => {
    if (!authToken) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // If completing the task, add remaining XP
    if (!task.completed) {
      const oldProgress = previousProgress[taskId] || 0;
      const remainingXP = 100 - oldProgress;
      if (remainingXP > 0) {
        const oldLevel = Math.floor(totalXP / 100) + 1;
        const newTotalXP = totalXP + remainingXP;
        const levelAfterGain = Math.floor(newTotalXP / 100) + 1;
        
        setTotalXP(newTotalXP);
        
        // Check if leveled up
        if (levelAfterGain > oldLevel) {
          setNewLevel(levelAfterGain);
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 3000);
        }
      }
      setPreviousProgress(prev => ({
        ...prev,
        [taskId]: 100
      }));
    }
    
    setError(null);
    try {
      await toggleTask(taskId, authToken);
    } catch {
     
    }
  };

  const handleResetXP = () => {
    if (confirm("Are you sure you want to reset your XP? This cannot be undone.")) {
      setTotalXP(0);
      setPreviousProgress({});
      localStorage.removeItem("userXP");
      localStorage.removeItem("taskProgress");
    }
  };

  const handleReschedule = async (taskId: number) => {
    if (!authToken || !editDate) return;
    
    setError(null);
    try {
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ dueDate: editDate })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task date');
      }
      
      setEditingTaskId(null);
      setEditDate("");
      
      
      await fetchTasks(authToken);
    } catch (error) {
      setError("Failed to reschedule task. Please try again.");
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
  // Not needed since added levels
  const maxXP = 1000; // Maximum XP for the bar
  const xpPercentage = Math.min((totalXP / maxXP) * 100, 100);
  const xpInCurrentLevel = totalXP % 100;
//Used LLM for adding level up animations
  return (
    <div style={containerStyle}>
      {/* Level Up Celebration */}
      {showLevelUp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            animation: "fadeIn 0.3s ease-in",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "60px 80px",
              borderRadius: "20px",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              animation: "scaleIn 0.5s ease-out",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Confetti effect */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: "10px",
                  height: "10px",
                  backgroundColor: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"][i % 5],
                  top: "-20px",
                  left: `${Math.random() * 100}%`,
                  animation: `confettiFall ${1 + Math.random() * 2}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  borderRadius: "50%",
                }}
              />
            ))}
            
            <div style={{ fontSize: "80px", marginBottom: "20px" }}>🎉</div>
            <h2 style={{ fontSize: "48px", color: "#4CAF50", margin: "0 0 20px 0", fontWeight: "bold" }}>
              LEVEL UP!
            </h2>
            <p style={{ fontSize: "32px", color: "#333", margin: "0" }}>
              You've reached Level {newLevel}!
            </p>
            <p style={{ fontSize: "18px", color: "#666", marginTop: "20px" }}>
              Keep up the great work! 🌟
            </p>
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scaleIn {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          
          @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
          }
        `}
      </style>
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

        {/* XP Bar */}
        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <h2 style={{ fontSize: "24px", color: "#333", margin: "0 0 5px 0" }}>
                Level {currentLevel}
              </h2>
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                {xpInCurrentLevel} / 100 XP
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetXP}
              style={{
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              Reset XP
            </button>
          </div>
          <div
            style={{
              width: "100%",
              height: "30px",
              backgroundColor: "#e0e0e0",
              borderRadius: "15px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${xpInCurrentLevel}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)",
                transition: "width 0.5s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>
                {xpInCurrentLevel}%
              </span>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "#999", marginTop: "10px", marginBottom: 0 }}>
            Total XP: {totalXP}
          </p>
        </div>

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
            tasks.map((task) => {
              const isOverdue = !task.completed && isTaskOverdue(task.dueDate);
              
              return (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "15px",
                    backgroundColor: isOverdue ? "#ffebee" : "#fafafa",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${isOverdue ? "#f44336" : getCategoryColor(task.category)}`,
                    gap: "10px",
                    opacity: task.completed ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        flex: 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id, task.progress)}
                        aria-label={`Mark ${task.title} as ${
                          task.completed ? "incomplete" : "complete"
                        }`}
                        style={{ marginTop: "4px" }}
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
                          style={{ display: "flex", gap: "10px", fontSize: "14px", flexWrap: "wrap" }}
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
                            <span style={{ color: isOverdue ? "#f44336" : "#999", fontWeight: isOverdue ? "bold" : "normal" }}>
                              Due: {task.dueDate}
                            </span>
                          )}
                          {isOverdue && (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: "#f44336",
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              OVERDUE
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

                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      {!task.completed && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditDate(task.dueDate || "");
                          }}
                          style={{
                            backgroundColor: "#2196F3",
                            color: "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          📅 Reschedule
                        </button>
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
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingTaskId === task.id && (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        padding: "12px",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "8px",
                        border: "2px solid #2196F3",
                      }}
                    >
                      <label style={{ fontSize: "14px", fontWeight: "bold", color: "#1976D2" }}>
                        New Date:
                      </label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={{
                          padding: "8px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "2px solid #2196F3",
                          flex: 1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleReschedule(task.id)}
                        style={{
                          backgroundColor: "#4CAF50",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓ Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTaskId(null);
                          setEditDate("");
                        }}
                        style={{
                          backgroundColor: "#9e9e9e",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  )}

                  {!task.completed && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#666", minWidth: "40px" }}>
                        {task.progress}%
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={task.progress}
                        onChange={(e) => handleProgressChange(task.id, Number(e.target.value))}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}