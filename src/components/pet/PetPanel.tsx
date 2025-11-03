"use client";

import React, { useEffect, useMemo, useState, CSSProperties } from "react";

/**
 * PetPanel: evolution + appearance customization + persistence
 *
 * Acceptance criteria implemented:
 *  ★ Users can choose from unlocked skins/colors after reaching certain levels.
 *  ★ Choices are saved and remain after page refresh. (localStorage)
 *  ★ The appearance will automatically upgrade after reaching certain level.
 *  ★ Selected customization instantly updates pet avatar.
 */

type StageId = "egg" | "baby" | "teen" | "adult" | "legend";
type SkinId = "classic" | "pastel" | "neon" | "midnight" | "golden" | "emerald";
type ColorId = "blue" | "pink" | "purple" | "green" | "amber" | "slate";

interface StageDef {
  id: StageId;
  label: string;
  minLevel: number; // inclusive
  art: (skin: SkinId, color: ColorId) => string; // SVG string
}

interface Unlockable {
  id: SkinId | ColorId;
  label: string;
  type: "skin" | "color";
  unlockLevel: number;
}

interface PetState {
  level: number;
  xp: number; // current level XP
  xpToLevel: number;
  selectedSkin: SkinId;
  selectedColor: ColorId;
}

const STAGES: StageDef[] = [
  { id: "egg", label: "Egg", minLevel: 1, art: eggSVG },
  { id: "baby", label: "Baby", minLevel: 3, art: babySVG },
  { id: "teen", label: "Teen", minLevel: 6, art: teenSVG },
  { id: "adult", label: "Adult", minLevel: 10, art: adultSVG },
  { id: "legend", label: "Legend", minLevel: 15, art: legendSVG },
];

const UNLOCKS: Unlockable[] = [
  { id: "classic", label: "Classic", type: "skin", unlockLevel: 1 },
  { id: "pastel", label: "Pastel", type: "skin", unlockLevel: 3 },
  { id: "neon", label: "Neon", type: "skin", unlockLevel: 6 },
  { id: "midnight", label: "Midnight", type: "skin", unlockLevel: 8 },
  { id: "golden", label: "Golden", type: "skin", unlockLevel: 12 },
  { id: "emerald", label: "Emerald", type: "skin", unlockLevel: 14 },

  { id: "blue", label: "Blue", type: "color", unlockLevel: 1 },
  { id: "pink", label: "Pink", type: "color", unlockLevel: 2 },
  { id: "purple", label: "Purple", type: "color", unlockLevel: 4 },
  { id: "green", label: "Green", type: "color", unlockLevel: 5 },
  { id: "amber", label: "Amber", type: "color", unlockLevel: 7 },
  { id: "slate", label: "Slate", type: "color", unlockLevel: 9 },
];

const STORAGE_KEY = (userId: string) => `taskipet:${userId}:pet`;

function xpNeededForLevel(level: number): number {
  return 100 + level * 25; // simple growth curve
}

function stageForLevel(level: number): StageDef {
  return STAGES.filter((s) => s.minLevel <= level).slice(-1)[0] ?? STAGES[0];
}

function isUnlocked(level: number, item: Unlockable) {
  return level >= item.unlockLevel;
}

function loadPet(userId: string): PetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    return raw ? (JSON.parse(raw) as PetState) : null;
  } catch {
    return null;
  }
}

