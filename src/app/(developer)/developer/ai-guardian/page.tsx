"use client";
// src/app/(developer)/developer/ai-guardian/page.tsx
import Link from "next/link";
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { GenerateReportButton } from "@/components/developer/ai-guardian/GenerateReportButton";
import { ScoreGauge, StatusBadge } from "@/components/developer/ai-guardian/GuardianBadges";
import { formatGuardianDateTime } from "@/components/developer/ai-guardian/guardianMeta";

interface ReportRow {
  id: string; provider: string; model: string; windowHours: number;
  platformScore: number; status: string; summary: string; createdAt: string;
}

const NAV_CARDS = [
  { href: "/developer/ai-guardian/insights",    icon: "💡", label: "الرؤى (Insights)" },
  { href: "/developer/ai-guardian/predictions", icon: "🔮", label: "التنبؤات" },
  { href: "/developer/ai-guardian/incidents",   icon: "🧩", label: "تحليل الحوادث" },
  { href: "/developer/ai-guardian/history",     icon: "🕓", label: "السجل التاريخي" },
];

export default function AiGuardianHub() {
  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ["ai-guardian-reports", "latest"],
    queryFn:  () => fetchWithAuth("/api/developer/ai-guardian/reports?page=1&limit=1"),
  });

  const { data: providersData } = useQuery({
    queryKey: ["ai-guardian-providers"],
    queryFn:  () => fetchWithAuth("/api/developer/ai-guardian/providers"),
  });

  const latest: ReportRow | undefined = reportsData?.data?.reports?.[0];
  const providers = providersData?.data?.providers ?? [];
  const activeProviderId = providersData?.data?.active;
  const activeProvider = providers.find((p: { id: string }) => p.id === activeProviderId);
  const noProviderConfigured = providersData?.data && !activeProvider?.configured;

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
            🛡️ AI Guardian
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            محرك تحليل داخلي — للقراءة فقط، ولا يتخذ أي إجراء تلقائي على المنصة
          </p>
        </div>
        <GenerateReportButton />
      </motion.div>

      {noProviderConfigured && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(179,38,30,0.06)", border: "1px solid rgba(179,38,30,0.2)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#B3261E", fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>
            ⚠️ لا يوجد مزود ذكاء اصطناعي مُفعَّل
          </p>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13 }}>
            اضبط متغير البيئة <code style={{ fontFamily: "monospace" }}>AI_GUARDIAN_PROVIDER</code> (claude/openai/gemini) ومفتاح الـ API المطابق قبل توليد أي تقرير.
          </p>
        </div>
      )}

      {/* Latest report summary */}
      {loadingReports && <div className="skeleton rounded-3xl h-52 mb-6" />}

      {!loadingReports && !latest && (
        <div className="rounded-3xl p-10 text-center mb-6" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            لا يوجد أي تقرير بعد — اضغط "توليد تقرير جديد" لأول تحليل لصحة المنصة
          </p>
        </div>
      )}

      {latest && (
        <Link href={`/developer/ai-guardian/report/${latest.id}`} style={{ textDecoration: "none" }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-8 mb-6 flex flex-wrap items-center gap-8"
            style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", boxShadow: "0 8px 40px rgba(13,61,39,0.3)", cursor: "pointer" }}
          >
            <ScoreGauge score={latest.platformScore} status={latest.status} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={latest.status} />
                <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.6)", fontSize: 12 }}>
                  {formatGuardianDateTime(latest.createdAt)} · {latest.provider}
                </span>
              </div>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#F5F1E8", fontSize: 15, lineHeight: 1.8 }}>
                {latest.summary}
              </p>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {NAV_CARDS.map((c) => (
          <Link key={c.href} href={c.href} style={{ textDecoration: "none" }}>
            <motion.div whileHover={{ y: -4 }} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
              <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 14 }}>{c.label}</p>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, marginTop: 4 }}>من آخر تقرير</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
