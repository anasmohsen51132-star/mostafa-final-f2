"use client";
// src/components/developer/logs/LogBadges.tsx
import { SEVERITY_META, CATEGORY_META, type LogSeverityValue, type LogCategoryValue } from "@/components/developer/logs/logMeta";

export function SeverityBadge({ severity }: { severity: LogSeverityValue }) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        fontFamily: "Cairo,sans-serif",
        color: meta.color, background: meta.bg,
      }}
    >
      {meta.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: LogCategoryValue }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontFamily: "Cairo,sans-serif", fontSize: 12, color: "#4A3F2A",
      }}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
