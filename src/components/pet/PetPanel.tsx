"use client";

import React, { useEffect, useMemo, useState, CSSProperties } from "react";

type Appearance = {
  face: string;
  eyes: string;
  lips: string;
  cheeks: string;
  brows: string;
};

const DEFAULT_APPEARANCE: Appearance = {
  face: "#FDE68A",   // warm face
  eyes: "#E5E7EB",   // light for dark bg
  lips: "#F87171",   // soft red for dark bg
  cheeks: "#FCA5A5", // blush
  brows: "#E5E7EB",  // light for dark bg
};

const STORAGE_KEY = (userId: string) => `taskipet:${userId}:tamagotchi:v2`;

export default function PetPanel({ userId, xp }: { userId: string; xp: number }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [draft, setDraft] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [editing, setEditing] = useState<boolean>(false);

  // Load persisted appearance
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as Appearance;
        setAppearance(parsed);
        setDraft(parsed);
      }
    } catch {}
  }, [userId]);

  // Save persisted appearance
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(appearance));
    } catch {}
  }, [userId, appearance]);

  // Milestones for accessories
  const showHat = xp >= 500;
  const showBow = xp >= 1000;
  const showFists = xp >= 1800;
  const showRing = xp >= 3000;

  const faceSvg = useMemo(
    () => (
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Scale everything down and center it */}
        <g transform="translate(20,20) scale(0.8)">
          {/* Face base */}
          <circle
            cx="100"
            cy="100"
            r="68"
            fill={appearance.face}
            stroke="#111827"
            strokeWidth="3"
          />

          {/* Cheeks */}
          <circle cx="70" cy="115" r="10" fill={appearance.cheeks} opacity="0.9" />
          <circle cx="130" cy="115" r="10" fill={appearance.cheeks} opacity="0.9" />

          {/* Eyes */}
          <circle cx="80" cy="95" r="6" fill={appearance.eyes} />
          <circle cx="120" cy="95" r="6" fill={appearance.eyes} />

          {/* Eyebrows */}
          <path
            d="M70 83 Q80 78 90 83"
            fill="none"
            stroke={appearance.brows}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M110 83 Q120 78 130 83"
            fill="none"
            stroke={appearance.brows}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Smile */}
          <path
            d="M80 125 Q100 140 120 125"
            fill="none"
            stroke={appearance.lips}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Accessories (milestones) */}
          {showHat && <Hat />}
          {showBow && <BowTie />}
          {showFists && <Fists faceColor={appearance.face} showRing={showRing} />}
        </g>
      </svg>
    ),
    [appearance, showHat, showBow, showFists, showRing]
  );

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "1.2fr 1fr", // side-by-side
        alignItems: "start",
      }}
    >
      {/* Left: Avatar */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={sectionTitle}>Tamagotchi</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>XP accessories unlock</span>
        </div>

        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 20,
            padding: 12,
            background: "#1a1a1a",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 240, // smaller visual size
              aspectRatio: "1 / 1",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {faceSvg}
          </div>
        </div>

        {/* Legend for milestones */}
        <ul style={{ marginTop: 10, paddingLeft: 18, color: "#9ca3af", fontSize: 13 }}>
          <li>500 XP: small hat</li>
          <li>1000 XP: bow tie</li>
          <li>1800 XP: fists at sides</li>
          <li>3000 XP: diamond ring on finger</li>
        </ul>
      </div>

      {/* Right: Controls */}
      <div style={card}>
        <div style={sectionTitle}>
          {editing ? "Customize Tamagotchi" : "Appearance"}
        </div>

        {!editing ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Swatch label="Face" color={appearance.face} />
            <Swatch label="Eyes" color={appearance.eyes} />
            <Swatch label="Lips" color={appearance.lips} />
            <Swatch label="Cheeks" color={appearance.cheeks} />
            <Swatch label="Brows" color={appearance.brows} />
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <ColorRow
              label="Face"
              value={draft.face}
              onChange={(v) => setDraft((d) => ({ ...d, face: v }))}
            />
            <ColorRow
              label="Eyes"
              value={draft.eyes}
              onChange={(v) => setDraft((d) => ({ ...d, eyes: v }))}
            />
            <ColorRow
              label="Lips"
              value={draft.lips}
              onChange={(v) => setDraft((d) => ({ ...d, lips: v }))}
            />
            <ColorRow
              label="Cheeks"
              value={draft.cheeks}
              onChange={(v) => setDraft((d) => ({ ...d, cheeks: v }))}
            />
            <ColorRow
              label="Brows"
              value={draft.brows}
              onChange={(v) => setDraft((d) => ({ ...d, brows: v }))}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {!editing ? (
            <button type="button" onClick={() => setEditing(true)} style={btn("#4972e1")}>
              Modify
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setAppearance(draft);
                  setEditing(false); // lock until Modify again
                }}
                style={btn("#10b981")}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(appearance);
                  setEditing(false);
                }}
                style={btn("#ef4444")}
              >
                Cancel
              </button>
            </>
          )}
        </div>

        <p style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
          Click <b>Modify</b> to edit colors. <b>Save</b> locks the look until you modify
          again. Accessories appear automatically at 500 / 1000 / 1800 / 3000 XP.
        </p>
      </div>
    </div>
  );
}

