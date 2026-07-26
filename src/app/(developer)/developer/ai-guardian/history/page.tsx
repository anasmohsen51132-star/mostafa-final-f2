"use client";
// src/app/(developer)/developer/ai-guardian/history/page.tsx
import { useState } from "react";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { GenerateReportButton } from "@/components/developer/ai-guardian/GenerateReportButton";
import { StatusBadge } from "@/components/developer/ai-guardian/GuardianBadges";
import { LogPagination } from "@/components/developer/logs/LogPagination";
import { formatGuardianDateTime } from "@/components/developer/ai-guardian/guardianMeta";

interface ReportRow {
  id: string; provider: string; model: string; windowHours: number;
  platformScore: number; status: string; summary: string; createdAt: string;
}

const PAGE_SIZE = 15;

export default function HistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-guardian-reports", "history", page],
    queryFn:  () => fetchWithAuth(`/api/developer/ai-guardian/reports?page=${page}&limit=${PAGE_SIZE}`),
  });

  const reports: ReportRow[] = data?.data?.reports ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>🕓 السجل التاريخي</h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>{total} تقرير تم توليده</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/developer/ai-guardian/reports/export"
            style={{
              background: "#fff", color: "#1A6B47", border: "1.5px solid #1A6B47", borderRadius: 10,
              padding: "9px 16px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 13, textDecoration: "none",
            }}
          >
            ⬇️ تصدير CSV
          </a>
          <GenerateReportButton compact />
        </div>
      </motion.div>

      {isLoading && <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-xl h-20" />)}</div>}

      {!isLoading && reports.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}>لا يوجد أي تقرير بعد</p>
        </div>
      )}

      {!isLoading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link key={r.id} href={`/developer/ai-guardian/report/${r.id}`} style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ x: -3 }}
                className="rounded-2xl p-5 flex flex-wrap items-center gap-4"
                style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", cursor: "pointer" }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(201,168,76,0.1)", fontFamily: "Amiri,serif", fontWeight: 700, fontSize: 16, color: "#8B6914",
                }}>
                  {r.platformScore}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={r.status} />
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11.5 }}>
                      {formatGuardianDateTime(r.createdAt)} · {r.provider} · آخر {r.windowHours} ساعة
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {r.summary}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      <LogPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
