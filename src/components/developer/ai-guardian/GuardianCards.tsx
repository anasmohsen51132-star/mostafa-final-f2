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
  const difficultyLabel: Record<string, string> = { EASY: "سهلة", MODERATE: "متوسطة", HARD: "صعبة" };
  const impactLabel: Record<string, string> = { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "عالي" };

  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
      <div className="flex items-start gap-3">
        <span style={{ fontSize: 18 }}>💡</span>
        <div style={{ flex: 1 }}>
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 14 }}>{recommendation.title}</p>
            <PriorityBadge priority={recommendation.priority} />
          </div>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13, lineHeight: 1.8 }}>{recommendation.description}</p>

          {recommendation.reason && (
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>
              <strong>السبب:</strong> {recommendation.reason}
            </p>
          )}

          {(recommendation.difficulty || recommendation.estimatedImpact || recommendation.relatedComponent) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {recommendation.difficulty && (
                <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, background: "rgba(122,110,90,0.1)", color: "#4A3F2A", padding: "3px 9px", borderRadius: 8 }}>
                  الصعوبة: {difficultyLabel[recommendation.difficulty] ?? recommendation.difficulty}
                </span>
              )}
              {recommendation.estimatedImpact && (
                <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, background: "rgba(26,107,71,0.08)", color: "#1A6B47", padding: "3px 9px", borderRadius: 8 }}>
                  الأثر المتوقع: {impactLabel[recommendation.estimatedImpact] ?? recommendation.estimatedImpact}
                </span>
              )}
              {recommendation.relatedComponent && (
                <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, background: "rgba(201,168,76,0.12)", color: "#8B6914", padding: "3px 9px", borderRadius: 8 }}>
                  {recommendation.relatedComponent}
                </span>
              )}
            </div>
          )}

          {recommendation.suggestedInvestigation && (
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, lineHeight: 1.7, marginTop: 8, background: "rgba(201,168,76,0.06)", padding: 10, borderRadius: 8 }}>
              🔍 <strong>خطوة تحقق مقترحة:</strong> {recommendation.suggestedInvestigation}
            </p>
          )}
        </div>
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
