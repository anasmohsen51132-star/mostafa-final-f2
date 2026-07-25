"use client";
// src/components/developer/ai-guardian/GuardianCards.tsx
import { InsightSeverityBadge, PriorityBadge, ConfidenceBar } from "@/components/developer/ai-guardian/GuardianBadges";
import { CATEGORY_LABEL, COMPONENT_LABEL, RISK_META, STATUS_META } from "@/components/developer/ai-guardian/guardianMeta";
import type { GuardianInsight, GuardianPrediction, GuardianRecommendation, GuardianComponentHealth } from "@/lib/ai-guardian/reportSchema";

export function InsightCard({ insight }: { insight: GuardianInsight }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, color: "#7A6E5A" }}>{CATEGORY_LABEL[insight.category] ?? insight.category}</span>
        <InsightSeverityBadge severity={insight.severity} />
      </div>
      <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 14.5, marginBottom: 6 }}>{insight.title}</p>
      <p style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13, lineHeight: 1.8 }}>{insight.description}</p>
    </div>
  );
}

export function PredictionCard({ prediction }: { prediction: GuardianPrediction }) {
  const risk = RISK_META[prediction.risk] ?? RISK_META.OTHER;
  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 18 }}>{risk.icon}</span>
        <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, color: "#7A6E5A" }}>{risk.label}</span>
      </div>
      <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 14.5, marginBottom: 6 }}>{prediction.title}</p>
      <p style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13, lineHeight: 1.8, marginBottom: 12 }}>{prediction.description}</p>
      <ConfidenceBar confidence={prediction.confidence} />
      <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 10.5, marginTop: 8, fontStyle: "italic" }}>
        ⚠️ هذا تقدير احتمالي مبني على الأنماط الحالية، وليس يقينًا مؤكدًا.
      </p>
    </div>
  );
}

export function RecommendationCard({ recommendation }: { recommendation: GuardianRecommendation }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-3" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
      <span style={{ fontSize: 18 }}>💡</span>
      <div style={{ flex: 1 }}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 14 }}>{recommendation.title}</p>
          <PriorityBadge priority={recommendation.priority} />
        </div>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13, lineHeight: 1.8 }}>{recommendation.description}</p>
      </div>
    </div>
  );
}

export function ComponentHealthGrid({ components }: { components: GuardianComponentHealth[] }) {
  if (components.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {components.map((c, i) => {
        const meta = STATUS_META[c.status] ?? STATUS_META.UNKNOWN;
        return (
          <div key={i} className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${meta.color}33` }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: 13, color: "#1A1208" }}>
                {COMPONENT_LABEL[c.name] ?? c.name}
              </span>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: meta.color, display: "inline-block" }} />
            </div>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, lineHeight: 1.7 }}>{c.summary}</p>
          </div>
        );
      })}
    </div>
  );
}
