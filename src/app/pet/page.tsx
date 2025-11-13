"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { Toaster } from "sonner";
import { TasksIcon, FriendsIcon, PetIcon, SynapseLogo,HistoryIcon  } from "@/components/icons";
import PetPanel from "@/components/pet/PetPanel";

export default function PetPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  
  // start at 0
  // fetch the real xp from the api
  const [userXp, setUserXp] = useState<number>(0);

  useEffect(() => {
    if (!isPending && !session) router.push("/signin");
  }, [session, isPending, router]);

  const userId: string =
    (session?.user as any)?.id ||
    session?.user?.email ||
    session?.user?.name ||
    "guest";

  useEffect(() => {
    if (!session?.user || !userId || userId === "guest") return;

    const fetchPetState = async () => {
      try {
        const res = await fetch(`/api/pet?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          console.error("Failed to fetch pet state", await res.text());
          return;
        }
        const data = await res.json();
        // use xp from DB
        setUserXp(data.xp ?? 0);
      } catch (err) {
        console.error("Error fetching pet state:", err);
      }
    };

    fetchPetState();
  }, [session, userId]);

  const userInitial = useMemo(
    () => (session?.user?.name?.[0] || session?.user?.email?.[0] || "U").toUpperCase(),
    [session?.user]
  );

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
    <>
      <Toaster position="top-center" richColors />
      <div
        style={{
          minHeight: "100vh",
          background: "#121212",
          color: "#eeeeee",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
        }}
      >
        {/* Sidebar */}
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
          {/* Logo */}
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <SynapseLogo />
              <span style={{ fontSize: 22, fontWeight: 700, color: "#eeeeee" }}>
                Synapse
              </span>
            </div>
          </div>

          {/* Nav */}
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

            {/* Active: Pet */}
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
              <PetIcon active />
              Pet
            </button>
            <button
              onClick={() => router.push("/history")}
              onMouseEnter={() => setHoveredButton("history")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                background:
                  hoveredButton === "history" ? "#1a1a1a" : "transparent",
                color: "#9ca3af",
                fontSize: "15px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
            >
              <HistoryIcon active={false} />
              History
            </button>
          </nav>
              
          {/* User */}
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

        {/* Main */}
        <main style={{ marginLeft: 260, flex: 1, padding: 16, width: "100%" }}>
          <div
            style={{
              background: "#161616",
              borderRadius: 24,
              padding: "20px 28px",
              minHeight: "calc(100vh - 32px)",
            }}
          >
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#eee",
                marginBottom: 24,
              }}
            >
              My Pet
            </h1>

            {/* Tamagotchi panel (evolution driven by user XP) */}
            <PetPanel userId={userId} xp={userXp} />
          </div>
        </main>
      </div>
    </>
  );
}
