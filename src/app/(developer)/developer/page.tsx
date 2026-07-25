"use client";
// src/app/(developer)/developer/page.tsx
import { m as motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useMonitoring } from "@/hooks/useMonitoring";
import { ComingSoonCard } from "@/components/developer/ComingSoonCard";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { HealthBadge } from "@/components/developer/monitoring/HealthBadge";
import { StatTile } from "@/components/developer/monitoring/StatTile";
import { SkeletonGrid } from "@/components/developer/monitoring/SkeletonGrid";

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const { snapshot, isLoading } = useMonitoring();

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header banner — mirrors the owner/admin dashboard banners */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", boxShadow: "0 8px 40px rgba(13,61,39,0.3)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}
          />
          <motion.div
            className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.7)", fontSize: 13 }}>
                🛠️ لوحة المطور
              </span>
              {snapshot && <HealthBadge status={snapshot.health.status} size="sm" />}
            </div>
            <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(22px,3.5vw,40px)", marginTop: 4, marginBottom: 8 }}>
              أهلاً، {user?.name}
            </h1>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.65)", fontSize: 14 }}>
              مركز عمليات حي لصحة المنصة — يتحدّث تلقائياً كل ١٥ ثانية
            </p>
          </div>
        </div>
      </motion.div>

      {/* System Health + Platform Metrics — Sections 1 & 6 */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22 }}>
            صحة المنصة الآن
          </h2>
          {snapshot && (
            <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
              آخر تحديث: {new Date(snapshot.generatedAt).toLocaleTimeString("ar-EG")}
            </span>
          )}
        </div>

        {isLoading && !snapshot ? (
          <SkeletonGrid />
        ) : snapshot ? (
          <>
            {snapshot.health.reasons.length > 0 && (
              <div
                className="rounded-xl p-3 mb-4"
                style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 12 }}>
                  {snapshot.health.reasons.join(" · ")}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatTile
                label="مؤشر الصحة العام"
                value={`${snapshot.health.score}%`}
                icon="🩺"
                tone={snapshot.health.status === "HEALTHY" ? "good" : snapshot.health.status === "WARNING" ? "warning" : "bad"}
              />
              <StatTile label="مستخدمون نشطون الآن" value={snapshot.platform.activeUsersLast15Min} icon="👥" subLabel="آخر ١٥ دقيقة" />
              <StatTile label="طلبات اليوم" value={snapshot.platform.requestsToday} icon="📡" subLabel="نطاقات مراقَبة فقط" />
              <StatTile
                label="أحداث حرجة اليوم"
                value={snapshot.platform.criticalEventsToday}
                icon="🚨"
                tone={snapshot.platform.criticalEventsToday > 0 ? "bad" : "good"}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatTile label="مشرفون متصلون" value={snapshot.platform.onlineAdminsLast15Min} icon="🧑‍💼" />
              <StatTile label="أصحاب منصة متصلون" value={snapshot.platform.onlineOwnersLast15Min} icon="👑" />
              <StatTile label="جلسات نشطة" value={snapshot.platform.currentSessions} icon="🔐" />
              <StatTile
                label="أخطاء / تحذيرات اليوم"
                value={`${snapshot.platform.errorsToday} / ${snapshot.platform.warningsToday}`}
                icon="⚠️"
                tone={snapshot.platform.errorsToday > 0 ? "warning" : "good"}
              />
            </div>
          </>
        ) : (
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
            تعذّر تحميل بيانات المراقبة الآن.
          </p>
        )}
      </motion.div>

      {/* Module cards — genuinely still-upcoming modules only */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24, marginBottom: 16 }}>
          قريباً
        </h2>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {DEVELOPER_MODULES.filter((mod) => !mod.isLive).map((mod) => (
            <StaggerItem key={mod.id}>
              <ComingSoonCard module={mod} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </motion.div>
    </div>
  );
}
