"use client";

import { useRouter } from "next/navigation";
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
  const dismissTask = useTaskStore((state) => state.dismissTask);
  const setError = useTaskStore((state) => state.setError);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskCategory, setTaskCategory] = useState("personal");
  const [activeTab, setActiveTab] = useState<"all" | "overdue" | "active" | "completed">("all");
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [userXp, setUserXp] = useState((session?.user as any)?.xp ?? 0);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  const authToken = session?.session?.token;

  useEffect(() => {
    if (!authToken) return;
    fetchTasks(authToken).catch(() => {});
  }, [authToken, fetchTasks]);

  useEffect(() => {
    if (session?.user) {
      setUserXp((session.user as any)?.xp ?? 0);
    }
  }, [session]);

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
      setShowForm(false);
    } catch {}
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

  const filteredTasks = () => {
    if (activeTab === "overdue") return overdueTasks;
    if (activeTab === "active") return activeTasks;
    if (activeTab === "completed") return completedTasks;
    return tasks;
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
        background: '#161616',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #2a2a2a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              fontSize: '18px',
              fontWeight: '700',
              color: '#ffffff'
            }}>
              S
            </div>
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 7h6M7 11h6M7 15h4" strokeLinecap="round" />
            </svg>
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 14c0-1.5-1.5-3-4-3s-4 1.5-4 3M13 6c1.5 0 3 1.5 3 3s-1.5 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="6" r="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Friends
          </button>
        </nav>

        {/* User Section */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #2a2a2a'
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
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
                {userXp} XP
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            onMouseEnter={() => setHoveredButton('signout')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #2a2a2a',
              background: hoveredButton === 'signout' ? '#1a1a1a' : 'transparent',
              color: '#9ca3af',
              fontSize: '14px',
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
        padding: '32px 40px',
        width: '100%'
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
                  background: hoveredButton === 'create-task'
                    ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: hoveredButton === 'create-task' ? '0 8px 16px rgba(99, 102, 241, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.2)',
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
                background: activeTab === "all" ? '#1a1a1a' : (hoveredButton === 'tab-all' ? '#161616' : 'transparent'),
                color: activeTab === "all" ? '#eeeeee' : '#9ca3af',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("overdue")}
              onMouseEnter={() => setHoveredButton('tab-overdue')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === "overdue" ? '#1a1a1a' : (hoveredButton === 'tab-overdue' ? '#161616' : 'transparent'),
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
                background: activeTab === "active" ? '#1a1a1a' : (hoveredButton === 'tab-active' ? '#161616' : 'transparent'),
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
                background: activeTab === "completed" ? '#1a1a1a' : (hoveredButton === 'tab-completed' ? '#161616' : 'transparent'),
                color: activeTab === "completed" ? '#eeeeee' : '#9ca3af',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Completed
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
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9ca3af'
                  }}>Category</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9ca3af'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9ca3af'
                  }}>Due Date</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#9ca3af'
                  }}>Progress</th>
                  <th style={{ width: '100px', padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTasks ? (
                  <tr>
                    <td colSpan={7} style={{
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
                    <td colSpan={7} style={{
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
                        <div
                          onClick={async () => {
                            if (!authToken) return;
                            setError(null);
                            const wasCompleted = task.completed;
                            await toggleTask(task.id, authToken).catch(() => {});

                            // Calculate XP change
                            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            let xpChange = 10; // Default XP
                            if (dueDate) {
                              const due = new Date(dueDate);
                              due.setHours(0, 0, 0, 0);
                              if (today > due) {
                                xpChange = 5; // Late completion
                              }
                            }

                            // Add XP when completing, remove XP when uncompleting
                            if (!wasCompleted) {
                              setUserXp(prev => prev + xpChange);
                            } else {
                              setUserXp(prev => Math.max(0, prev - xpChange));
                            }
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: task.completed ? 'none' : '2px solid #4b5563',
                            background: task.completed ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
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
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
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
                        {formatDate(task.dueDate)}
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
                              const newProgress = Math.max(0, task.progress - 25);
                              updateTaskProgress(task.id, newProgress, authToken).catch(() => {});
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
                              const newProgress = Math.min(100, task.progress + 25);
                              updateTaskProgress(task.id, newProgress, authToken).catch(() => {});
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
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}>
                          {isOverdue(task) && !task.completed && (
                            <button
                              onClick={() => {
                                if (!authToken) return;
                                if (
                                  !confirm(
                                    "Dismiss this task? You'll lose 5 XP and 10 pet happiness.",
                                  )
                                )
                                  return;
                                setError(null);
                                dismissTask(task.id, authToken).catch(() => {});
                              }}
                              onMouseEnter={() => setHoveredButton(`dismiss-${task.id}`)}
                              onMouseLeave={() => setHoveredButton(null)}
                              style={{
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                border: 'none',
                                background: hoveredButton === `dismiss-${task.id}` ? '#1a1a1a' : 'transparent',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontSize: '14px'
                              }}
                            >
                              ✕
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (!authToken) return;
                              setError(null);
                              deleteTask(task.id, authToken).catch(() => {});
                            }}
                            onMouseEnter={() => setHoveredButton(`delete-${task.id}`)}
                            onMouseLeave={() => setHoveredButton(null)}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: 'none',
                              background: hoveredButton === `delete-${task.id}` ? '#1a1a1a' : 'transparent',
                              color: hoveredButton === `delete-${task.id}` ? '#fca5a5' : '#9ca3af',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M13 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
