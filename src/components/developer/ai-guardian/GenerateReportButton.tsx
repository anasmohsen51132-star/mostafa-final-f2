"use client";
// src/components/developer/ai-guardian/GenerateReportButton.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";

export function GenerateReportButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const toast  = useToast();
  const qc     = useQueryClient();
  const [windowHours, setWindowHours] = useState(24);

  const generate = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/developer/ai-guardian/reports", {
        method: "POST",
        body: JSON.stringify({ windowHours }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم توليد تقرير جديد");
        qc.invalidateQueries({ queryKey: ["ai-guardian-reports"] });
        router.push(`/developer/ai-guardian/report/${res.data.id}`);
      } else {
        toast.error(res.error ?? "فشل توليد التقرير");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!compact && (
        <select
          value={windowHours}
          onChange={(e) => setWindowHours(Number(e.target.value))}
          style={{
            padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.25)",
            background: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208",
            outline: "none", direction: "rtl", cursor: "pointer",
          }}
        >
          <option value={6}>آخر 6 ساعات</option>
          <option value={24}>آخر 24 ساعة</option>
          <option value={72}>آخر 3 أيام</option>
          <option value={168}>آخر أسبوع</option>
        </select>
      )}
      <button
        onClick={() => generate.mutate()}
        disabled={generate.isPending}
        style={{
          background: "linear-gradient(135deg,#C9A84C,#8B6914)", color: "#1A1208",
          border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700,
          fontFamily: "Cairo,sans-serif", fontSize: 13.5, cursor: generate.isPending ? "default" : "pointer",
          opacity: generate.isPending ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8,
        }}
      >
        {generate.isPending ? "🧠 جاري التحليل..." : "🧠 توليد تقرير جديد"}
      </button>
    </div>
  );
}
