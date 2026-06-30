"use client";
// src/app/(admin)/admin/page.tsx
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/ui/StatCard";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import type { PlatformStats } from "@/types";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: statsRes, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn:  () => fetchWithAuth("/api/stats"),
    refetchInterval: 30_000,
  });

  const stats: PlatformStats | null = statsRes?.data ?? null;

  const quickActions = [
    { icon: "📚", label: "إضافة كورس",       href: "/admin/courses/new",  color: "#C9A84C" },
    { icon: "🎬", label: "إضافة محاضرة",     href: "/admin/lectures/new", color: "#2D9E6B" },
    { icon: "🎟️", label: "توليد كودات",       href: "/admin/codes",        color: "#C9A84C" },
    { icon: "📝", label: "إنشاء اختبار",      href: "/admin/quiz-builder", color: "#2D9E6B" },
  ];

  const navCards = [
    {
      icon: "📚", title: "الكورسات",
      desc: "إنشاء وتعديل الكورسات وإدارة المراحل الدراسية",
      href: "/admin/courses", count: stats?.totalCourses,
    },
    {
      icon: "🎬", title: "المحاضرات",
      desc: "إضافة المحاضرات وربطها بأكثر من كورس",
      href: "/admin/lectures", count: stats?.totalLectures,
    },
    {
      icon: "🎟️", title: "كودات الوصول",
      desc: "توليد وطباعة كودات دخول الطلاب وتصديرها",
      href: "/admin/codes", count: stats?.totalCodes,
    },
    {
      icon: "👥", title: "الطلاب",
      desc: "عرض وإدارة حسابات الطلاب وتفعيلهم",
      href: "/admin/students", count: stats?.totalStudents,
    },
    {
      icon: "📊", title: "نتائج الطلاب",
      desc: "عرض نتائج الاختبارات والواجبات لجميع الطلاب",
      href: "/admin/results",
    },
    {
      icon: "📝", title: "منشئ الاختبارات",
      desc: "بناء اختبارات متعددة الخيارات بالصور",
      href: "/admin/quiz-builder",
    },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", boxShadow: "0 8px 32px rgba(13,61,39,0.25)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="relative z-10">
            <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.7)", fontSize: 13, marginBottom: 4 }}>
              {user?.role === "OWNER" ? "👑 لوحة المالك" : "🔵 لوحة الإدارة"}
            </p>
            <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(22px,3.5vw,36px)", marginBottom: 6 }}>
              أهلاً، {user?.name}
            </h1>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.6)", fontSize: 14 }}>
              إجمالي الطلاب:{" "}
              <span style={{ color: "#C9A84C", fontWeight: 700 }}>{stats?.totalStudents ?? "—"}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {!isLoading && stats && (
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { icon: "👥", value: stats.totalStudents,  label: "طالب",         color: "emerald" as const, delay: 0    },
            { icon: "📚", value: stats.totalCourses,   label: "كورس",         color: "gold"    as const, delay: 0.07 },
            { icon: "🎬", value: stats.totalLectures,  label: "محاضرة",       color: "emerald" as const, delay: 0.14 },
            { icon: "🎟️", value: stats.totalCodes,     label: "كود كلي",      color: "gold"    as const, delay: 0.21 },
            { icon: "✅", value: stats.codesUsed,      label: "كود مستخدم",   color: "emerald" as const, delay: 0.28 },
            { icon: "🔑", value: stats.codesAvailable, label: "كود متاح",     color: "gold"    as const, delay: 0.35 },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <StatCard {...s} withAnimation />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-28" />)}
        </div>
      )}

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
        <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 14 }}>
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <motion.div key={a.label} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Link href={a.href} style={{ textDecoration: "none" }}>
                <div className="rounded-2xl p-5 text-center"
                  style={{ background: "#fff", border: `1px solid ${a.color}22`,
                    boxShadow: "0 2px 12px rgba(26,18,8,0.05)", cursor: "pointer" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, fontWeight: 600 }}>
                    {a.label}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Navigation cards */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 14 }}>
          إدارة المنصة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {navCards.map((card) => (
            <motion.div key={card.title} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Link href={card.href} style={{ textDecoration: "none", display: "block" }}>
                <div className="rounded-2xl p-6 h-full"
                  style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)",
                    boxShadow: "0 2px 12px rgba(26,18,8,0.05)", cursor: "pointer" }}>
                  <div className="flex items-start justify-between mb-3">
                    <span style={{ fontSize: 28 }}>{card.icon}</span>
                    {card.count !== undefined && (
                      <span className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(201,168,76,0.12)", color: "#8B6914", fontFamily: "Cairo,sans-serif" }}>
                        {card.count}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    {card.title}
                  </h3>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.65 }}>
                    {card.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
