"use client";
// src/components/developer/ai-guardian/GuardianBadges.tsx
import { STATUS_META, PRIORITY_META, INSIGHT_SEVERITY_META } from "@/components/developer/ai-guardian/guardianMeta";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.UNKNOWN;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 700, fontFamily: "Cairo,sans-serif", color: meta.color, background: meta.bg,
    }}>
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.LOW;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, fontFamily: "Cairo,sans-serif", color: meta.color, background: meta.bg,
    }}>
      {meta.label}
    </span>
  );
}

export function InsightSeverityBadge({ severity }: { severity: string }) {
  const meta = INSIGHT_SEVERITY_META[severity] ?? INSIGHT_SEVERITY_META.INFO;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, fontFamily: "Cairo,sans-serif", color: meta.color, background: meta.bg,
    }}>
      {meta.label}
    </span>
  );
}

export function ConfidenceBar({ confidence }: { confidence: number }) {
  const clamped = Math.max(0, Math.min(100, confidence));
  const color = clamped >= 70 ? "#1A6B47" : clamped >= 40 ? "#8B6914" : "#B3261E";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, color: "#7A6E5A" }}>مستوى الثقة (تقدير)</span>
        <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, fontWeight: 700, color }}>{clamped}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "rgba(122,110,90,0.12)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${clamped}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export function ScoreGauge({ score, status }: { score: number; status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.UNKNOWN;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={meta.color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "Amiri,serif", fontSize: 34, color: "#fff", lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>من 100</span>
      </div>
    </div>
  );
}
