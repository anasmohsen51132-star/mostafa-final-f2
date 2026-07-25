"use client";
// src/app/(developer)/developer/ai-guardian/predictions/page.tsx
import Link from "next/link";
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { PredictionCard } from "@/components/developer/ai-guardian/GuardianCards";
import { formatGuardianDateTime } from "@/components/developer/ai-guardian/guardianMeta";
import type { GuardianReport } from "@/lib/ai-guardian/reportSchema";

interface ReportRecord {
  id: string; createdAt: string; reportJson: GuardianReport;
}

export default function PredictionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ai-guardian-reports", "latest-full"],
    queryFn:  () => fetchWithAuth("/api/developer/ai-guardian/reports?page=1&limit=1"),
  });

  const latestId: string | undefined = data?.data?.reports?.[0]?.id;

  const { data: reportData, isLoading: loadingReport } = useQuery({
    queryKey: ["ai-guardian-report", latestId],
    queryFn:  () => fetchWithAuth(`/api/developer/ai-guardian/reports/${latestId}`),
    enabled: Boolean(latestId),
  });

  const report: ReportRecord | undefined = reportData?.data;
  const predictions = report?.reportJson.predictions ?? [];
  const loading = isLoading || loadingReport;

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>🔮 التنبؤات</h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          {report ? `من آخر تقرير — ${formatGuardianDateTime(report.createdAt)} — كل التنبؤات تقديرية وليست مؤكدة` : "لا يوجد تقرير بعد"}
        </p>
      </motion.div>

      {loading && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-40" />)}</div>}

      {!loading && !latestId && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}>
            لا يوجد أي تقرير بعد.{" "}
            <Link href="/developer/ai-guardian" style={{ color: "#1A6B47", fontWeight: 700 }}>اذهب للوحة AI Guardian</Link> لتوليد أول تقرير.
          </p>
        </div>
      )}

      {!loading && latestId && predictions.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}>لا توجد تنبؤات في آخر تقرير</p>
        </div>
      )}

      {!loading && predictions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {predictions.map((p, i) => <PredictionCard key={i} prediction={p} />)}
        </div>
      )}
    </div>
  );
}
