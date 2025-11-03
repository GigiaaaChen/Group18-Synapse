"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();

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
    padding: "60px 40px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    textAlign: "center",
    maxWidth: "500px",
  };

  const titleStyle: CSSProperties = {
    fontSize: "32px",
    color: "#333",
    marginBottom: "10px",
  };

  const subtitleStyle: CSSProperties = {
    fontSize: "18px",
    color: "#666",
    marginBottom: "30px",
  };

  const buttonStyle: CSSProperties = {
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    padding: "15px 40px",
    fontSize: "18px",
    borderRadius: "30px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "inline-block",
    textDecoration: "none",
    margin: "0 10px",
  };

  const secondaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: "transparent",
    border: "2px solid #667eea",
    color: "#667eea",
  };

  const userInfoStyle: CSSProperties = {
    fontSize: "16px",
    color: "#666",
    marginBottom: "20px",
  };

  if (isPending) {
    return (
      <div style={containerStyle}>
        <div style={boxStyle}>
          <h1 style={titleStyle}>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h1 style={titleStyle}>🐾 Tamagotchi Task Manager</h1>
        <p style={subtitleStyle}>Keep your tasks alive and happy!</p>

        {session ? (
          <>
            <p style={userInfoStyle}>
              Welcome back, {session.user.name || session.user.email}!
            </p>
            <Link href="/tasks" style={buttonStyle}>
              Go to Tasks
            </Link>
          </>
        ) : (
          <>
            <Link href="/signin" style={buttonStyle}>
              Sign In
            </Link>
            <Link href="/signup" style={secondaryButtonStyle}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
