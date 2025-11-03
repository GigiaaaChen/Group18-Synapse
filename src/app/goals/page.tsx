"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { useGoalStore } from "@/stores/goalStore";
import type { GoalCategory, GoalPeriod } from "@/types/goal";

const categories: GoalCategory[] = ["personal", "work", "health", "study"];
const periods: GoalPeriod[] = ["daily", "weekly"];

export default function GoalsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const {
    goals,
    progress,
    isLoading,
    error,
    fetchGoals,
    fetchSummary,
    upsertGoal,
    setError,
  } = useGoalStore();

  // --- DEMO MODE AUTH HANDLING ---
  const isDemo = !session; // if no session, show demo
  const userId =
    (session as any)?.user?.id ||
    (session as any)?.user?.email ||
    "demo-user-1";
  const token = session?.session?.token || "demo-token";

  useEffect(() => {
    if (!token) return;
    fetchGoals(token)
      .then(() => fetchSummary(token))
      .catch(() => {});
  }, [token, fetchGoals, fetchSummary]);

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  };

  const boxStyle: CSSProperties = {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
  };

  const card: CSSProperties = {
    background: "#fafafa",
    borderRadius: 12,
    border: "1px solid #eee",
    padding: 16,
  };

  const track: CSSProperties = {
    width: "100%",
    height: 12,
    background: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  };

  const fill = (pct: number): CSSProperties => ({
    height: "100%",
    width: `${Math.min(100, Math.max(0, Math.round(pct)))}%`,
    background: "#111827",
    transition: "width .2s ease",
  });

  const pill = (ok: boolean): CSSProperties => ({
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: ok ? "#e8f5e9" : "#eef2ff",
    color: ok ? "#1b5e20" : "#1e3a8a",
    border: `1px solid ${ok ? "#81c784" : "#c7d2fe"}`,
  });

  const btn = (bg: string, color: string): CSSProperties => ({
    backgroundColor: bg,
    color,
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "none",
    display: "inline-block",
  });

  const [form, setForm] = useState<{ [key: string]: number | "" }>({});

  const existing = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of goals) map[`${g.category}:${g.period}`] = g.minutesTarget;
    return map;
  }, [goals]);

  const handleSave = async (category: GoalCategory, period: GoalPeriod) => {
    if (isDemo) {
      alert("Demo mode: changes are not saved.");
      return;
    }
    if (!token) return;
    setError(null);
    const key = `${category}:${period}`;
    const raw = form[key];
    const minutesTarget = typeof raw === "number" ? raw : existing[key] || 0;
    await upsertGoal({ category, period, minutesTarget }, token);
  };

  const getSummary = (category: GoalCategory, period: GoalPeriod) => {
    return (
      progress.find((p) => p.category === category && p.period === period) || {
        category,
        period,
        minutesTarget: existing[`${category}:${period}`] ?? 0,
        minutesLogged: 0,
        minutesRemaining: existing[`${category}:${period}`] ?? 0,
        met: false,
      }
    );
  };

  const handleSignOut = async () => {
    if (isDemo) {
      router.push("/signin");
      return;
    }
    await signOut();
    router.push("/signin");
  };

  if (isPending) {
    return (
      <div style={containerStyle}>
        <div style={boxStyle}>
          <h1 style={{ fontSize: 32, color: "#333", textAlign: "center" }}>
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/tasks" style={btn("#e0e0e0", "#333")}>
              ← Back to Tasks
            </Link>
            <Link href="/pet" style={btn("#e0e0e0", "#333")}>
              Pet
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ color: "#666", fontSize: "14px" }}>
              {isDemo ? "Demo User" : session.user.name || session.user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              style={btn("#ff4757", "#fff")}
            >
              {isDemo ? "Exit Demo" : "Sign Out"}
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: 32, color: "#333", marginBottom: 10 }}>
          {isDemo ? "Goals (Demo Mode)" : "Goals"}
        </h1>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: "rgba(244, 67, 54, 0.1)",
              color: "#c62828",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Set / Update */}
          <div style={card}>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: "#333" }}>
              Set / Update Goals
            </h3>
            <p style={{ marginTop: 0, color: "#666", fontSize: 14 }}>
              Enter minutes, then click <b>Save</b>. Progress “resets” by
              current day/week window automatically.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto auto auto",
                gap: 8,
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>Category</div>
              <div style={{ fontSize: 12, color: "#666" }}>Period</div>
              <div style={{ fontSize: 12, color: "#666" }}>Minutes</div>
              <div />
              {categories.map((cat) =>
                periods.map((per) => {
                  const key = `${cat}:${per}`;
                  const val = form[key] ?? existing[key] ?? "";
                  return (
                    <React.Fragment key={key}>
                      <div style={{ textTransform: "capitalize" }}>{cat}</div>
                      <div style={{ textTransform: "capitalize" }}>{per}</div>
                      <input
                        type="number"
                        min={0}
                        value={val}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [key]: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        placeholder="0"
                        style={{
                          padding: "8px",
                          borderRadius: 8,
                          border: "2px solid #ddd",
                          width: 120,
                        }}
                      />
                      <button
                        onClick={() => handleSave(cat, per)}
                        style={btn("#111827", "#fff")}
                      >
                        Save
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          {/* Progress */}
          <div style={card}>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: "#333" }}>
              Progress
            </h3>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div />
              <button
                onClick={() => token && fetchSummary(token)}
                style={btn("#e0e0e0", "#333")}
                title="Refresh summary"
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <p style={{ color: "#666" }}>Loading...</p>
            ) : (
              categories.flatMap((cat) =>
                periods.map((per) => {
                  const s = getSummary(cat, per);
                  const pct =
                    s.minutesTarget > 0
                      ? (s.minutesLogged / s.minutesTarget) * 100
                      : 0;

                  return (
                    <div
                      key={`${cat}:${per}`}
                      style={{
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom: "1px dashed #eaeaea",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            textTransform: "capitalize",
                            color: "#333",
                          }}
                        >
                          {cat} – {per}
                        </div>
                        <span style={pill(s.met)}>
                          {s.met ? "Goal met!" : "In progress"}
                        </span>
                      </div>

                      <div style={{ marginTop: 6, fontSize: 14, color: "#475569" }}>
                        Target: <b>{s.minutesTarget} min</b> · Logged:{" "}
                        <b>{s.minutesLogged} min</b> · Remaining:{" "}
                        <b>{s.minutesRemaining} min</b>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <div style={track}>
                          <div style={fill(pct)} />
                        </div>
                      </div>

                      {s.met && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#1b5e20" }}>
                          🎉 Nice! You hit your {per} goal for <b>{cat}</b>.
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
