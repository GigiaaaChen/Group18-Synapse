"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import {
  TasksIcon,
  FriendsIcon,
  PetIcon,
  SynapseLogo,
  HistoryIcon,
} from "@/components/icons";
import type { Task } from "@/types/history";
import { useUserXp } from "@/hooks/useUserXp";
import { usePetData } from "@/hooks/usePetData";
import { PetDisplay } from "@/components/pet/PetDisplay";
import { HappinessIcon } from "@/components/pet/PetIcons";

interface LevelBreakdown {
  level: number;
  startXP: number;
  endXP: number;
  tasks: Task[];
  totalXP: number;
  totalCoins: number;
}

export default function HistoryPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const userXp = useUserXp();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const petData = usePetData();

  useEffect(() => {
    if (!isPending && !session) router.push("/signin");
  }, [session, isPending, router]);

  const authToken = session?.session?.token;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!authToken) return;

      setLoading(true);
      try {
        const res = await fetch("/api/history", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) {
          console.error("Failed to fetch history", await res.text());
          return;
        }
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [authToken]);

  if (isPending && !session) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
          color: "#9ca3af",
          fontSize: "14px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userInitial = useMemo(
    () =>
      (
        session?.user?.name?.[0] ||
        session?.user?.email?.[0] ||
        "U"
      ).toUpperCase(),
    [session?.user]
  );

  // Filter tasks by date range
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const t = new Date(task.completedAt).getTime();
      const afterStart = startDate ? t >= new Date(startDate).getTime() : true;
      const beforeEnd = endDate ? t <= new Date(endDate).getTime() : true;
      return afterStart && beforeEnd;
    });
  }, [tasks, startDate, endDate]);

  // Group tasks by level
  const levelBreakdowns: LevelBreakdown[] = useMemo(() => {
    if (filteredTasks.length === 0) return [];

    const breakdowns: LevelBreakdown[] = [];
    let runningXP = 0;
    let currentLevel = 1;
    let currentLevelTasks: Task[] = [];
    let currentLevelStartXP = 0;

    filteredTasks.forEach((task) => {
      const newXP = runningXP + task.xpAwarded;
      const newLevel = Math.floor(newXP / 100) + 1;

      currentLevelTasks.push(task);
      runningXP = newXP;

      // If we leveled up, save the previous level breakdown
      if (newLevel > currentLevel) {
        const totalXP = currentLevelTasks.reduce((sum, t) => sum + t.xpAwarded, 0);
        const totalCoins = currentLevelTasks.reduce((sum, t) => sum + t.coinsAwarded, 0);

        breakdowns.push({
          level: currentLevel,
          startXP: currentLevelStartXP,
          endXP: currentLevel * 100,
          tasks: [...currentLevelTasks],
          totalXP,
          totalCoins,
        });

        currentLevel = newLevel;
        currentLevelStartXP = (currentLevel - 1) * 100;
        currentLevelTasks = [];
      }
    });

    // Add the final level (current level)
    if (currentLevelTasks.length > 0) {
      const totalXP = currentLevelTasks.reduce((sum, t) => sum + t.xpAwarded, 0);
      const totalCoins = currentLevelTasks.reduce((sum, t) => sum + t.coinsAwarded, 0);

      breakdowns.push({
        level: currentLevel,
        startXP: currentLevelStartXP,
        endXP: runningXP,
        tasks: currentLevelTasks,
        totalXP,
        totalCoins,
      });
    }

    return breakdowns;
  }, [filteredTasks]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#121212",
        color: "#eeeeee",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
      }}
    >
      <aside
        style={{
          width: 260,
          background: "#121212",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
        }}
      >
        <div style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SynapseLogo />
            <span style={{ fontSize: 22, fontWeight: 700, color: "#eeeeee" }}>
              Synapse
            </span>
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: "20px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <Link
            href="/tasks"
            onMouseEnter={() => setHoveredButton("tasks")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              textDecoration: "none",
              background: hoveredButton === "tasks" ? "#1a1a1a" : "transparent",
              color: "#9ca3af",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .2s ease",
              textAlign: "left",
            }}
          >
            <TasksIcon active={false} />
            Tasks
          </Link>

          <Link
            href="/friends"
            onMouseEnter={() => setHoveredButton("friends")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              textDecoration: "none",
              background:
                hoveredButton === "friends" ? "#1a1a1a" : "transparent",
              color: "#9ca3af",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .2s ease",
              textAlign: "left",
            }}
          >
            <FriendsIcon active={false} />
            Friends
          </Link>

          <Link
            href="/pet"
            onMouseEnter={() => setHoveredButton("pet")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              textDecoration: "none",
              background: hoveredButton === "pet" ? "#1a1a1a" : "transparent",
              color: "#9ca3af",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .2s ease",
              textAlign: "left",
            }}
          >
            <PetIcon active={false} />
            Pet
          </Link>

          <Link
            href="/history"
            aria-current="page"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              textDecoration: "none",
              background: "#1a1a1a",
              color: "#eeeeee",
              fontSize: 15,
              fontWeight: 500,
              textAlign: "left",
              cursor: "default",
            }}
          >
            <HistoryIcon active />
            History
          </Link>
        </nav>

        {/* Pet Section */}
        {petData && (
          <div
            style={{
              margin: "12px",
              padding: "20px 16px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)",
              border: "1px solid #3a3a3a",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <PetDisplay
                equippedItems={petData.equippedItems || []}
                stage={petData.stage}
                size={140}
              />
            </div>

            {/* Happiness Bar */}
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    color: "#9ca3af",
                  }}
                >
                  Happiness
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <HappinessIcon happiness={petData.happiness} size={14} />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#eeeeee",
                    }}
                  >
                    {petData.happiness}/100
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  background: "#1a1a1a",
                  borderRadius: "999px",
                  overflow: "hidden",
                  border: "1px solid #2a2a2a",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${petData.happiness}%`,
                    background:
                      petData.happiness >= 66
                        ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                        : petData.happiness >= 33
                          ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                          : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                    borderRadius: "999px",
                    transition: "all 0.5s ease",
                  }}
                />
              </div>
            </div>

            {/* Manage Pet Button */}
            <Link
              href="/pet"
              onMouseEnter={() => setHoveredButton("managepet")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #3a3a3a",
                background:
                  hoveredButton === "managepet"
                    ? "linear-gradient(90deg, #4972e1 0%, #6366f1 100%)"
                    : "#2a2a2a",
                color: hoveredButton === "managepet" ? "#ffffff" : "#e5e7eb",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textDecoration: "none",
                display: "inline-flex",
                justifyContent: "center",
              }}
            >
              Manage Pet
            </Link>
          </div>
        )}

        <div style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#4972e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#eee",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.user.name || "User"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{(session.user as any).username || "username"}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#a5b4fc",
                whiteSpace: "nowrap",
              }}
            >
              {userXp} XP
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push("/signin");
            }}
            onMouseEnter={() => setHoveredButton("signout")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 6,
              border: "none",
              background: hoveredButton === "signout" ? "#7f1d1d" : "#991b1b",
              color: "#fca5a5",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .2s ease",
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 260, flex: 1, padding: 16, width: "100%" }}>
        <div
          style={{
            background: "#161616",
            borderRadius: 24,
            padding: "20px 28px",
            minHeight: "calc(100vh - 32px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#eee",
                  marginBottom: 4,
                }}
              >
                Level Progression History
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "#9ca3af",
                }}
              >
                See which tasks contributed to each level milestone.
              </p>
            </div>
          </div>

          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#9ca3af",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "9999px",
                  background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
                  boxShadow: "0 0 6px rgba(99, 102, 241, 0.6)",
                }}
              />
              Syncing recent history...
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 24,
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  background: "#151515",
                  borderRadius: 8,
                  border: "1px solid #374151",
                  padding: "8px 10px",
                  color: "#e5e7eb",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  background: "#151515",
                  borderRadius: 8,
                  border: "1px solid #374151",
                  padding: "8px 10px",
                  color: "#e5e7eb",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {levelBreakdowns.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "#9ca3af",
                fontSize: 14,
              }}
            >
              {loading ? "Loading history..." : "No completed tasks in this date range."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {levelBreakdowns.map((breakdown) => (
                <div
                  key={breakdown.level}
                  style={{
                    background: "#151515",
                    borderRadius: 16,
                    border: "1px solid #374151",
                    overflow: "hidden",
                  }}
                >
                  {/* Level Header */}
                  <div
                    style={{
                      background: "linear-gradient(90deg, #4972e1 0%, #6366f1 100%)",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#fff",
                          margin: 0,
                        }}
                      >
                        Level {breakdown.level}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          color: "rgba(255, 255, 255, 0.8)",
                          margin: "4px 0 0 0",
                        }}
                      >
                        {breakdown.tasks.length} task{breakdown.tasks.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        +{breakdown.totalXP} XP
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        +{breakdown.totalCoins} coins
                      </div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div style={{ padding: "12px" }}>
                    {breakdown.tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          background: "#1f1f1f",
                          borderRadius: 8,
                          padding: "12px 16px",
                          marginBottom: 8,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "#e5e7eb",
                              marginBottom: 4,
                            }}
                          >
                            {task.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#9ca3af",
                            }}
                          >
                            {new Date(task.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#a5b4fc",
                            }}
                          >
                            +{task.xpAwarded} XP
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#fbbf24",
                            }}
                          >
                            +{task.coinsAwarded}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
