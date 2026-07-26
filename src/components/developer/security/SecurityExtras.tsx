"use client";
// src/components/developer/security/SecurityExtras.tsx
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { StatTile } from "@/components/developer/monitoring/StatTile";
import { IncidentSeverityBadge, IncidentStatusBadge } from "@/components/developer/incidents/IncidentBadges";
import { formatIncidentDateTime } from "@/components/developer/incidents/incidentMeta";

interface SecurityData {
  rateLimitEvents: number;
  suspiciousIps: { ip: string; count: number }[];
  recentEvents: { message: string; ip: string | null; route: string | null; at: string }[];
  securityIncidents: { id: string; title: string; severity: string; status: string; lastDetectedAt: string }[];
  recommendations: { title: string; description: string }[];
  permissionViolationsNote: string;
}

const sectionTitle: React.CSSProperties = { fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 12 };

export function SecurityExtras() {
  const { data, isLoading } = useQuery({
    queryKey: ["developer-security"],
    queryFn:  () => fetchWithAuth("/api/developer/security"),
  });

  const sec: SecurityData | undefined = data?.data;

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-24" />)}</div>;
  if (!sec) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatTile label="تجاوزات الحد (24س)" value={sec.rateLimitEvents} icon="🚦" tone={sec.rateLimitEvents > 20 ? "warning" : "neutral"} />
        <StatTile label="عناوين IP مشبوهة" value={sec.suspiciousIps.length} icon="🕵️" tone={sec.suspiciousIps.length > 0 ? "bad" : "good"} />
        <StatTile label="حوادث أمنية" value={sec.securityIncidents.length} icon="🧩" />
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ ...sectionTitle, marginBottom: 0 }}>توصيات أمنية</h2>
          <a
            href="/api/developer/security/export"
            style={{
              background: "#fff", color: "#1A6B47", border: "1.5px solid #1A6B47", borderRadius: 8,
              padding: "6px 14px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 12, textDecoration: "none",
            }}
          >
            ⬇️ تصدير أحداث الأمان CSV
          </a>
        </div>
        <div className="space-y-2">
          {sec.recommendations.map((r, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
              <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 13 }}>{r.title}</p>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12.5, marginTop: 3 }}>{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suspicious IPs */}
      {sec.suspiciousIps.length > 0 && (
        <div>
          <h2 style={sectionTitle}>عناوين IP مشبوهة</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            {sec.suspiciousIps.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: i < sec.suspiciousIps.length - 1 ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
                <code style={{ fontFamily: "monospace", fontSize: 13, color: "#1A1208" }}>{s.ip}</code>
                <span style={{ fontFamily: "Cairo,sans-serif", color: "#B3261E", fontSize: 12.5, fontWeight: 700 }}>{s.count} حدث</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related security incidents */}
      {sec.securityIncidents.length > 0 && (
        <div>
          <h2 style={sectionTitle}>حوادث أمنية</h2>
          <div className="space-y-2">
            {sec.securityIncidents.map((inc) => (
              <Link key={inc.id} href={`/developer/incidents/${inc.id}`} style={{ textDecoration: "none" }}>
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <IncidentSeverityBadge severity={inc.severity} />
                  <IncidentStatusBadge status={inc.status} />
                  <p style={{ flex: 1, fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13 }}>{inc.title}</p>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11 }}>{formatIncidentDateTime(inc.lastDetectedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11.5, fontStyle: "italic" }}>
        ℹ️ {sec.permissionViolationsNote}
      </p>
    </div>
  );
}
