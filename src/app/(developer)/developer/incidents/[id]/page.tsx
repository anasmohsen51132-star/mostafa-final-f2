"use client";
// src/app/(developer)/developer/incidents/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { IncidentSeverityBadge, IncidentStatusBadge } from "@/components/developer/incidents/IncidentBadges";
import { CATEGORY_LABEL, formatIncidentDateTime } from "@/components/developer/incidents/incidentMeta";
import { PatchPreviewCard } from "@/components/developer/incidents/PatchPreviewCard";
import type { GuardianRootCause } from "@/lib/ai-guardian/reportSchema";

interface IncidentDetail {
  id: string; title: string; severity: string; status: string; category: string;
  firstDetectedAt: string; lastDetectedAt: string; occurrenceCount: number;
  rootCause: string | null; suggestedFix: string | null; aiAnalysis: GuardianRootCause | null;
  assignedTo: string | null; resolutionNotes: string | null;
}

interface PatchPreviewRow {
  id: string; problemSummary: string; likelyFiles: string[];
  suggestedChanges: { file: string; description: string; codeSnippet: string }[];
  expectedBenefits: string[]; possibleRisks: string[];
  approvalStatus: string; provider: string; createdAt: string;
}

const fieldLabel: React.CSSProperties = { fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, marginBottom: 6 };
const bodyText: React.CSSProperties = { fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13.5, lineHeight: 1.8 };
const selectStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.25)",
  background: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208", outline: "none", direction: "rtl", cursor: "pointer",
};

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["incident", id],
    queryFn:  () => fetchWithAuth(`/api/developer/incidents/${id}`),
  });

  const incident: IncidentDetail | undefined = data?.data;
  const notFound = !isLoading && !data?.success;

  useEffect(() => { if (incident) setNotes(incident.resolutionNotes ?? ""); }, [incident?.id]);

  const update = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      fetchWithAuth(`/api/developer/incidents/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم التحديث");
        qc.invalidateQueries({ queryKey: ["incident", id] });
        qc.invalidateQueries({ queryKey: ["incidents"] });
      } else toast.error(res.error ?? "فشل التحديث");
    },
  });

  const { data: previewsData } = useQuery({
    queryKey: ["patch-previews", id],
    queryFn:  () => fetchWithAuth(`/api/developer/patch-previews?incidentId=${id}`),
    enabled: Boolean(incident),
  });
  const previews: PatchPreviewRow[] = previewsData?.data?.previews ?? [];

  const generatePreview = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/developer/patch-previews", {
        method: "POST",
        body: JSON.stringify({
          incidentId: id,
          problemDescription: `${incident?.title} — ${incident?.rootCause ?? "لسه معملتش تحليل AI لهذه الحادثة"}`,
        }),
      }),
    onSuccess: (res) => {
      if (res.success) { toast.success("🧠 تم توليد معاينة الحل"); qc.invalidateQueries({ queryKey: ["patch-previews", id] }); }
      else toast.error(res.error ?? "فشل التوليد");
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  const analyze = useMutation({
    mutationFn: () => fetchWithAuth(`/api/developer/incidents/${id}/analyze`, { method: "POST" }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("🧠 تم التحليل");
        qc.invalidateQueries({ queryKey: ["incident", id] });
      } else toast.error(res.error ?? "فشل التحليل");
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  return (
    <div style={{ direction: "rtl" }}>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#1A6B47", fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer", padding: 0 }}>
          → رجوع
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: "#1A6B47", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 12.5, cursor: "pointer" }}
        >
          🖨️ تصدير PDF (طباعة)
        </button>
      </div>

      {isLoading && <div className="skeleton rounded-2xl h-64" />}
      {notFound && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}>الحادثة غير موجودة</p>
        </div>
      )}

      {incident && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Header */}
          <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <IncidentSeverityBadge severity={incident.severity} />
              <IncidentStatusBadge status={incident.status} />
              <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>{CATEGORY_LABEL[incident.category] ?? incident.category}</span>
            </div>
            <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 18, marginBottom: 16 }}>{incident.title}</p>

            {/* Timeline */}
            <div className="grid grid-cols-3 gap-4">
              <div><p style={fieldLabel}>أول ظهور</p><p style={bodyText}>{formatIncidentDateTime(incident.firstDetectedAt)}</p></div>
              <div><p style={fieldLabel}>آخر ظهور</p><p style={bodyText}>{formatIncidentDateTime(incident.lastDetectedAt)}</p></div>
              <div><p style={fieldLabel}>عدد مرات التكرار</p><p style={bodyText}>{incident.occurrenceCount}</p></div>
            </div>
          </div>

          {/* Workflow */}
          <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            <p style={{ ...fieldLabel, fontSize: 14, marginBottom: 12 }}>سير العمل</p>
            <div className="flex flex-wrap gap-3 mb-4">
              <select value={incident.status} onChange={(e) => update.mutate({ status: e.target.value })} style={selectStyle}>
                <option value="OPEN">مفتوحة</option><option value="INVESTIGATING">قيد الفحص</option>
                <option value="RESOLVED">محلولة</option><option value="CLOSED">مغلقة</option>
              </select>
            </div>
            <p style={fieldLabel}>ملاحظات الحل</p>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="اكتب ملاحظاتك عن التحقيق أو الحل..."
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.25)", fontFamily: "Cairo,sans-serif", fontSize: 13, outline: "none", direction: "rtl", resize: "vertical" }}
            />
            <button
              onClick={() => update.mutate({ resolutionNotes: notes })}
              disabled={update.isPending}
              style={{ marginTop: 10, background: "#1A6B47", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 12.5, cursor: "pointer" }}
            >
              حفظ الملاحظات
            </button>
          </div>

          {/* AI Analysis */}
          <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)" }}>
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontSize: 14, fontWeight: 700 }}>🧠 تحليل الذكاء الاصطناعي</p>
              <button
                onClick={() => analyze.mutate()}
                disabled={analyze.isPending}
                style={{
                  background: "#C9A84C", color: "#1A1208", border: "none", borderRadius: 10,
                  padding: "8px 16px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 12.5,
                  cursor: analyze.isPending ? "default" : "pointer", opacity: analyze.isPending ? 0.7 : 1,
                }}
              >
                {analyze.isPending ? "جاري التحليل..." : incident.aiAnalysis ? "إعادة التحليل" : "حلّل الآن"}
              </button>
            </div>

            {!incident.aiAnalysis && (
              <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.6)", fontSize: 13 }}>
                لسه معملتش تحليل لهذه الحادثة. اضغط "حلّل الآن" لتحليل السبب الجذري بالذكاء الاصطناعي.
              </p>
            )}

            {incident.aiAnalysis && (
              <div className="space-y-3">
                <div>
                  <p style={{ ...fieldLabel, color: "rgba(232,201,122,0.8)" }}>التفسير المحتمل</p>
                  <p style={{ ...bodyText, color: "#F5F1E8" }}>{incident.aiAnalysis.explanation}</p>
                </div>
                <div>
                  <p style={{ ...fieldLabel, color: "rgba(232,201,122,0.8)" }}>الحل المقترح</p>
                  <p style={{ ...bodyText, color: "#F5F1E8" }}>{incident.aiAnalysis.suggestedSolution}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p style={{ ...fieldLabel, color: "rgba(232,201,122,0.8)" }}>مستوى الثقة</p>
                    <p style={{ ...bodyText, color: "#F5F1E8" }}>{incident.aiAnalysis.confidence}%</p>
                  </div>
                  <div>
                    <p style={{ ...fieldLabel, color: "rgba(232,201,122,0.8)" }}>الأولوية</p>
                    <p style={{ ...bodyText, color: "#F5F1E8" }}>{incident.aiAnalysis.priority}</p>
                  </div>
                </div>
                {incident.aiAnalysis.investigationSteps.length > 0 && (
                  <div>
                    <p style={{ ...fieldLabel, color: "rgba(232,201,122,0.8)" }}>خطوات التحقيق</p>
                    <ol style={{ ...bodyText, color: "#F5F1E8", paddingRight: 18, listStyle: "decimal" }}>
                      {incident.aiAnalysis.investigationSteps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}
                <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 10.5, fontStyle: "italic" }}>
                  ⚠️ هذا تحليل تقديري من الذكاء الاصطناعي، ولا يُتخذ أي إجراء تلقائي بناءً عليه — القرار والتنفيذ للمطور دايمًا.
                </p>
              </div>
            )}
          </div>

          {/* Patch Preview */}
          <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 700 }}>🛠️ معاينة الحل (Patch Preview)</p>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11.5, marginTop: 2 }}>
                  معاينة نصية فقط — لا يتم تعديل أي ملف أو نشر أي شيء تلقائيًا
                </p>
              </div>
              <button
                onClick={() => generatePreview.mutate()}
                disabled={generatePreview.isPending}
                style={{
                  background: "#8B6914", color: "#fff", border: "none", borderRadius: 10,
                  padding: "8px 16px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 12.5,
                  cursor: generatePreview.isPending ? "default" : "pointer", opacity: generatePreview.isPending ? 0.7 : 1,
                }}
              >
                {generatePreview.isPending ? "جاري التوليد..." : "+ توليد معاينة"}
              </button>
            </div>

            {previews.length === 0 && (
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>لا توجد معاينات حل لهذه الحادثة بعد.</p>
            )}

            <div className="space-y-4">
              {previews.map((p) => <PatchPreviewCard key={p.id} preview={p} />)}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
