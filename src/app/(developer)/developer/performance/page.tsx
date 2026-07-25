"use client";
// src/app/(developer)/developer/performance/page.tsx
//
// Task 3, Section 2 (Live Metrics). Replaces the previous ComingSoonModule
// placeholder now that real data exists (src/lib/monitoring/apiMetrics.ts).
import { m as motion } from "framer-motion";
import { useMonitoring } from "@/hooks/useMonitoring";
import { StatTile } from "@/components/developer/monitoring/StatTile";
import { MiniBarList } from "@/components/developer/monitoring/MiniBarList";
import { SkeletonGrid } from "@/components/developer/monitoring/SkeletonGrid";

export default function PerformancePage() {
  const { snapshot, isLoading } = useMonitoring();
  const api = snapshot?.api;

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
          ⚡ الأداء المباشر
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          {api && api.sampleSize > 0
            ? `مبني على ${api.sampleSize} طلب مسجَّل خلال آخر ٢٤ ساعة`
            : "لا توجد بيانات كافية بعد — تُجمع فقط من النقاط المزوّدة بالمراقبة"}
        </p>
      </motion.div>

      {isLoading && !snapshot ? (
        <SkeletonGrid />
      ) : api ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatTile
              label="متوسط زمن الاستجابة"
              value={api.avgResponseMs !== null ? `${api.avgResponseMs} ms` : "—"}
              icon="⏱️"
            />
            <StatTile label="طلبات آخر دقيقة" value={api.requestsLastMinute} icon="📶" />
            <StatTile label="طلبات آخر ساعة" value={api.requestsLastHour} icon="📈" />
            <StatTile
              label="نسبة النجاح"
              value={api.successRatePct !== null ? `${api.successRatePct}%` : "—"}
              icon="✅"
              tone={api.successRatePct !== null && api.successRatePct < 95 ? "warning" : "good"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div
              className="rounded-2xl p-5"
              style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 4px 16px rgba(26,18,8,0.05)" }}
            >
              <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                أبطأ النقاط (متوسط الزمن)
              </h3>
              <MiniBarList
                items={api.slowestEndpoints.map((e) => ({ label: e.route, value: e.avgMs, sub: `${e.count} طلب` }))}
                valueLabel={(v) => `${v} ms`}
              />
            </div>

            <div
              className="rounded-2xl p-5 flex flex-col justify-center"
              style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 4px 16px rgba(26,18,8,0.05)" }}
            >
              <StatTile
                label="طلبات فاشلة (٢٤ ساعة)"
                value={api.failedRequests}
                icon="❌"
                tone={api.failedRequests > 0 ? "warning" : "good"}
              />
              {api.sampleSize === 0 && (
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, marginTop: 12 }}>
                  هذه الصفحة نفسها ونقاط المراقبة الأخرى تُسجَّل تلقائياً؛ باقي نقاط الـ API الحالية
                  ستُضاف تدريجياً دون أي تعديل على سلوكها.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
          تعذّر تحميل بيانات الأداء الآن.
        </p>
      )}
    </div>
  );
}
