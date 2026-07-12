"use client";
// src/components/courses/VideoWatermark.tsx
//
// BUGFIX: this used to tile a 4x5 grid (20 copies) of fairly large text
// across the whole player, which visually competed with the video itself.
// A deterrent watermark doesn't need to cover every pixel — it just needs
// to be present *somewhere* in any given frame of a recording, and to move
// so it can't be cropped out with one fixed crop. One small tag that drifts
// to a new random corner every few seconds achieves that with far less
// visual noise.
import { useEffect, useMemo, useState } from "react";

interface Props {
  name: string;
  phone: string;
}

// Percent-based positions (relative to the player box), kept away from the
// very edges so the text is never clipped, and away from the center so it
// never sits over the controls or the subject of the video.
const POSITIONS: { top?: string; left?: string; right?: string; bottom?: string }[] = [
  { top: "8%", left: "6%" },
  { top: "8%", right: "6%" },
  { bottom: "18%", left: "6%" },
  { bottom: "18%", right: "6%" },
  { top: "44%", left: "4%" },
  { top: "44%", right: "4%" },
];

const MOVE_INTERVAL_MS = 6000;

export function VideoWatermark({ name, phone }: Props) {
  const [posIndex, setPosIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPosIndex((i) => {
        // Pick a different random slot than the current one so it visibly moves.
        let next = Math.floor(Math.random() * POSITIONS.length);
        if (next === i) next = (next + 1) % POSITIONS.length;
        return next;
      });
    }, MOVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const text = useMemo(() => {
    const now = new Date().toLocaleString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${name} · ${phone} · ${now}`;
  }, [name, phone]);

  const pos = POSITIONS[posIndex];

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden"
      aria-hidden="true"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <span
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          right: pos.right,
          bottom: pos.bottom,
          fontFamily: "Cairo, sans-serif",
          fontSize: "clamp(8px, 1.1vw, 11px)",
          fontWeight: 600,
          color: "rgba(255,255,255,0.22)",
          whiteSpace: "nowrap",
          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          letterSpacing: "0.02em",
          transition: "top 1.2s ease, left 1.2s ease, right 1.2s ease, bottom 1.2s ease",
        }}
      >
        {text}
      </span>
    </div>
  );
}
