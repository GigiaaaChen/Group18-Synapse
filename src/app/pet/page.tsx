"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import PetPanel from "@/components/pet/PetPanel";

export default function PetPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // ---- Styles (match your Tasks page) ----
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

  const pill: CSSProperties = {
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: 12,
    fontWeight: 700,
  };

  // ---- IMPORTANT: do NOT redirect when not signed in ----
  // We still show a loading state while the session is being resolved.
  if (isPending) {
    return (
      <div style={containerStyle}>
        <div style={boxStyle}>
          <h1 style={{ fontSize: "32px", color: "#333", textAlign: "center" }}>
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  // Use real user ID if logged in; otherwise fall back to demo
  const userId =
    (session as any)?.user?.email ||
    (session as any)?.user?.id ||
    "demo-user-1";

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        {/* Header (matches your Tasks page, but hides Sign Out in demo mode) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Link
            href="/tasks"
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
            ← Back to Tasks
          </Link>

          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span style={{ color: "#666", fontSize: "14px" }}>
                {(session as any).user.name || (session as any).user.email}
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
          ) : (
            <span style={pill} title="Auth not required for preview">
              DEMO MODE
            </span>
          )}
        </div>

        <h1 style={{ fontSize: "32px", color: "#333", marginBottom: "10px" }}>
          Your Pet
        </h1>

        {!session && (
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
            You are viewing the pet in <b>Demo Mode</b>. Progress & selections
            are saved to your browser (localStorage) under <code>{userId}</code>.
            When sign-in is fixed, this page will automatically use your account.
          </p>
        )}

        {/* Full pet feature: evolution + customization + persistence */}
        <PetPanel userId={userId} />
      </div>
    </div>
  );
}
