"use client";
// src/app/(developer)/developer/ai-guardian/report/[id]/page.tsx
import { useParams, useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { ScoreGauge, StatusBadge } from "@/components/developer/ai-guardian/GuardianBadges";
import { IncidentCard } from "@/components/developer/ai-guardian/IncidentCard";
import { InsightCard, PredictionCard, RecommendationCard, ComponentHealthGrid } from "@/components/developer/ai-guardian/GuardianCards";
import { formatGuardianDateTime } from "@/components/developer/ai-guardian/guardianMeta";
import type { GuardianReport } from "@/lib/ai-guardian/reportSchema";

interface ReportRecord {
  id: string; provider: string; model: string; windowHours: number;
  platformScore: number; status: string; summary: string;
  reportJson: GuardianReport; tokensUsed: number | null; createdAt: string;
}

const sectionTitle: React.CSSProperties = { fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 14 };

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["ai-guardian-report", id],
    queryFn:  () => fetchWithAuth(`/api/developer/ai-guardian/reports/${id}`),
  });

  const report: ReportRecord | undefined = data?.data;
  const notFound = !isLoading && !data?.success;
  const g = report?.reportJson;

  return (
    <div style={{ direction: "rtl" }}>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#1A6B47", fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer", padding: 0 }}
        >
          → رجوع
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: "#1A6B47", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 12.5, cursor: "pointer" }}
        >
          🖨️ تصدير PDF (طباعة)
        </button>
      </div>

      {isLoading && <div className="skeleton rounded-3xl h-64" />}
      {notFound && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}>التقرير غير موجود</p>
        </div>
      )}

      {report && g && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="rounded-3xl p-8 flex flex-wrap items-center gap-8" style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", boxShadow: "0 8px 40px rgba(13,61,39,0.3)" }}>
            <ScoreGauge score={report.platformScore} status={report.status} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <StatusBadge status={report.status} />
                <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.6)", fontSize: 12 }}>
                  {formatGuardianDateTime(report.createdAt)} · {report.provider} ({report.model}) · آخر {report.windowHours} ساعة
                  {report.tokensUsed ? ` · ${report.tokensUsed} token` : ""}
                </span>
              </div>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#F5F1E8", fontSize: 16, lineHeight: 1.9 }}>
                {g.executiveSummary}
              </p>
            </div>
          </div>

          {/* Component health */}
          {g.componentHealth.length > 0 && (
            <section>
              <h2 style={sectionTitle}>صحة المكونات</h2>
              <ComponentHealthGrid components={g.componentHealth} />
            </section>
          )}

          {/* Critical incidents */}
          {g.criticalIncidents.length > 0 && (
            <section>
              <h2 style={sectionTitle}>🔴 حوادث حرجة</h2>
              <div className="space-y-3">
                {g.criticalIncidents.map((inc, i) => <IncidentCard key={i} incident={inc} />)}
              </div>
            </section>
          )}

          {/* Warnings */}
          {g.warnings.length > 0 && (
            <section>
              <h2 style={sectionTitle}>🟠 تحذيرات</h2>
              <div className="space-y-3">
                {g.warnings.map((inc, i) => <IncidentCard key={i} incident={inc} />)}
              </div>
            </section>
          )}

          {/* Recovered */}
          {g.recoveredProblems.length > 0 && (
            <section>
              <h2 style={sectionTitle}>✅ مشاكل تعافت</h2>
              <ul className="space-y-2">
                {g.recoveredProblems.map((p, i) => (
                  <li key={i} className="rounded-xl p-4" style={{ background: "rgba(26,107,71,0.06)", fontFamily: "Cairo,sans-serif", color: "#1A6B47", fontSize: 13.5 }}>
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Insights */}
          {g.insights.length > 0 && (
            <section>
              <h2 style={sectionTitle}>💡 رؤى</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {g.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              </div>
            </section>
          )}

          {/* Predictions */}
          {g.predictions.length > 0 && (
            <section>
              <h2 style={sectionTitle}>🔮 تنبؤات</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {g.predictions.map((p, i) => <PredictionCard key={i} prediction={p} />)}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {g.recommendations.length > 0 && (
            <section>
              <h2 style={sectionTitle}>📋 توصيات</h2>
              <div className="space-y-3">
                {g.recommendations.map((r, i) => <RecommendationCard key={i} recommendation={r} />)}
              </div>
            </section>
          )}

          {/* Technical notes */}
          {g.technicalNotes && (
            <section>
              <h2 style={sectionTitle}>ملاحظات تقنية</h2>
              <div className="rounded-2xl p-5" style={{ background: "#1A1208" }}>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#F5F1E8", fontSize: 13, lineHeight: 1.9 }}>{g.technicalNotes}</p>
              </div>
            </section>
          )}
        </motion.div>
      )}
    </div>
  );
}
