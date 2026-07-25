"use client";
// src/app/(developer)/developer/database/page.tsx
//
// Task 3, Sections 3 (Database Monitor) and 4 (Storage Monitor) — combined
// on one page since Storage doesn't have its own module in
// developerModules.ts and both are "is core infrastructure up" concerns.
import { m as motion } from "framer-motion";
import { useMonitoring } from "@/hooks/useMonitoring";
import { HealthBadge } from "@/components/developer/monitoring/HealthBadge";
import { StatTile } from "@/components/developer/monitoring/StatTile";
import { SkeletonGrid } from "@/components/developer/monitoring/SkeletonGrid";

export default function DatabasePage() {
  const { snapshot, isLoading } = useMonitoring();
  const db = snapshot?.database;
  const storage = snapshot?.storage;

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
          🗄️ قاعدة البيانات والتخزين
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          حالة حية لاتصال قاعدة البيانات (Postgres/Neon) وتخزين الملفات (Vercel Blob)
        </p>
      </motion.div>

      {isLoading && !snapshot ? (
        <SkeletonGrid />
      ) : db && storage ? (
        <>
          <div
            className="rounded-2xl p-5 mb-5 flex items-center justify-between flex-wrap gap-3"
            style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 4px 16px rgba(26,18,8,0.05)" }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 22 }}>🗃️</span>
              <div>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 700 }}>قاعدة البيانات</p>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                  {db.connectionPoolConfigured ? "متصلة عبر pooler (Neon)" : "الاتصال غير مضبوط عبر pooler"}
                </p>
              </div>
            </div>
            <HealthBadge status={db.connected ? "HEALTHY" : "CRITICAL"} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatTile
              label="زمن استجابة الاستعلام"
              value={db.latencyMs !== null ? `${db.latencyMs} ms` : "—"}
              icon="⏱️"
              tone={db.latencyMs !== null && db.latencyMs > 500 ? "warning" : "good"}
            />
            <StatTile label="استعلامات فاشلة اليوم" value={db.failedQueriesToday} icon="⚠️" tone={db.failedQueriesToday > 0 ? "warning" : "good"} />
            <StatTile label="حالة الـ Connection Pool" value={db.connectionPoolConfigured ? "مفعّل" : "غير مفعّل"} icon="🔗" tone={db.connectionPoolConfigured ? "good" : "warning"} />
          </div>

          <div
            className="rounded-2xl p-5 mb-5 flex items-center justify-between flex-wrap gap-3"
            style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 4px 16px rgba(26,18,8,0.05)" }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 22 }}>📦</span>
              <div>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 700 }}>التخزين (Vercel Blob)</p>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                  {storage.configured ? "التوكن مضبوط" : "التوكن غير مضبوط"}
                </p>
              </div>
            </div>
            <HealthBadge status={storage.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatTile label="حالة التوكن" value={storage.configured ? "مضبوط" : "مفقود"} icon="🔑" tone={storage.configured ? "good" : "bad"} />
            <StatTile
              label="رفع ملفات فاشل اليوم"
              value={storage.failedUploadsToday}
              icon="📤"
              tone={storage.failedUploadsToday > 0 ? "warning" : "good"}
            />
          </div>
        </>
      ) : (
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
          تعذّر تحميل بيانات قاعدة البيانات الآن.
        </p>
      )}
    </div>
  );
}
