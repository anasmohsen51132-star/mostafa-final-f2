"use client";
// src/components/developer/incidents/IncidentBadges.tsx
import { INCIDENT_SEVERITY_META, INCIDENT_STATUS_META } from "@/components/developer/incidents/incidentMeta";

export function IncidentSeverityBadge({ severity }: { severity: string }) {
  const meta = INCIDENT_SEVERITY_META[severity] ?? INCIDENT_SEVERITY_META.LOW;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, fontFamily: "Cairo,sans-serif", color: meta.color, background: meta.bg,
    }}>
      {meta.label}
    </span>
  );
}

export function IncidentStatusBadge({ status }: { status: string }) {
  const meta = INCIDENT_STATUS_META[status] ?? INCIDENT_STATUS_META.OPEN;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, fontFamily: "Cairo,sans-serif", color: meta.color, background: meta.bg,
    }}>
      <span>{meta.icon}</span>{meta.label}
    </span>
  );
}
