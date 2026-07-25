"use client";
// src/app/(developer)/developer/security/page.tsx
//
// Task 3, Section 5 (Authentication Monitor). Every number here maps to a
// specific, structured SystemLog signal — see
// src/lib/monitoring/authMetrics.ts's doc comment for exactly which route/
// category/severity/metadata combination each one is.
import { m as motion } from "framer-motion";
import Link from "next/link";
import { useMonitoring } from "@/hooks/useMonitoring";
import { StatTile } from "@/components/developer/monitoring/StatTile";
import { SkeletonGrid } from "@/components/developer/monitoring/SkeletonGrid";

export default function SecurityPage() {
  const { snapshot, isLoading } = useMonitoring();
  const auth = snapshot?.auth;

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
          🔐 مراقبة المصادقة
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          نشاط تسجيل الدخول والجلسات اليوم
        </p>
      </motion.div>

      {isLoading && !snapshot ? (
        <SkeletonGrid />
      ) : auth ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatTile label="تسجيلات دخول ناجحة" value={auth.successfulLoginsToday} icon="✅" tone="good" />
            <StatTile
              label="محاولات دخول فاشلة"
              value={auth.failedLoginsToday}
              icon="⛔"
              tone={auth.failedLoginsToday > 5 ? "warning" : "neutral"}
            />
            <StatTile
              label="طلبات غير مصرَّح بها"
              value={auth.unauthorizedRequestsToday}
              icon="🚫"
              tone={auth.unauthorizedRequestsToday > 10 ? "warning" : "neutral"}
            />
            <StatTile label="جلسات منتهية" value={auth.expiredSessionsToday} icon="⏳" />
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 4px 16px rgba(26,18,8,0.05)" }}
          >
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
              لتفاصيل كل حدث فردي (المستخدم، الـ IP، الوقت الدقيق)، راجع{" "}
              <Link href="/developer/monitoring" style={{ color: "#C9A84C", fontWeight: 700, textDecoration: "none" }}>
                أحداث النظام
              </Link>{" "}
              وفلترها بفئة AUTH أو SECURITY.
            </p>
          </div>
        </>
      ) : (
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
          تعذّر تحميل بيانات المصادقة الآن.
        </p>
      )}
    </div>
  );
}
