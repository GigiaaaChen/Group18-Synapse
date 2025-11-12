"use client";

import { ReactNode, useState, useRef, useEffect } from "react";

interface TooltipProps {
  children: ReactNode;
  text: string;
}

export function Tooltip({ children, text }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={containerRef}
        style={{ position: "relative", display: "inline-block" }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <div
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: "translate(-50%, -100%)",
          padding: "6px 12px",
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "6px",
          color: "#eeeeee",
          fontSize: "13px",
          fontWeight: "500",
          whiteSpace: "nowrap",
          zIndex: 9999,
          pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? "visible" : "hidden",
          transition: "opacity 0.2s ease, visibility 0.2s ease",
        }}
      >
        {text}
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid #1a1a1a",
          }}
        />
      </div>
    </>
  );
}
