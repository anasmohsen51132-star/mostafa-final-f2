"use client";
// src/app/(developer)/developer/deployments/page.tsx
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";

interface DeploymentRecord {
  id: string; version: string | null; commit: string | null; environment: string;
  status: string; durationMs: number | null; createdAt: string; rollbackReady: boolean;
}

export default function DeploymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["developer-deployments"],
    queryFn:  () => fetchWithAuth("/api/developer/deployments"),
  });

  const configured: boolean = data?.data?.configured ?? false;
  const deployments: DeploymentRecord[] = data?.data?.deployments ?? [];

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>🚀 عمليات النشر</h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>تاريخ عمليات النشر، الحالة، وجاهزية التراجع</p>
      </motion.div>

      {isLoading && <div className="skeleton rounded-2xl h-40" />}

      {!isLoading && !configured && (
        <div className="rounded-2xl p-8" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            ⚠️ غير متصل بـ Vercel API
          </p>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.9 }}>
            البنية التحتية والواجهة جاهزتين — بس مفيش ربط حقيقي ببيانات Vercel لسه (عمدًا، حسب الاتفاق). عشان يشتغل فعليًا:
            اضبط <code style={{ fontFamily: "monospace" }}>VERCEL_TOKEN</code> و <code style={{ fontFamily: "monospace" }}>VERCEL_PROJECT_ID</code>،
            وابني <code style={{ fontFamily: "monospace" }}>VercelDeploymentProvider</code> اللي بيطابق نفس الواجهة
            في <code style={{ fontFamily: "monospace" }}>src/lib/deployments/types.ts</code>، وبدّلها في{" "}
            <code style={{ fontFamily: "monospace" }}>src/lib/deployments/registry.ts</code> — مفيش أي كود تاني هيحتاج يتغيّر.
          </p>
        </div>
      )}

      {!isLoading && configured && deployments.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}>لا توجد عمليات نشر مسجّلة بعد</p>
        </div>
      )}

      {!isLoading && deployments.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
          {deployments.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < deployments.length - 1 ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
              <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 11, fontWeight: 700, background: "rgba(201,168,76,0.1)", padding: "3px 8px", borderRadius: 8 }}>{d.environment}</span>
              <code style={{ fontFamily: "monospace", fontSize: 12, color: "#4A3F2A" }}>{d.commit ?? "—"}</code>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 12, color: "#7A6E5A" }}>{d.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
