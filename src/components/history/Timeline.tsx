"use client";

import { Evolution } from "@/types/history";
import { useState } from "react";

type TimelineProps = {
  evolutions: Evolution[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function Timeline({ evolutions, selectedId, onSelect }: TimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between text-sm text-gray-400">
        <span>Growth Timeline</span>
        <span>
          {selectedId
            ? `Selected evolution: Lv ${
                evolutions.find(e => e.id === selectedId)?.level ?? "?"
              }`
            : "Click a point to view stage tasks"}
        </span>
      </div>

      <div className="relative flex items-center gap-6 overflow-x-auto py-4">
        <div className="absolute left-0 right-0 h-[2px] bg-gray-700" />

        {evolutions.map(evo => {
          const isSelected = evo.id === selectedId;
          const isHovered = evo.id === hoveredId;

          return (
            <button
              key={evo.id}
              onClick={() => onSelect(isSelected ? null : evo.id)}
              onMouseEnter={() => setHoveredId(evo.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative flex flex-col items-center gap-1 bg-transparent"
            >
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  isSelected
                    ? "bg-blue-500 border-blue-400 scale-110"
                    : isHovered
                    ? "bg-blue-900 border-blue-400"
                    : "bg-gray-900 border-gray-600"
                }`}
              />
              <span className="text-xs text-gray-300">Lv {evo.level}</span>
              <span className="text-[10px] text-gray-500">
                {new Date(evo.evolvedAt).toLocaleDateString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