/* ---------- Accessories ---------- */

function Hat() {
  return (
    <g>
      {/* Brim */}
      <rect x="60" y="48" width="80" height="10" rx="5" fill="#111827" />
      {/* Cap */}
      <path
        d="M70 48 Q100 25 130 48 Z"
        fill="#4972e1"
        stroke="#111827"
        strokeWidth="2"
      />
    </g>
  );
}

function BowTie() {
  return (
    <g>
      {/* center knot */}
      <circle cx="100" cy="162" r="5" fill="#EF4444" stroke="#111827" strokeWidth="2" />
      {/* left wing */}
      <path
        d="M95 162 L75 152 Q80 162 75 172 Z"
        fill="#EF4444"
        stroke="#111827"
        strokeWidth="2"
      />
      {/* right wing */}
      <path
        d="M105 162 L125 152 Q120 162 125 172 Z"
        fill="#EF4444"
        stroke="#111827"
        strokeWidth="2"
      />
    </g>
  );
}

function Fists({ faceColor, showRing }: { faceColor: string; showRing: boolean }) {
  return (
    <g>
      {/* Arms */}
      <path d="M40 120 Q55 115 70 120" fill="none" stroke="#111827" strokeWidth="3" />
      <path d="M130 120 Q145 115 160 120" fill="none" stroke="#111827" strokeWidth="3" />
      {/* Left fist */}
      <circle cx="70" cy="120" r="12" fill={faceColor} stroke="#111827" strokeWidth="3" />
      {/* Right fist */}
      <circle cx="130" cy="120" r="12" fill={faceColor} stroke="#111827" strokeWidth="3" />
      {showRing && <Ring />}
    </g>
  );
}

function Ring() {
  // Diamond ring positioned on the right fist
  return (
    <g>
      {/* ring band */}
      <circle cx="136" cy="114" r="4.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      {/* diamond */}
      <polygon
        points="136,102 130,108 136,114 142,108"
        fill="#A5F3FC"
        stroke="#0E7490"
        strokeWidth="1.5"
      />
      <line x1="136" y1="100" x2="136" y2="102" stroke="#0E7490" strokeWidth="1.5" />
    </g>
  );
}

/* ---------- Small UI bits ---------- */

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div style={swatchWrap}>
      <div style={{ ...swatch, background: color, border: "1px solid #3a3a3a" }} />
      <span style={{ fontSize: 12, color: "#e5e7eb" }}>{label}</span>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 80, fontSize: 14, color: "#e5e7eb", fontWeight: 600 }}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 36,
          height: 28,
          border: "1px solid #2a2a2a",
          borderRadius: 6,
          padding: 0,
          background: "#161616",
          cursor: "pointer",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: "8px 10px",
          border: "1px solid #2a2a2a",
          borderRadius: 8,
          fontSize: 14,
          background: "#161616",
          color: "#e5e7eb",
          outline: "none",
        }}
      />
    </label>
  );
}

/* ---------- Styles ---------- */

const card: CSSProperties = {
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: 12,
  background: "#161616",
};

const sectionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#e5e7eb",
};

const swatchWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  border: "1px solid #2a2a2a",
  borderRadius: 10,
  background: "#1a1a1a",
};

const swatch: CSSProperties = {
  width: 22,
  height: 16,
  borderRadius: 4,
};

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
