"use client";
// src/components/video/VideoWatermark.tsx
// Tiled, semi-transparent identity watermark so a screen recording can be
// traced back to the account that made it. Purely a deterrent, like the
// rest of this player — it doesn't stop recording, it stops anonymous
// redistribution.
import { useMemo } from "react";

interface Props {
  name: string;
  phone: string;
}

const COLS = 4;
const ROWS = 5;

export function VideoWatermark({ name, phone }: Props) {
  const text = useMemo(() => {
    const now = new Date().toLocaleString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${name} · ${phone} · ${now}`;
  }, [name, phone]);

  const tiles = useMemo(
    () =>
      Array.from({ length: ROWS }).flatMap((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          const rotate = (row + col) % 2 === 0 ? -22 : -28;
          const opacity = 0.13 + (((row * COLS + col) % 3) * 0.03);
          return { key: `${row}-${col}`, left: (col / COLS) * 100 + 5, top: (row / ROWS) * 100 + 5, rotate, opacity };
        })
      ),
    []
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden"
      aria-hidden="true"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {tiles.map((t) => (
        <div
          key={t.key}
          style={{ position: "absolute", left: `${t.left}%`, top: `${t.top}%`, transform: `rotate(${t.rotate}deg)` }}
        >
          <span
            style={{
              fontFamily: "Cairo, sans-serif",
              fontSize: "clamp(7px, 1.1vw, 10px)",
              fontWeight: 600,
              color: `rgba(255,255,255,${t.opacity})`,
              whiteSpace: "nowrap",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              letterSpacing: "0.02em",
            }}
          >
            {text}
          </span>
        </div>
      ))}
    </div>
  );
}
