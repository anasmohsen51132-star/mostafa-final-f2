// src/components/developer/monitoring/HealthBadge.tsx
//
// Reuses the same color language as SEVERITY_META in
// src/components/developer/logs/logMeta.ts (WARNING=gold, CRITICAL=red)
// so a "WARNING" status here and a "WARNING" log severity there always
// mean the same color to someone scanning the dashboard.
import type { HealthStatus } from "@/lib/monitoring/types";

const META: Record<HealthStatus, { label: string; color: string; bg: string; dot: string }> = {
  HEALTHY:  { label: "سليم",  color: "#1A6B47", bg: "rgba(26,107,71,0.1)",   dot: "#1A6B47" },
  WARNING:  { label: "تحذير", color: "#8B6914", bg: "rgba(201,168,76,0.14)", dot: "#C9A84C" },
  CRITICAL: { label: "حرج",   color: "#fff",     bg: "#B3261E",              dot: "#fff" },
};

export function HealthBadge({ status, size = "md" }: { status: HealthStatus; size?: "sm" | "md" }) {
  const meta = META[status];
  const fontSize = size === "sm" ? 11 : 13;
  const padding = size === "sm" ? "3px 10px" : "5px 14px";

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full font-semibold"
      style={{ background: meta.bg, color: meta.color, padding, fontFamily: "Cairo,sans-serif", fontSize }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 8, height: 8, background: meta.dot, boxShadow: status !== "HEALTHY" ? `0 0 6px ${meta.dot}` : "none" }}
      />
      {meta.label}
    </span>
  );
}
