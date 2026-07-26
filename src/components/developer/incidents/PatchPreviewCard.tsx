"use client";
// src/components/developer/incidents/PatchPreviewCard.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";

interface SuggestedChange { file: string; description: string; codeSnippet: string }
interface PatchPreview {
  id: string; problemSummary: string; likelyFiles: string[];
  suggestedChanges: SuggestedChange[]; expectedBenefits: string[]; possibleRisks: string[];
  approvalStatus: string; provider: string; createdAt: string;
}

const APPROVAL_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "بانتظار المراجعة", color: "#8B6914", bg: "rgba(201,168,76,0.14)" },
  APPROVED: { label: "معتمدة (للمراجعة فقط — لم يُطبَّق شيء تلقائيًا)", color: "#1A6B47", bg: "rgba(26,107,71,0.1)" },
  REJECTED: { label: "مرفوضة", color: "#B3261E", bg: "rgba(179,38,30,0.08)" },
};

const fieldLabel: React.CSSProperties = { fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, marginBottom: 6 };
const bodyText: React.CSSProperties = { fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13.5, lineHeight: 1.8 };

export function PatchPreviewCard({ preview }: { preview: PatchPreview }) {
  const toast = useToast();
  const qc = useQueryClient();
  const meta = APPROVAL_META[preview.approvalStatus] ?? APPROVAL_META.PENDING;

  const setStatus = useMutation({
    mutationFn: (approvalStatus: string) =>
      fetchWithAuth(`/api/developer/patch-previews/${preview.id}`, { method: "PATCH", body: JSON.stringify({ approvalStatus }) }),
    onSuccess: (res) => {
      if (res.success) { toast.success("✅ تم التحديث"); qc.invalidateQueries({ queryKey: ["patch-previews"] }); }
      else toast.error(res.error ?? "فشل التحديث");
    },
  });

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.2)" }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 10px", borderRadius: 20 }}>
          {meta.label}
        </span>
        <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11 }}>{preview.provider}</span>
      </div>

      <div>
        <p style={fieldLabel}>ملخص المشكلة</p>
        <p style={bodyText}>{preview.problemSummary}</p>
      </div>

      {preview.likelyFiles.length > 0 && (
        <div>
          <p style={fieldLabel}>ملفات محتمل تورطها (تقديري)</p>
          <div className="flex flex-wrap gap-2">
            {preview.likelyFiles.map((f, i) => (
              <code key={i} style={{ fontFamily: "monospace", fontSize: 11.5, background: "rgba(26,18,8,0.05)", padding: "3px 8px", borderRadius: 6, color: "#4A3F2A" }}>{f}</code>
            ))}
          </div>
        </div>
      )}

      {preview.suggestedChanges.length > 0 && (
        <div>
          <p style={fieldLabel}>تغييرات مقترحة (توضيحية — للمراجعة اليدوية فقط)</p>
          <div className="space-y-3">
            {preview.suggestedChanges.map((c, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: "rgba(201,168,76,0.05)" }}>
                <code style={{ fontFamily: "monospace", fontSize: 12, color: "#8B6914", fontWeight: 700 }}>{c.file}</code>
                <p style={{ ...bodyText, fontSize: 12.5, marginTop: 4, marginBottom: 8 }}>{c.description}</p>
                <pre style={{
                  background: "#1A1208", color: "#F5F1E8", fontFamily: "monospace", fontSize: 11.5,
                  padding: 12, borderRadius: 8, overflowX: "auto", direction: "ltr", textAlign: "left", margin: 0,
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {c.codeSnippet}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {preview.expectedBenefits.length > 0 && (
          <div>
            <p style={{ ...fieldLabel, color: "#1A6B47" }}>الفوائد المتوقعة</p>
            <ul style={{ ...bodyText, paddingRight: 16, listStyle: "disc", fontSize: 12.5 }}>
              {preview.expectedBenefits.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
        {preview.possibleRisks.length > 0 && (
          <div>
            <p style={{ ...fieldLabel, color: "#B3261E" }}>مخاطر محتملة</p>
            <ul style={{ ...bodyText, paddingRight: 16, listStyle: "disc", fontSize: 12.5 }}>
              {preview.possibleRisks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>

      {preview.approvalStatus === "PENDING" && (
        <div className="flex gap-2">
          <button onClick={() => setStatus.mutate("APPROVED")} style={{ background: "#1A6B47", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: "Cairo,sans-serif", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            اعتماد للمراجعة
          </button>
          <button onClick={() => setStatus.mutate("REJECTED")} style={{ background: "#fff", color: "#B3261E", border: "1px solid #B3261E", borderRadius: 8, padding: "7px 16px", fontFamily: "Cairo,sans-serif", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            رفض
          </button>
        </div>
      )}

      <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 10.5, fontStyle: "italic" }}>
        ⚠️ هذه معاينة نصية فقط. لا يتم تطبيق أي كود أو تعديل أي ملف تلقائيًا — أي تنفيذ فعلي مسؤولية المطور يدويًا بعد المراجعة.
      </p>
    </div>
  );
}
