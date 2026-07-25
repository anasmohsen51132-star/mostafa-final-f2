"use client";
// src/components/developer/ai-guardian/IncidentCard.tsx
import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { PriorityBadge, ConfidenceBar } from "@/components/developer/ai-guardian/GuardianBadges";
import type { GuardianIncident } from "@/lib/ai-guardian/reportSchema";

const sectionLabel: React.CSSProperties = { fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, marginBottom: 6 };
const bodyText: React.CSSProperties = { fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13.5, lineHeight: 1.8 };

export function IncidentCard({ incident }: { incident: GuardianIncident }) {
  const [open, setOpen] = useState(false);
  const isCritical = incident.severity === "CRITICAL";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${isCritical ? "rgba(179,38,30,0.25)" : "rgba(201,168,76,0.2)"}`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-right flex items-center gap-3 p-5"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 20 }}>{isCritical ? "🔴" : "🟠"}</span>
        <div style={{ flex: 1, textAlign: "right" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 15 }}>{incident.title}</p>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12.5, marginTop: 2 }}>{incident.summary}</p>
        </div>
        <PriorityBadge priority={incident.rootCause.priority} />
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "#7A6E5A" }}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(201,168,76,0.12)", paddingTop: 16 }}>
              <div>
                <p style={sectionLabel}>التفسير المحتمل</p>
                <p style={bodyText}>{incident.rootCause.explanation}</p>
              </div>

              <ConfidenceBar confidence={incident.rootCause.confidence} />

              {incident.rootCause.evidence.length > 0 && (
                <div>
                  <p style={sectionLabel}>الأدلة الداعمة</p>
                  <ul style={{ ...bodyText, paddingRight: 18, listStyle: "disc" }}>
                    {incident.rootCause.evidence.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {incident.rootCause.alternativeHypotheses.length > 0 && (
                <div>
                  <p style={sectionLabel}>احتمالات بديلة</p>
                  <ul style={{ ...bodyText, paddingRight: 18, listStyle: "disc", color: "#7A6E5A" }}>
                    {incident.rootCause.alternativeHypotheses.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}

              <div>
                <p style={sectionLabel}>العواقب المحتملة</p>
                <p style={bodyText}>{incident.rootCause.potentialConsequences}</p>
              </div>

              {incident.rootCause.filesLikelyInvolved.length > 0 && (
                <div>
                  <p style={sectionLabel}>ملفات/أنظمة محتمل تورطها</p>
                  <div className="flex flex-wrap gap-2">
                    {incident.rootCause.filesLikelyInvolved.map((f, i) => (
                      <code key={i} style={{
                        fontFamily: "monospace", fontSize: 11.5, background: "rgba(26,18,8,0.05)",
                        padding: "3px 8px", borderRadius: 6, color: "#4A3F2A",
                      }}>{f}</code>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={sectionLabel}>خطوات التحقيق المقترحة</p>
                <ol style={{ ...bodyText, paddingRight: 18, listStyle: "decimal" }}>
                  {incident.rootCause.investigationSteps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>

              <div style={{ background: "rgba(26,107,71,0.06)", borderRadius: 12, padding: 14 }}>
                <p style={{ ...sectionLabel, color: "#1A6B47" }}>الحل المقترح</p>
                <p style={bodyText}>{incident.rootCause.suggestedSolution}</p>
              </div>

              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11.5 }}>
                النظام الفرعي: {incident.rootCause.subsystem}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
