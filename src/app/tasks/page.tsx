"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { useTaskStore } from "@/stores/taskStore";
import { Tooltip } from "@/components/Tooltip";
import { TasksIcon, FriendsIcon, PetIcon, SynapseLogo } from "@/components/icons";
import { SlidingNumber } from "@/components/SlidingNumber";

export default function TaskPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoadingTasks = useTaskStore((state) => state.isLoading);
  const taskError = useTaskStore((state) => state.error);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const updateTaskProgress = useTaskStore((state) => state.updateTaskProgress);
  const toggleTask = useTaskStore((state) => state.toggleTask);
  const setError = useTaskStore((state) => state.setError);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskCategory, setTaskCategory] = useState("personal");
  const [activeTab, setActiveTab] = useState<"all" | "overdue" | "active" | "completed">("all");
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [userXp, setUserXp] = useState((session?.user as any)?.xp ?? 0);
  const [activeTimer, setActiveTimer] = useState<{
    id: string;
    taskid: string;
    startedat: string;
    title: string;
    category: string;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [taskTimes, setTaskTimes] = useState<{ [key: string]: number }>({});
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [tempDueDate, setTempDueDate] = useState<string>("");
  const [sortField, setSortField] = useState<"progress" | "dueDate" | "status" | "category" | null>("status");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  const authToken = session?.session?.token;

  useEffect(() => {
    if (!authToken) return;
    fetchTasks(authToken).catch(() => { });
  }, [authToken, fetchTasks]);

  useEffect(() => {
    if (session?.user) {
      setUserXp((session.user as any)?.xp ?? 0);
    }
  }, [session]);

  // Fetch active timer and total times on mount
  useEffect(() => {
    if (!authToken) return;
    fetchActiveTimer();
    fetchTotalTimes();
  }, [authToken]);

  const fetchTotalTimes = async () => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/tasks/timer/total", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTaskTimes(data.timeByTask);
      }
    } catch (err) {
      console.error("Failed to fetch total times", err);
    }
  };

  // Update elapsed time every second
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeTimer.startedat).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchActiveTimer = async () => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/tasks/timer/active", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveTimer(data.activeTimer);
      }
    } catch (err) {
      console.error("Failed to fetch active timer", err);
    }
  };

  const startTimer = async (taskId: string) => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/tasks/timer/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ taskId }),
      });

      if (response.ok) {
        await fetchActiveTimer();
      }
    } catch (err) {
      console.error("Failed to start timer", err);
    }
  };

  const stopTimer = async () => {
    if (!authToken) return;
    try {
      const response = await fetch("/api/tasks/timer/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update pet happiness in UI
        if (session?.user) {
          const currentHappiness = (session.user as any)?.petHappiness ?? 100;
          const newHappiness = Math.min(currentHappiness + data.carePoints, 100);
          // Update session would require refetch, so we'll just refetch active timer
        }
        setActiveTimer(null);
        setElapsedTime(0);
        // Refresh total times after stopping
        await fetchTotalTimes();
      }
    } catch (err) {
      console.error("Failed to stop timer", err);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDueDateEdit = (taskId: string, currentDate: string | null) => {
    setEditingDueDate(taskId);
    setTempDueDate(currentDate || "");
  };

  const handleDueDateSave = async (taskId: string) => {
    if (!authToken) return;
    try {
      await updateTask(taskId, { dueDate: tempDueDate || null }, authToken);
      setEditingDueDate(null);
      setTempDueDate("");
    } catch (err) {
      console.error("Failed to update due date", err);
    }
  };

  const handleDueDateCancel = () => {
    setEditingDueDate(null);
    setTempDueDate("");
  };

  /********** delete task */
  const handleDeleteTask = async (task: typeof tasks[0]) => {
    if (!authToken) return;

    try {
      setError(null);

      // Figure out how much XP this task is worth (same logic as toggle)
      let xpChange = 0;
      if (task.completed) {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        xpChange = 10; // default on-time / no due date
        if (dueDate) {
          const due = new Date(dueDate);
          due.setHours(0, 0, 0, 0);
          if (today > due) {
            xpChange = 5; // late
          }
        }
      }

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        // Update XP in UI: deleting a completed task removes its XP
        if (task.completed && xpChange > 0) {
          setUserXp((prev: number) => Math.max(0, prev - xpChange));
        }

        // Refresh tasks so the deleted one disappears
        await fetchTasks(authToken);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task", err);
      setError("Failed to delete task");
    }
  };
  /********** delete task */

  const handleAddTask = async () => {
    if (taskTitle.trim() === "") return;
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
          progress: 0,
        },
        authToken,
      );

      setTaskTitle("");
      setTaskDate("");
      setTaskCategory("personal");
    } catch { }
  };

  const isOverdue = (task: typeof tasks[0]) => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const overdueTasks = tasks.filter(isOverdue);
  const activeTasks = tasks.filter((t) => !t.completed && !isOverdue(t));
  const completedTasks = tasks.filter((t) => t.completed);

  const handleSort = (field: "progress" | "dueDate" | "status" | "category") => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusValue = (task: typeof tasks[0]) => {
    if (task.completed) return 3; // Done last
    if (isOverdue(task)) return 1; // Overdue first
    return 2; // In progress middle
  };

  const sortTasks = (tasksToSort: typeof tasks) => {
    // Default sort by status if no sort field selected
    const fieldToSort = sortField || "status";

    return [...tasksToSort].sort((a, b) => {
      let comparison = 0;

      switch (fieldToSort) {
        case "progress":
          comparison = a.progress - b.progress;
          break;
        case "dueDate":
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case "status":
          comparison = getStatusValue(a) - getStatusValue(b);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const filteredTasks = () => {
    let filtered;
    if (activeTab === "overdue") filtered = overdueTasks;
    else if (activeTab === "active") filtered = activeTasks;
    else if (activeTab === "completed") filtered = completedTasks;
    else filtered = tasks;

    return sortTasks(filtered);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', text: '#a5b4fc' },
      work: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#c4b5fd' },
      health: { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)', text: '#f9a8d4' },
      study: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#93c5fd' }
    };
    return colors[category as keyof typeof colors] || colors.personal;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (isPending) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#121212',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
      color: '#eeeeee',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#121212',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SynapseLogo />
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#eeeeee' }}>
              Synapse
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{
          flex: 1,
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#1a1a1a',
              color: '#eeeeee',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <TasksIcon active={true} />
            Tasks
          </button>
          <button
            onClick={() => router.push('/friends')}
            onMouseEnter={() => setHoveredButton('friends')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: hoveredButton === 'friends' ? '#1a1a1a' : 'transparent',
              color: '#9ca3af',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <FriendsIcon active={false} />
            Friends
          </button>
          <button
            onClick={() => router.push('/pet')}
            onMouseEnter={() => setHoveredButton('pet')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: hoveredButton === 'pet' ? '#1a1a1a' : 'transparent',
              color: '#9ca3af',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <PetIcon active={false} />
            Pet
          </button>

        </nav>

        {/* User Section */}
        <div style={{
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#4972e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#eeeeee',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {session.user.name || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#888888',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                @{(session.user as any).username || 'username'}
              </div>
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#a5b4fc',
              whiteSpace: 'nowrap'
            }}>
              {userXp} XP
            </div>
          </div>
          <button
            onClick={handleSignOut}
            onMouseEnter={() => setHoveredButton('signout')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: hoveredButton === 'signout' ? '#7f1d1d' : '#991b1b',
              color: '#fca5a5',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: '260px',
        flex: 1,
        padding: '16px',
        width: '100%'
      }}>
        <div style={{
          background: '#161616',
          borderRadius: '24px',
          padding: '20px 28px',
          minHeight: 'calc(100vh - 32px)'
        }}>
          {/* Error */}
          {taskError && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              fontSize: '14px'
            }}>
              {taskError}
            </div>
          )}

          {/* Add Task Section */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#eeeeee',
              marginBottom: '20px'
            }}>
              Create New Task
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <input
                type="text"
                placeholder="What do you need to do?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  background: '#161616',
                  color: '#eeeeee',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2a2a2a';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #2a2a2a',
                    background: '#161616',
                    color: '#eeeeee',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#2a2a2a';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #2a2a2a',
                    background: '#161616',
                    color: '#eeeeee',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#2a2a2a';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="study">Study</option>
                </select>
                <button
                  onClick={handleAddTask}
                  onMouseEnter={() => setHoveredButton('create-task')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: hoveredButton === 'create-task' ? '#91aaed' : '#4972e1',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: hoveredButton === 'create-task' ? '0 8px 16px rgba(73, 114, 225, 0.3)' : '0 4px 12px rgba(73, 114, 225, 0.2)',
                    transform: hoveredButton === 'create-task' ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>

          {/* Tabs and Actions */}
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab("all")}
                onMouseEnter={() => setHoveredButton('tab-all')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === "all" ? '#2a2a2a' : (hoveredButton === 'tab-all' ? '#1a1a1a' : 'transparent'),
                  color: activeTab === "all" ? '#eeeeee' : '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                All
                {tasks.length > 0 && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(156, 163, 175, 0.2)',
                    color: '#9ca3af',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {tasks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("overdue")}
                onMouseEnter={() => setHoveredButton('tab-overdue')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === "overdue" ? '#2a2a2a' : (hoveredButton === 'tab-overdue' ? '#1a1a1a' : 'transparent'),
                  color: activeTab === "overdue" ? '#eeeeee' : '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Overdue
                {overdueTasks.length > 0 && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {overdueTasks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("active")}
                onMouseEnter={() => setHoveredButton('tab-active')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === "active" ? '#2a2a2a' : (hoveredButton === 'tab-active' ? '#1a1a1a' : 'transparent'),
                  color: activeTab === "active" ? '#eeeeee' : '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Active
                {activeTasks.length > 0 && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {activeTasks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                onMouseEnter={() => setHoveredButton('tab-completed')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === "completed" ? '#2a2a2a' : (hoveredButton === 'tab-completed' ? '#1a1a1a' : 'transparent'),
                  color: activeTab === "completed" ? '#eeeeee' : '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Completed
                {completedTasks.length > 0 && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#6ee7b7',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {completedTasks.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{
            borderRadius: '12px',
            border: '1px solid #2a2a2a',
            background: '#161616',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#1a1a1a' }}>
                  <tr>
                    <th style={{ width: '48px', padding: '12px 16px' }}></th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#9ca3af'
                    }}>Task</th>
                    <th
                      onClick={() => handleSort("category")}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: sortField === "category" ? '#eeeeee' : '#9ca3af',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Category
                        {sortField === "category" && (
                          <span style={{ fontSize: '10px' }}>
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: sortField === "status" ? '#eeeeee' : '#9ca3af',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Status
                        {sortField === "status" && (
                          <span style={{ fontSize: '10px' }}>
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("dueDate")}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: sortField === "dueDate" ? '#eeeeee' : '#9ca3af',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Due Date
                        {sortField === "dueDate" && (
                          <span style={{ fontSize: '10px' }}>
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("progress")}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: sortField === "progress" ? '#eeeeee' : '#9ca3af',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        Progress
                        {sortField === "progress" && (
                          <span style={{ fontSize: '10px' }}>
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#9ca3af'
                    }}>Timer</th>
                    <th style={{ width: '50px', padding: '12px 16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingTasks ? (
                    <tr>
                      <td colSpan={8} style={{
                        padding: '48px',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '14px'
                      }}>
                        Loading tasks...
                      </td>
                    </tr>
                  ) : filteredTasks().length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{
                        padding: '48px',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '14px'
                      }}>
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks().map((task) => (
                      <tr
                        key={task.id}
                        onMouseEnter={() => setHoveredRow(task.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          borderTop: '1px solid #2a2a2a',
                          background: hoveredRow === task.id ? '#1a1a1a' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <Tooltip text="Mark as Complete">
                            <div
                              onClick={async () => {
                                if (!authToken) return;
                                setError(null);
                                const wasCompleted = task.completed;
                                await toggleTask(task.id, authToken).catch(() => { });

                                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                let xpChange = 10;
                                if (dueDate) {
                                  const due = new Date(dueDate);
                                  due.setHours(0, 0, 0, 0);
                                  if (today > due) {
                                    xpChange = 5;
                                  }
                                }

                                if (!wasCompleted) {
                                  setUserXp((prev: number) => prev + xpChange);
                                } else {
                                  setUserXp((prev: number) => Math.max(0, prev - xpChange));
                                }
                              }}
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                border: task.completed ? 'none' : '2px solid #4b5563',
                                background: task.completed ? '#4972e1' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                if (!task.completed) {
                                  e.currentTarget.style.borderColor = '#6366f1';
                                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!task.completed) {
                                  e.currentTarget.style.borderColor = '#4b5563';
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              {task.completed && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                                  <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </Tooltip>
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontWeight: '500',
                          color: '#eeeeee',
                          fontSize: '14px'
                        }}>
                          {task.title}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: getCategoryColor(task.category).bg,
                            border: `1px solid ${getCategoryColor(task.category).border}`,
                            fontSize: '12px',
                            color: getCategoryColor(task.category).text,
                            textTransform: 'capitalize',
                            fontWeight: '500'
                          }}>
                            {task.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {task.completed ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              color: '#6ee7b7',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 8 8"
                                fill="currentColor"
                                style={{ marginRight: '6px' }}
                              >
                                <circle cx="4" cy="4" r="4" />
                              </svg>
                              Done
                            </span>
                          ) : isOverdue(task) ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(216, 64, 64, 0.2)',
                              border: '0.5px solid rgba(216, 64, 64, 0.6)',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 8 8"
                                fill="currentColor"
                                style={{ marginRight: '6px' }}
                              >
                                <circle cx="4" cy="4" r="4" />
                              </svg>
                              Overdue
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(251, 191, 36, 0.1)',
                              border: '1px solid rgba(251, 191, 36, 0.3)',
                              color: '#fcd34d',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 8 8"
                                fill="currentColor"
                                style={{ marginRight: '6px' }}
                              >
                                <circle cx="4" cy="4" r="4" />
                              </svg>
                              In Progress
                            </span>
                          )}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          color: '#9ca3af',
                          fontSize: '14px'
                        }}>
                          {editingDueDate === task.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="date"
                                value={tempDueDate}
                                onChange={(e) => setTempDueDate(e.target.value)}
                                onBlur={() => handleDueDateSave(task.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleDueDateSave(task.id);
                                  if (e.key === 'Escape') handleDueDateCancel();
                                }}
                                autoFocus
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #2a2a2a',
                                  background: '#161616',
                                  color: '#eeeeee',
                                  fontSize: '13px',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{formatDate(task.dueDate)}</span>
                              <Tooltip text="Edit due date">
                                <button
                                  onClick={() => handleDueDateEdit(task.id, task.dueDate)}
                                  onMouseEnter={() => setHoveredButton(`edit-date-${task.id}`)}
                                  onMouseLeave={() => setHoveredButton(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                    transform: hoveredButton === `edit-date-${task.id}` ? 'scale(1.1)' : 'scale(1)'
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="#edcc91" d="M7.243 22H3a1 1 0 0 1-1-1v-4.243a1 1 0 0 1 .293-.707l13.76-13.757a1 1 0 0 1 1.414 0l4.24 4.24a1 1 0 0 1 0 1.414L7.95 21.707a1 1 0 0 1-.707.293Z"></path>
                                    <path fill="#e1aa49" d="m21.707 6.533-4.24-4.24a1 1 0 0 0-1.414 0L12.515 5.83l5.655 5.653 3.537-3.536a1 1 0 0 0 0-1.414Z"></path>
                                  </svg>
                                </button>
                              </Tooltip>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'flex-end'
                          }}>
                            <button
                              onClick={() => {
                                if (!authToken) return;
                                setError(null);
                                const newProgress = Math.max(0, task.progress - 10);
                                updateTaskProgress(task.id, newProgress, authToken).catch(() => { });
                              }}
                              onMouseEnter={() => setHoveredButton(`dec-${task.id}`)}
                              onMouseLeave={() => setHoveredButton(null)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid #2a2a2a',
                                background: hoveredButton === `dec-${task.id}` ? '#1a1a1a' : 'transparent',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '600'
                              }}
                            >
                              −
                            </button>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <div style={{
                                width: '100px',
                                height: '8px',
                                background: '#1a1a1a',
                                borderRadius: '999px',
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${task.progress}%`,
                                  background: task.progress === 100
                                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                    : task.progress >= 75
                                      ? 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                                      : task.progress >= 50
                                        ? 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)'
                                        : 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <span style={{
                                fontSize: '13px',
                                color: '#eeeeee',
                                width: '40px',
                                textAlign: 'right',
                                fontWeight: '500'
                              }}>
                                {task.progress}%
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (!authToken) return;
                                setError(null);
                                const newProgress = Math.min(100, task.progress + 10);
                                updateTaskProgress(task.id, newProgress, authToken).catch(() => { });
                              }}
                              onMouseEnter={() => setHoveredButton(`inc-${task.id}`)}
                              onMouseLeave={() => setHoveredButton(null)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid #2a2a2a',
                                background: hoveredButton === `inc-${task.id}` ? '#1a1a1a' : 'transparent',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '600'
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '500',
                              color: '#9ca3af',
                              fontFamily: '"SF Mono", "Roboto Mono", "Consolas", monospace',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              letterSpacing: '0.5px'
                            }}>
                              {(() => {
                                const baseTime = taskTimes[task.id] || 0;
                                const currentTime = activeTimer?.taskid === task.id ? baseTime + elapsedTime : baseTime;
                                return (
                                  <>
                                    <SlidingNumber value={Math.floor(currentTime / 60)} padStart />
                                    <span>:</span>
                                    <SlidingNumber value={currentTime % 60} padStart />
                                  </>
                                );
                              })()}
                            </div>
                            {activeTimer?.taskid === task.id ? (
                              <Tooltip text="Click to stop timer">
                                <button
                                  onClick={stopTimer}
                                  onMouseEnter={() => setHoveredButton(`stop-timer-${task.id}`)}
                                  onMouseLeave={() => setHoveredButton(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                    transform: hoveredButton === `stop-timer-${task.id}` ? 'scale(1.15)' : 'scale(1)'
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="#f472b6" d="M16 22a3.003 3.003 0 0 1-3-3V5a3 3 0 0 1 6 0v14a3.003 3.003 0 0 1-3 3zm-8 0a3.003 3.003 0 0 1-3-3V5a3 3 0 0 1 6 0v14a3.003 3.003 0 0 1-3 3z"></path>
                                  </svg>
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip text={activeTimer ? "Another timer is running" : "Click to start timer"}>
                                <button
                                  onClick={() => startTimer(task.id)}
                                  disabled={!!activeTimer}
                                  onMouseEnter={() => setHoveredButton(`start-timer-${task.id}`)}
                                  onMouseLeave={() => setHoveredButton(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: activeTimer ? 'not-allowed' : 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                    transform: !activeTimer && hoveredButton === `start-timer-${task.id}` ? 'scale(1.15)' : 'scale(1)',
                                    opacity: activeTimer ? 0.3 : 1
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="#34d399" d="M7.168 21.002a3.428 3.428 0 0 1-3.416-3.42V6.418a3.416 3.416 0 0 1 5.124-2.958l9.664 5.581a3.416 3.416 0 0 1 0 5.916l-9.664 5.581a3.41 3.41 0 0 1-1.708.463Z"></path>
                                  </svg>
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <Tooltip text="Delete task">
                            <button
                              onClick={() => handleDeleteTask(task)}
                              onMouseEnter={() => setHoveredButton(`delete-${task.id}`)}
                              onMouseLeave={() => setHoveredButton(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                transition: 'all 0.2s ease',
                                transform: hoveredButton === `delete-${task.id}` ? 'scale(1.15)' : 'scale(1)'
                              }}
                            >
                              {/* simple trash icon */}
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" style={{ marginTop: '5px' }}>
                                <path
                                  fill="#fca5a5"
                                  d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v11a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 4a1 1 0 0 0-1 1v9a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v9a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1z"
                                />
                              </svg>
                            </button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
