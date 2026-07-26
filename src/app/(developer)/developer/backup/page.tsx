"use client";
// src/app/(developer)/developer/backup/page.tsx
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";

interface BackupStatus {
  available: boolean; lastBackupAt: string | null; backupHealthy: boolean | null;
  storageHealthy: boolean | null; recoveryReadiness: string; recommendations: string[];
}

export default function BackupPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["developer-backup"],
    queryFn:  () => fetchWithAuth("/api/developer/backup"),
  });

  const status: BackupStatus | undefined = data?.data;

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>💾 النسخ الاحتياطي والاستعادة</h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>حالة قاعدة البيانات، جاهزية الاستعادة</p>
      </motion.div>

      {isLoading && <div className="skeleton rounded-2xl h-40" />}

      {!isLoading && status && !status.available && (
        <div className="rounded-2xl p-8" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            ⚠️ غير متصل بـ Neon API
          </p>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.9, marginBottom: 12 }}>
            البنية التحتية والواجهة جاهزتين — بس مفيش ربط حقيقي ببيانات Neon لسه (عمدًا، حسب الاتفاق). عشان يشتغل فعليًا:
            اضبط <code style={{ fontFamily: "monospace" }}>NEON_API_KEY</code> و <code style={{ fontFamily: "monospace" }}>NEON_PROJECT_ID</code>،
            وابني <code style={{ fontFamily: "monospace" }}>NeonBackupProvider</code> اللي بيطابق نفس الواجهة
            في <code style={{ fontFamily: "monospace" }}>src/lib/backup/types.ts</code>، وبدّلها في{" "}
            <code style={{ fontFamily: "monospace" }}>src/lib/backup/registry.ts</code>.
          </p>
          {status.recommendations.map((r, i) => (
            <p key={i} style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12.5 }}>💡 {r}</p>
          ))}
        </div>
      )}

      {!isLoading && status?.available && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>آخر نسخة احتياطية</p>
            <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 15, marginTop: 4 }}>{status.lastBackupAt ?? "—"}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>جاهزية الاستعادة</p>
            <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 15, marginTop: 4 }}>{status.recoveryReadiness}</p>
          </div>
        </div>
      )}
    </div>
  );
}