function savePet(userId: string, state: PetState) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function PetPanel({ userId }: { userId: string }) {
  const [state, setState] = useState<PetState>(() => {
    const saved = loadPet(userId);
    return (
      saved ?? {
        level: 1,
        xp: 0,
        xpToLevel: xpNeededForLevel(1),
        selectedSkin: "classic",
        selectedColor: "blue",
      }
    );
  });

  useEffect(() => savePet(userId, state), [userId, state]);

  const currentStage = useMemo(() => stageForLevel(state.level), [state.level]);

  function grantXP(amount: number) {
    setState((prev) => {
      let xp = prev.xp + amount;
      let level = prev.level;
      let xpToLevel = prev.xpToLevel;

      // handle multiple level-ups
      while (xp >= xpToLevel) {
        xp -= xpToLevel;
        level += 1;
        xpToLevel = xpNeededForLevel(level);
      }

      // appearance auto-upgrades by deriving stage from `level`
      return { ...prev, level, xp, xpToLevel };
    });
  }

  function setSkin(s: SkinId) {
    if (!isUnlocked(state.level, unlockById(s, "skin"))) return;
    setState((prev) => ({ ...prev, selectedSkin: s }));
  }

  function setColor(c: ColorId) {
    if (!isUnlocked(state.level, unlockById(c, "color"))) return;
    setState((prev) => ({ ...prev, selectedColor: c }));
  }

  function resetAll() {
    setState({
      level: 1,
      xp: 0,
      xpToLevel: xpNeededForLevel(1),
      selectedSkin: "classic",
      selectedColor: "blue",
    });
  }

  const skinOptions = UNLOCKS.filter((u) => u.type === "skin");
  const colorOptions = UNLOCKS.filter((u) => u.type === "color");

  // ---------- styles (inline to match tasks page) ----------
  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  };

  const card: CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  };

  const sectionTitle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 8,
  };

  const badge: CSSProperties = {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 12,
    color: "#334155",
  };

  const progressTrack: CSSProperties = {
    width: "100%",
    height: 12,
    background: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  };

  const progressFill: CSSProperties = {
    height: "100%",
    width: `${Math.min(100, Math.round((state.xp / state.xpToLevel) * 100))}%`,
    background: "#111827",
    transition: "width 200ms ease",
  };

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
      {/* Left: Avatar + XP */}
      <div style={card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <span style={badge}>Stage: {currentStage.label}</span>
          <span style={badge}>Level: {state.level}</span>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            padding: 12,
            background:
              "linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
          }}
        >
          <PetAvatar
            stage={currentStage}
            skin={state.selectedSkin}
            color={state.selectedColor}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
            XP Progress
          </div>
          <div style={progressTrack}>
            <div style={progressFill} />
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            {state.xp} / {state.xpToLevel} XP
          </div>
        </div>

        {/* Demo XP buttons – replace with your task completion hook */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => grantXP(20)}
            style={btn("#111827")}
          >
            +20 XP (Small)
          </button>
          <button
            type="button"
            onClick={() => grantXP(60)}
            style={btn("#111827")}
          >
            +60 XP (Medium)
          </button>
          <button
            type="button"
            onClick={() => grantXP(120)}
            style={btn("#111827")}
          >
            +120 XP (Big)
          </button>
          <button type="button" onClick={resetAll} style={btn("#ef4444")}>
            Reset
          </button>
        </div>
      </div>

      {/* Right: Customization */}
      <div style={{ display: "grid", gap: 16 }}>
        <div style={card}>
          <div style={sectionTitle}>Customize Skin</div>
          <div style={grid}>
            {skinOptions.map((opt) => {
              const locked = !isUnlocked(state.level, opt);
              const active = state.selectedSkin === opt.id;
              return (
                <button
                  key={opt.id}
                  title={locked ? `Unlocks at Lv${opt.unlockLevel}` : opt.label}
                  onClick={() => !locked && setSkin(opt.id as SkinId)}
                  style={pickStyle(locked, active)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Unlock new skins by leveling up. Your choice is saved automatically.
          </p>
        </div>

        <div style={card}>
          <div style={sectionTitle}>Customize Color</div>
          <div style={grid}>
            {colorOptions.map((opt) => {
              const locked = !isUnlocked(state.level, opt);
              const active = state.selectedColor === opt.id;
              return (
                <button
                  key={opt.id}
                  title={locked ? `Unlocks at Lv${opt.unlockLevel}` : opt.label}
                  onClick={() => !locked && setColor(opt.id as ColorId)}
                  style={pickStyle(locked, active)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Colors change the pet tint across stages. Saved automatically.
          </p>
        </div>

        <div style={card}>
          <div style={sectionTitle}>How this works</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#475569", fontSize: 14 }}>
            <li><b>Auto-evolution</b>: The stage recalculates from your level.</li>
            <li>
              <b>Unlock gates</b>: Skins/colors unlock at set levels. Locked options show the
              required level.
            </li>
            <li>
              <b>Persistence</b>: Choices and current state are saved in your browser
              (localStorage) keyed by your account.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* --------------------- UI helpers --------------------- */

function btn(bg: string): CSSProperties {
  return {
    backgroundColor: bg,
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  };
}

function pickStyle(locked: boolean, active: boolean): CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 8px",
    background: locked ? "#f1f5f9" : "#fff",
    color: locked ? "#94a3b8" : "#111827",
    cursor: locked ? "not-allowed" : "pointer",
    fontWeight: active ? 700 : 500,
    boxShadow: active ? "inset 0 0 0 2px #111827" : "none",
  };
}

/* ------------------ Pet avatar (SVG) ------------------ */

function PetAvatar({
  stage,
  skin,
  color,
}: {
  stage: StageDef;
  skin: SkinId;
  color: ColorId;
}) {
  const svg = stage.art(skin, color);
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 200ms ease, opacity 200ms ease",
      }}
      // Using inline SVG string for simplicity (could be <img /> with real assets)
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/* ------------------- Art + Palettes ------------------- */

function colorToHex(color: ColorId): string {
  switch (color) {
    case "blue":
      return "#60a5fa";
    case "pink":
      return "#f472b6";
    case "purple":
      return "#a78bfa";
    case "green":
      return "#34d399";
    case "amber":
      return "#f59e0b";
    case "slate":
      return "#94a3b8";
  }
}

function skinFilter(skin: SkinId): string {
  switch (skin) {
    case "classic":
      return "";
    case "pastel":
      return "opacity:0.95; filter:saturate(0.85)";
    case "neon":
      return "filter:brightness(1.1) saturate(1.35)";
    case "midnight":
      return "filter:brightness(0.9) saturate(0.9)";
    case "golden":
      return "filter:sepia(0.55) saturate(1.25)";
    case "emerald":
      return "filter:hue-rotate(40deg) saturate(1.2)";
  }
}

function eggSVG(skin: SkinId, color: ColorId) {
  const hex = colorToHex(color);
  const fx = skinFilter(skin);
  return `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grad" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stop-color="white"/>
        <stop offset="100%" stop-color="${hex}"/>
      </radialGradient>
    </defs>
    <g style="${fx}">
      <ellipse cx="100" cy="110" rx="60" ry="75" fill="url(#grad)" stroke="#111827" stroke-width="3"/>
      <circle cx="85" cy="100" r="5" fill="#111827"/>
      <circle cx="115" cy="100" r="5" fill="#111827"/>
    </g>
  </svg>`;
}

function babySVG(skin: SkinId, color: ColorId) {
  const hex = colorToHex(color);
  const fx = skinFilter(skin);
  return `
  <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg">
    <g style="${fx}">
      <ellipse cx="110" cy="110" rx="70" ry="60" fill="${hex}" stroke="#111827" stroke-width="3"/>
      <circle cx="90" cy="95" r="6" fill="#111827"/>
      <circle cx="130" cy="95" r="6" fill="#111827"/>
      <path d="M85 125 Q110 140 135 125" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
      <circle cx="70" cy="70" r="10" fill="#fde68a" stroke="#111827" stroke-width="2"/>
      <circle cx="150" cy="70" r="10" fill="#fde68a" stroke="#111827" stroke-width="2"/>
    </g>
  </svg>`;
}

function teenSVG(skin: SkinId, color: ColorId) {
  const hex = colorToHex(color);
  const fx = skinFilter(skin);
  return `
  <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
    <g style="${fx}">
      <rect x="60" y="60" width="120" height="90" rx="24" fill="${hex}" stroke="#111827" stroke-width="3"/>
      <circle cx="100" cy="100" r="6" fill="#111827"/>
      <circle cx="140" cy="100" r="6" fill="#111827"/>
      <path d="M95 130 Q120 145 145 130" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
      <path d="M60 60 L90 40" stroke="#111827" stroke-width="3"/>
      <path d="M180 60 L150 40" stroke="#111827" stroke-width="3"/>
    </g>
  </svg>`;
}

function adultSVG(skin: SkinId, color: ColorId) {
  const hex = colorToHex(color);
  const fx = skinFilter(skin);
  return `
  <svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg">
    <g style="${fx}">
      <rect x="50" y="55" width="160" height="100" rx="28" fill="${hex}" stroke="#111827" stroke-width="3"/>
      <circle cx="110" cy="105" r="7" fill="#111827"/>
      <circle cx="150" cy="105" r="7" fill="#111827"/>
      <path d="M105 135 Q130 150 155 135" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
      <path d="M80 55 Q130 20 180 55" fill="none" stroke="#111827" stroke-width="3"/>
    </g>
  </svg>`;
}

function legendSVG(skin: SkinId, color: ColorId) {
  const hex = colorToHex(color);
  const fx = skinFilter(skin);
  return `
  <svg viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g style="${fx}">
      <rect x="40" y="50" width="200" height="110" rx="30" fill="${hex}" stroke="#111827" stroke-width="3" filter="url(#glow)"/>
      <circle cx="120" cy="105" r="8" fill="#111827"/>
      <circle cx="160" cy="105" r="8" fill="#111827"/>
      <path d="M110 140 Q140 160 170 140" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
      <path d="M90 50 Q140 10 190 50" fill="none" stroke="#111827" stroke-width="3"/>
      ${Array.from({ length: 6 })
        .map((_, i) => {
          const x = 60 + i * 30;
          const y = 40 + (i % 2 === 0 ? 0 : 10);
          return `<circle cx="${x}" cy="${y}" r="2" fill="white"/>`;
        })
        .join("")}
    </g>
  </svg>`;
}

/* -------- small helper to find unlock meta -------- */

function unlockById(id: string, type: "skin" | "color"): Unlockable {
  const item = UNLOCKS.find((u) => u.id === id && u.type === type);
  if (!item) {
    // fallback (shouldn't happen)
    return { id: id as any, label: String(id), type, unlockLevel: 1 };
  }
  return item;
}
