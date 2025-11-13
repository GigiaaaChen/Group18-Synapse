"use client";

import React, { useEffect, useMemo, useState } from "react";

type Hex = `#${string}`;

type Appearance = {
  face: Hex;
  cheek: Hex;
  eye: Hex;
  brow: Hex;
  lip: Hex;
};

const DEFAULT_APPEARANCE: Appearance = {
  face: "#FFD166",  // warm yellow
  cheek: "#FCA5A5", // soft pink
  eye: "#111827",   // near-black
  brow: "#111827",
  lip: "#DC2626",   // red
};

const STORAGE_KEY = (userId: string) => `tamagotchi:${userId}:appearance:v1`;

export default function PetPanel({ userId, xp }: { userId: string; xp: number }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [editing, setEditing] = useState<boolean>(true); // if we have a saved one, we'll flip to false on load
  const [loaded, setLoaded] = useState<boolean>(false);

  // Load saved appearance on first mount (and when user changes)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId));
      if (raw) {
        const saved = JSON.parse(raw) as { appearance: Appearance };
        if (saved?.appearance) {
          setAppearance(saved.appearance);
          setEditing(false); // already saved once → lock by default
        } else {
          setEditing(true);
        }
      } else {
        setEditing(true);
      }
    } catch {
      // ignore parse errors
      setEditing(true);
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  // Save current appearance
  const handleSave = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY(userId),
        JSON.stringify({ appearance })
      );
    } catch {
      // ignore quota errors
    }
    setEditing(false);
  };

  const handleModify = () => setEditing(true);

  // XP gates for accessories
  const hasHat = xp >= 500;
  const hasBow = xp >= 1000;
  const hasFists = xp >= 1800;
  const hasRing = xp >= 3000;

  // Layout styles (match dark UI)
  const card: React.CSSProperties = {
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: 16,
    background: "#161616",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "#e5e7eb",
    marginBottom: 8,
  };

  const label: React.CSSProperties = {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 6,
    display: "block",
  };

  const colorRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  };

  const buttonRow: React.CSSProperties = {
    display: "flex",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  };

  const btn = (bg: string, hover: string, disabled?: boolean): React.CSSProperties => ({
    background: bg,
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 14,
    opacity: disabled ? 0.6 : 1,
    transition: "background .15s ease",
  });

  const disabledNote: React.CSSProperties = {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 6,
  };

  // Face SVG kept intentionally small; container is fixed size so page doesn’t jump.
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 16 }}>
      {/* Avatar Card */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Appearance</span>
            {!editing ? (
              <span style={{ fontSize: 12, color: "#10b981" }}>Saved</span>
            ) : (
              <span style={{ fontSize: 12, color: "#f59e0b" }}>Editing…</span>
            )}
          </div>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>XP: {xp}</span>
        </div>

        {/* Avatar box (fixed height; face scaled smaller) */}
        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(22,22,22,1) 0%, rgba(26,26,26,1) 100%)",
            padding: 12,
            height: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TamaFace
            appearance={appearance}
            hat={hasHat}
            bow={hasBow}
            fists={hasFists}
            ring={hasRing}
          />
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, fontSize: 12, color: "#9ca3af", flexWrap: "wrap" }}>
          <span>500 XP: 🎩 hat</span>
          <span>1000 XP: 🎀 bow tie</span>
          <span>1800 XP: ✊ fists</span>
          <span>3000 XP: 💍 ring</span>
        </div>
      </div>

      {/* Controls Card */}
      <div style={card}>
        <div style={sectionTitle}>Customize (round face)</div>
        <div style={colorRow}>
          <ColorField
            label="Face"
            value={appearance.face}
            disabled={!editing}
            onChange={(v) => setAppearance((s) => ({ ...s, face: v }))}
          />
          <ColorField
            label="Cheek"
            value={appearance.cheek}
            disabled={!editing}
            onChange={(v) => setAppearance((s) => ({ ...s, cheek: v }))}
          />
          <ColorField
            label="Eyes"
            value={appearance.eye}
            disabled={!editing}
            onChange={(v) => setAppearance((s) => ({ ...s, eye: v }))}
          />
          <ColorField
            label="Eyebrow"
            value={appearance.brow}
            disabled={!editing}
            onChange={(v) => setAppearance((s) => ({ ...s, brow: v }))}
          />
          <ColorField
            label="Lips"
            value={appearance.lip}
            disabled={!editing}
            onChange={(v) => setAppearance((s) => ({ ...s, lip: v }))}
          />
        </div>

        <div style={buttonRow}>
          <button
            onClick={handleSave}
            disabled={!editing || !loaded}
            style={btn("#4972e1", "#91aaed", !editing || !loaded)}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = "#91aaed";
            }}
            onMouseOut={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = "#4972e1";
            }}
          >
            Save
          </button>
          <button
            onClick={handleModify}
            disabled={editing || !loaded}
            style={btn("#374151", "#4b5563", editing || !loaded)}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = "#4b5563";
            }}
            onMouseOut={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = "#374151";
            }}
          >
            Modify
          </button>
          <button
            onClick={() => setAppearance(DEFAULT_APPEARANCE)}
            disabled={!editing}
            style={btn("#6b7280", "#9ca3af", !editing)}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = "#9ca3af";
            }}
            onMouseOut={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = "#6b7280";
            }}
          >
            Reset Colors
          </button>
        </div>

        {!editing && (
          <div style={disabledNote}>
            Appearance is locked. Click <b>Modify</b> to change it again, then <b>Save</b>.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function ColorField({
  label: labelText,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (hex: Hex) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, display: "block" }}>
        {labelText}
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as Hex)}
          style={{
            width: 36,
            height: 28,
            border: "1px solid #2a2a2a",
            borderRadius: 6,
            background: "#161616",
            padding: 0,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        />
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const t = e.target.value.trim();
            // simple hex validation
            if (/^#([0-9a-fA-F]{3}){1,2}$/.test(t)) onChange(t as Hex);
          }}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #2a2a2a",
            background: "#161616",
            color: "#e5e7eb",
            fontSize: 13,
            outline: "none",
          }}
          placeholder="#RRGGBB"
        />
      </div>
    </div>
  );
}

