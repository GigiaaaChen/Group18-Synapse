"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { useGoalStore } from "@/stores/goalStore";
import { Tooltip } from "@/components/Tooltip";
import { TasksIcon, FriendsIcon, PetIcon, GoalsIcon, SynapseLogo } from "@/components/icons";
import { SlidingNumber } from "@/components/SlidingNumber";

export default function GoalsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const userXpFromSession = (session?.user as any)?.xp ?? 0;

  const goals = useGoalStore((s) => s.goals);
  const occurrences = useGoalStore((s) => s.occurrences);
  const fetchGoals = useGoalStore((s) => s.fetchGoals);
  const createGoal = useGoalStore((s) => s.createGoal);
  const completeOccurrence = useGoalStore((s) => s.completeOccurrence);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);

  const isLoadingGoals = useGoalStore((s) => s.isLoading);
  const [userXp, setUserXp] = useState(userXpFromSession);

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // -------------------------
  // CREATE GOAL FORM STATE
  // -------------------------
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("personal");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [repeatDay, setRepeatDay] = useState<number>(0); // Sunday default
  const [endDate, setEndDate] = useState("");

  // -------------------------
  // PAGE TABS
  // -------------------------
  const [activeTab, setActiveTab] = useState<"inprogress" | "completed">("inprogress");

  // -------------------------------------
  // AUTH + FETCH GOALS ON PAGE LOAD
  // -------------------------------------
  const authToken = session?.session?.token;

  useEffect(() => {
    if (!isPending && !session) router.push("/signin");
  }, [isPending, session, router]);

  useEffect(() => {
    if (!authToken) return;
    fetchGoals(authToken);
  }, [authToken, fetchGoals]);

  useEffect(() => {
    if (session?.user) {
      setUserXp((session.user as any)?.xp ?? 0);
    }
  }, [session]);

  // -------------------------
  // HELPERS
  // -------------------------

  const todayDate = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeekStartSunday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day); // back to Sunday
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatCountdown = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr).getTime();
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m ${secs}s`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: { bg: "rgba(99, 102, 241, 0.1)", border: "rgba(99, 102, 241, 0.3)", text: "#a5b4fc" },
      work:     { bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.3)", text: "#c4b5fd" },
      health:   { bg: "rgba(236, 72, 153, 0.1)", border: "rgba(236, 72, 153, 0.3)", text: "#f9a8d4" },
      study:    { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)", text: "#93c5fd" }
    };
    return colors[category as keyof typeof colors] || colors.personal;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  // -------------------------
  // CREATE GOAL HANDLER
  // -------------------------
  const handleAddGoal = async () => {
    if (!goalTitle.trim() || !endDate) return;
    if (!authToken) return router.push("/signin");

    const draft = {
      title: goalTitle.trim(),
      category: goalCategory,
      frequency,
      endDate,
      repeatDay: frequency === "weekly" ? repeatDay : null
    };

    await createGoal(draft, authToken);

    setGoalTitle("");
    setGoalCategory("personal");
    setFrequency("daily");
    setRepeatDay(0);
    setEndDate("");
  };

  // -------------------------
  // RENDER
  // -------------------------
  if (isPending) {
    return (
      <div style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#121212",
        color: "#9ca3af",
        fontSize: "14px"
      }}>
        Loading...
      </div>
    );
  }

  if (!session) return null;

  // Filter occurrences by status
  const now = new Date();
  const activeOccurrences = occurrences.filter((occ) =>
    new Date(occ.deadline) >= now && !occ.completed
  );

  const completedOccurrencesByGoal = goals.map((goal) => {
    const goalOccs = occurrences.filter((o) => o.goalId === goal.id);
    const total = goalOccs.length;
    const completed = goalOccs.filter((o) => o.completed).length;
    const allExpired = goalOccs.every((o) => new Date(o.deadline) < now);

    return { goal, total, completed, allExpired };
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#121212",
      color: "#eeeeee",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex"
    }}>
      {/* -------------------------------- */}
      {/* SIDEBAR (identical to Tasks)     */}
      {/* -------------------------------- */}
      <aside style={{
        width: "260px",
        background: "#121212",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        left: 0,
        top: 0
      }}>
        <div style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <SynapseLogo />
            <span style={{ fontSize: "22px", fontWeight: "700", color: "#eeeeee" }}>Synapse</span>
          </div>
        </div>

        <nav style={{
          flex: 1,
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <button
            onClick={() => router.push("/tasks")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <TasksIcon active={false} />
            Tasks
          </button>

          <button
            onClick={() => router.push("/friends")}
            onMouseEnter={() => setHoveredButton("friends")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              background: hoveredButton === "friends" ? "#1a1a1a" : "transparent",
              color: "#9ca3af",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <FriendsIcon active={false} />
            Friends
          </button>

          <button
            onClick={() => router.push("/pet")}
            onMouseEnter={() => setHoveredButton("pet")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              background: hoveredButton === "pet" ? "#1a1a1a" : "transparent",
              color: "#9ca3af",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <PetIcon active={false} />
            Pet
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#1a1a1a",
              color: "#eeeeee",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            <GoalsIcon active={true} />
            Goals
          </button>
        </nav>

        {/* USER SECTION */}
        <div style={{ padding: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#4972e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "600",
              color: "#fff"
            }}>
              {(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#eeeeee",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {session.user.name || "User"}
              </div>
              <div style={{
                fontSize: "12px",
                color: "#888",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                @{(session.user as any).username || "username"}
              </div>
            </div>

            <div style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#a5b4fc"
            }}>
              {userXp} XP
            </div>
          </div>

          <button
            onClick={handleSignOut}
            onMouseEnter={() => setHoveredButton("signout")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "none",
              background: hoveredButton === "signout" ? "#7f1d1d" : "#991b1b",
              color: "#fca5a5",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{
        marginLeft: "260px",
        flex: 1,
        padding: "16px",
        width: "100%"
      }}>
        <div style={{
          background: "#161616",
          borderRadius: "24px",
          padding: "20px 28px",
          minHeight: "calc(100vh - 32px)"
        }}>

          {/* CREATE NEW GOAL */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#eee",
              marginBottom: "8px"
            }}>
              Create New Goal
            </h2>

            <p style={{ color: "#9ca3af", marginBottom: "20px", fontSize: "14px" }}>
              What's your goal?
            </p>

            <div style={{ display: "grid", gap: "16px" }}>
              {/* TITLE */}
              <input
                type="text"
                placeholder="Goal name"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  border: "1px solid #2a2a2a",
                  background: "#161616",
                  color: "#eee",
                  fontSize: "15px",
                  outline: "none"
                }}
              />

              {/* GRID OF SELECT INPUTS */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px"
              }}>

                {/* FREQUENCY */}
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    border: "1px solid #2a2a2a",
                    background: "#161616",
                    color: "#eee",
                    fontSize: "14px"
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>

                {/* REPEAT DAY (only visible for weekly) */}
                {frequency === "weekly" && (
                  <select
                    value={repeatDay}
                    onChange={(e) => setRepeatDay(Number(e.target.value))}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "8px",
                      border: "1px solid #2a2a2a",
                      background: "#161616",
                      color: "#eee",
                      fontSize: "14px"
                    }}
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                )}

                {/* END DATE */}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    border: "1px solid #2a2a2a",
                    background: "#161616",
                    color: "#eee",
                    fontSize: "14px"
                  }}
                />

                {/* CATEGORY */}
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    border: "1px solid #2a2a2a",
                    background: "#161616",
                    color: "#eee",
                    fontSize: "14px"
                  }}
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="study">Study</option>
                </select>

                {/* ADD BUTTON */}
                <button
                  onClick={handleAddGoal}
                  onMouseEnter={() => setHoveredButton("create-goal")}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: hoveredButton === "create-goal" ? "#91aaed" : "#4972e1",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow:
                      hoveredButton === "create-goal"
                        ? "0 8px 16px rgba(73,114,225,0.3)"
                        : "0 4px 12px rgba(73,114,225,0.2)",
                    transform:
                      hoveredButton === "create-goal" ? "translateY(-1px)" : "translateY(0)"
                  }}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
          {/* -------------------------------- */}
          {/* TABS (In Progress / Completed)   */}
          {/* -------------------------------- */}
          <div style={{
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <button
              onClick={() => setActiveTab("inprogress")}
              onMouseEnter={() => setHoveredButton("tab-inprogress")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: activeTab === "inprogress"
                  ? "#2a2a2a"
                  : hoveredButton === "tab-inprogress"
                    ? "#1a1a1a"
                    : "transparent",
                color: activeTab === "inprogress" ? "#eee" : "#9ca3af",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              In Progress
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              onMouseEnter={() => setHoveredButton("tab-completed")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: activeTab === "completed"
                  ? "#2a2a2a"
                  : hoveredButton === "tab-completed"
                    ? "#1a1a1a"
                    : "transparent",
                color: activeTab === "completed" ? "#eee" : "#9ca3af",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Completed
            </button>
          </div>

          {/* -------------------------------- */}
          {/* IN-PROGRESS TABLE START          */}
          {/* -------------------------------- */}
          {activeTab === "inprogress" && (
            <div style={{
              borderRadius: "12px",
              border: "1px solid #2a2a2a",
              background: "#161616",
              overflow: "hidden",
              marginBottom: "32px"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#1a1a1a" }}>
                    <tr>
                      <th style={{ width: "48px", padding: "12px 16px" }}></th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>Goal</th>

                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>Category</th>

                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>Deadline</th>

                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>Countdown</th>

                      <th style={{ width: "60px", padding: "12px 16px" }}></th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoadingGoals ? (
                      <tr>
                        <td colSpan={6} style={{
                          padding: "48px",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: "14px"
                        }}>
                          Loading goals...
                        </td>
                      </tr>
                    ) : activeOccurrences.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{
                          padding: "48px",
                          textAlign: "center",
                          color: "#9ca3af"
                        }}>
                          No active goals.
                        </td>
                      </tr>
                    ) : (
                      activeOccurrences.map((occ) => {
                        const goal = goals.find((g) => g.id === occ.goalId);
                        if (!goal) return null;

                        const categoryStyle = getCategoryColor(goal.category);
                        const countdown = formatCountdown(occ.deadline);

                        return (
                          <tr
                            key={occ.id}
                            onMouseEnter={() => setHoveredRow(occ.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            style={{
                              borderTop: "1px solid #2a2a2a",
                              background:
                                hoveredRow === occ.id ? "#1a1a1a" : "transparent",
                              transition: "background 0.15s ease"
                            }}
                          >
                            {/* COMPLETE CHECKBOX */}
                            <td style={{ padding: "12px 16px" }}>
                              <Tooltip text="Mark complete">
                                <div
                                  onClick={async () => {
                                    if (occ.completed) return;
                                    if (!authToken) return;

                                    await completeOccurrence(goal.id, occ.id, authToken);

                                    // Add XP client-side for instant visual update
                                    setUserXp((xp) =>
                                      xp + (goal.frequency === "daily" ? 10 : 100)
                                    );
                                  }}
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "6px",
                                    border: occ.completed
                                      ? "none"
                                      : "2px solid #4b5563",
                                    background: occ.completed ? "#4972e1" : "transparent",
                                    cursor: occ.completed ? "default" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  {occ.completed && (
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 12 12"
                                      stroke="white"
                                      strokeWidth="2"
                                      fill="none"
                                    >
                                      <path d="M2 6l3 3 5-6" />
                                    </svg>
                                  )}
                                </div>
                              </Tooltip>
                            </td>

                            {/* GOAL NAME */}
                            <td style={{
                              padding: "12px 16px",
                              fontSize: "14px",
                              color: "#eee",
                              fontWeight: "500"
                            }}>
                              {goal.title}
                            </td>

                            {/* CATEGORY BADGE */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                background: categoryStyle.bg,
                                border: `1px solid ${categoryStyle.border}`,
                                fontSize: "12px",
                                color: categoryStyle.text,
                                fontWeight: "500",
                                textTransform: "capitalize"
                              }}>
                                {goal.category}
                              </span>
                            </td>

                            {/* DEADLINE */}
                            <td style={{
                              padding: "12px 16px",
                              color: "#9ca3af",
                              fontSize: "14px"
                            }}>
                              {new Date(occ.deadline).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                              })}
                            </td>

                            {/* COUNTDOWN */}
                            <td style={{
                              padding: "12px 16px",
                              color: "#eee",
                              fontFamily: '"SF Mono", monospace',
                              fontSize: "14px"
                            }}>
                              {countdown}
                            </td>

                            {/* DELETE BUTTON */}
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <Tooltip text="Delete goal">
                                <button
                                  onClick={() => deleteGoal(goal.id, authToken!)}
                                  onMouseEnter={() => setHoveredButton(`delete-${goal.id}`)}
                                  onMouseLeave={() => setHoveredButton(null)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    transform:
                                      hoveredButton === `delete-${goal.id}`
                                        ? "scale(1.15)"
                                        : "scale(1)",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#f87171"
                                    strokeWidth="2"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                  </svg>
                                </button>
                              </Tooltip>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------- */}
          {/* COMPLETED TAB                    */}
          {/* -------------------------------- */}
          {activeTab === "completed" && (
            <div style={{
              borderRadius: "12px",
              border: "1px solid #2a2a2a",
              background: "#161616",
              overflow: "hidden",
              marginBottom: "32px"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#1a1a1a" }}>
                    <tr>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>
                        Goal
                      </th>

                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>
                        Category
                      </th>

                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>
                        End Date
                      </th>

                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        color: "#9ca3af"
                      }}>
                        Completions
                      </th>

                      <th style={{ width: "60px" }}></th>
                    </tr>
                  </thead>

                  <tbody>
                    {completedOccurrencesByGoal.filter((g) => g.allExpired).length === 0 ? (
                      <tr>
                        <td colSpan={5}
                          style={{
                            padding: "48px",
                            textAlign: "center",
                            color: "#9ca3af"
                          }}>
                          No completed goals.
                        </td>
                      </tr>
                    ) : (
                      completedOccurrencesByGoal
                        .filter((g) => g.allExpired)
                        .map(({ goal, total, completed }) => {
                          const categoryStyle = getCategoryColor(goal.category);

                          return (
                            <tr key={goal.id}
                              onMouseEnter={() => setHoveredRow(goal.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                              style={{
                                borderTop: "1px solid #2a2a2a",
                                background:
                                  hoveredRow === goal.id ? "#1a1a1a" : "transparent",
                                transition: "all 0.2s"
                              }}
                            >
                              {/* GOAL NAME */}
                              <td style={{
                                padding: "12px 16px",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#eee"
                              }}>
                                {goal.title}
                              </td>

                              {/* CATEGORY */}
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: categoryStyle.bg,
                                  border: `1px solid ${categoryStyle.border}`,
                                  color: categoryStyle.text,
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  textTransform: "capitalize"
                                }}>
                                  {goal.category}
                                </span>
                              </td>

                              {/* END DATE */}
                              <td style={{
                                padding: "12px 16px",
                                color: "#9ca3af",
                                fontSize: "14px"
                              }}>
                                {new Date(goal.endDate!).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </td>

                              {/* COMPLETIONS */}
                              <td style={{
                                padding: "12px 16px",
                                color: "#eee",
                                fontSize: "14px",
                                fontWeight: "600"
                              }}>
                                {completed} / {total}
                              </td>

                              {/* DELETE */}
                              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                <button
                                  onClick={() => deleteGoal(goal.id, authToken!)}
                                  onMouseEnter={() => setHoveredButton(`delete-${goal.id}`)}
                                  onMouseLeave={() => setHoveredButton(null)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    transform:
                                      hoveredButton === `delete-${goal.id}`
                                        ? "scale(1.15)"
                                        : "scale(1)",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#f87171"
                                    strokeWidth="2"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
