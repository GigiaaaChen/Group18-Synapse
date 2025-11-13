"use client";

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
import Timeline from "@/components/history/Timeline";
import TaskList from "@/components/history/TaskList";
import { mockEvolutions, mockTasks } from "@/types/history.mock";
import type { Evolution, Task } from "@/types/history";

export default function HistoryPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [userXp, setUserXp] = useState<number>((session?.user as any)?.xp ?? 0);

  const [selectedEvolutionId, setSelectedEvolutionId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (!isPending && !session) router.push("/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) setUserXp((session.user as any)?.xp ?? 0);
  }, [session]);

  const userInitial = useMemo(
    () =>
      (
        session?.user?.name?.[0] ||
        session?.user?.email?.[0] ||
        "U"
      ).toUpperCase(),
    [session?.user]
  );

  const sortedEvolutions: Evolution[] = useMemo(
    () =>
      [...mockEvolutions].sort(
        (a, b) => new Date(a.evolvedAt).getTime() - new Date(b.evolvedAt).getTime()
      ),
    []
  );

  const filteredEvolutions: Evolution[] = useMemo(() => {
    return sortedEvolutions.filter((evo) => {
      const t = new Date(evo.evolvedAt).getTime();
      const afterStart = startDate ? t >= new Date(startDate).getTime() : true;
      const beforeEnd = endDate ? t <= new Date(endDate).getTime() : true;
      return afterStart && beforeEnd;
    });
  }, [sortedEvolutions, startDate, endDate]);

  const stageTasks: Task[] = useMemo(() => {
    const tasksInRange = mockTasks.filter((task) => {
      const t = new Date(task.completedAt).getTime();
      const afterStart = startDate ? t >= new Date(startDate).getTime() : true;
      const beforeEnd = endDate ? t <= new Date(endDate).getTime() : true;
      return afterStart && beforeEnd;
    });

    if (!selectedEvolutionId) return tasksInRange;

    const index = sortedEvolutions.findIndex((e) => e.id === selectedEvolutionId);
    if (index === -1) return tasksInRange;

    const current = sortedEvolutions[index];
    const previous = sortedEvolutions[index - 1] ?? null;

    const fromTime = previous ? new Date(previous.evolvedAt).getTime() : -Infinity;
    const toTime = new Date(current.evolvedAt).getTime();

    return tasksInRange.filter((task) => {
      const t = new Date(task.completedAt).getTime();
      return t > fromTime && t <= toTime;
    });
  }, [selectedEvolutionId, sortedEvolutions, startDate, endDate]);

  if (isPending) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
          color: "#9ca3af",
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    );
  }
  if (!session) return null;

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
          <button
            onClick={() => router.push("/tasks")}
            onMouseEnter={() => setHoveredButton("tasks")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
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
          </button>

          <button
            onClick={() => router.push("/friends")}
            onMouseEnter={() => setHoveredButton("friends")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: hoveredButton === "friends" ? "#1a1a1a" : "transparent",
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
          </button>

          <button
            onClick={() => router.push("/pet")}
            onMouseEnter={() => setHoveredButton("pet")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
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
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
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
          </button>
        </nav>

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
                Pet Growth History
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "#9ca3af",
                }}
              >
                See how your completed tasks contributed to your pet&apos;s evolution.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 20,
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

          <div style={{ marginBottom: 24 }}>
            <Timeline
              evolutions={filteredEvolutions}
              selectedId={selectedEvolutionId}
              onSelect={setSelectedEvolutionId}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
              gap: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#e5e7eb",
                  marginBottom: 8,
                }}
              >
                Evolution History
              </h2>
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid #374151",
                  background: "#151515",
                }}
              >
                {filteredEvolutions.length === 0 ? (
                  <div
                    style={{
                      padding: "16px 20px",
                      fontSize: 14,
                      color: "#9ca3af",
                      textAlign: "center",
                    }}
                  >
                    No evolutions in this date range.
                  </div>
                ) : (
                  filteredEvolutions.map((evo) => (
                    <div
                      key={evo.id}
                      style={{
                        padding: "12px 20px",
                        borderBottom: "1px solid #1f2933",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#e5e7eb",
                          }}
                        >
                          Level {evo.level} – {evo.form}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            marginTop: 2,
                          }}
                        >
                          Evolved at {new Date(evo.evolvedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <TaskList
                tasks={stageTasks}
                title={
                  selectedEvolutionId
                    ? "Tasks during this evolution stage"
                    : "Tasks in selected date range"
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