/* ---------------- face svg ---------------- */

function TamaFace({
  appearance,
  hat,
  bow,
  fists,
  ring,
}: {
  appearance: Appearance;
  hat: boolean;
  bow: boolean;
  fists: boolean;
  ring: boolean;
}) {
  const { face, cheek, eye, brow, lip } = appearance;

  // The whole group is scaled down to keep the face smaller.
  return (
    <svg viewBox="0 0 220 220" width={220} height={220} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(10, 10) scale(0.8)">
        {/* face */}
        <circle cx="120" cy="120" r="80" fill={face} stroke="#111827" strokeWidth="4" />

        {/* eyebrows */}
        <path
          d="M80 95 Q95 85 110 95"
          stroke={brow}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M130 95 Q145 85 160 95"
          stroke={brow}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* eyes */}
        <circle cx="100" cy="115" r="8" fill={eye} />
        <circle cx="148" cy="115" r="8" fill={eye} />

        {/* cheeks */}
        <circle cx="86" cy="138" r="10" fill={cheek} opacity={0.85} />
        <circle cx="162" cy="138" r="10" fill={cheek} opacity={0.85} />

        {/* smile */}
        <path
          d="M100 150 Q124 170 148 150"
          stroke={lip}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* accessories by xp */}
        {hat && <TopHat />}
        {bow && <BowTie />}
        {fists && <Fists ring={ring} />}
      </g>
    </svg>
  );
}

/* ------------- accessories ------------- */

function TopHat() {
  return (
    <g transform="translate(120, 50)">
      {/* brim */}
      <ellipse cx="0" cy="0" rx="60" ry="12" fill="#111827" />
      {/* crown */}
      <rect x="-30" y="-40" width="60" height="40" rx="6" fill="#111827" />
      {/* band */}
      <rect x="-30" y="-20" width="60" height="10" fill="#4f46e5" />
    </g>
  );
}

function BowTie() {
  return (
    <g transform="translate(124, 190)">
      <polygon points="-18,0 -44,12 -18,24" fill="#ef4444" />
      <circle cx="0" cy="12" r="8" fill="#b91c1c" />
      <polygon points="18,0 44,12 18,24" fill="#ef4444" />
    </g>
  );
}

function Fists({ ring }: { ring: boolean }) {
  return (
    <g>
      {/* left fist */}
      <g transform="translate(42, 160)">
        <rect x="0" y="0" width="30" height="22" rx="6" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        {/* fingers */}
        <rect x="2" y="-8" width="8" height="10" rx="2" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        <rect x="12" y="-8" width="8" height="10" rx="2" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        <rect x="22" y="-8" width="8" height="10" rx="2" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
      </g>

      {/* right fist */}
      <g transform="translate(188, 160)">
        <rect x="-30" y="0" width="30" height="22" rx="6" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        {/* fingers */}
        <rect x="-28" y="-8" width="8" height="10" rx="2" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        <rect x="-18" y="-8" width="8" height="10" rx="2" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        <rect x="-8" y="-8" width="8" height="10" rx="2" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        {/* ring on index finger */}
        {ring && <circle cx="-24" cy="-2" r="4" fill="#FBBF24" stroke="#92400e" strokeWidth="1.5" />}
      </g>
    </g>
  );
}
