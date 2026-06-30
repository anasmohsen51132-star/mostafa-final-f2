"use client";
// src/app/(owner)/owner/page.tsx
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/ui/StatCard";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import type { PlatformStats } from "@/types";

export default function OwnerDashboard() {
  const { user } = useAuth();

  const { data: statsRes, isLoading } = useQuery({
    queryKey: ["owner-stats"],
    queryFn:  () => fetchWithAuth("/api/stats"),
    refetchInterval: 20_000,
  });

  const stats: PlatformStats | null = statsRes?.data ?? null;

  const ownerActions = [
    { icon: "🎨", label: "تخصيص المنصة",  desc: "تعديل الألوان والنصوص والصفحات", href: "/owner/customize", color: "#C9A84C" },
    { icon: "🔵", label: "إدارة المشرفين", desc: "إضافة وإدارة حسابات المشرفين",   href: "/owner/admins",   color: "#2D9E6B" },
    { icon: "📚", label: "الكورسات",       desc: "إدارة الكورسات والمراحل الدراسية", href: "/admin/courses",  color: "#C9A84C" },
    { icon: "🎟️", label: "كودات الوصول",  desc: "توليد وطباعة كودات الطلاب",       href: "/admin/codes",    color: "#2D9E6B" },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", boxShadow: "0 8px 40px rgba(13,61,39,0.3)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }} />
          {/* Animated orb */}
          <motion.div className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
          <div className="relative z-10">
            <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.7)", fontSize: 13 }}>
              👑 لوحة المالك
            </span>
            <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(22px,3.5vw,40px)", marginTop: 4, marginBottom: 8 }}>
              أهلاً، {user?.name}
            </h1>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.65)", fontSize: 14 }}>
              أنت تتحكم في جميع جوانب المنصة
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {!isLoading && stats && (
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { icon: "👥", value: stats.totalStudents,  label: "طالب",        color: "emerald" as const },
            { icon: "📚", value: stats.totalCourses,   label: "كورس",        color: "gold"    as const },
            { icon: "🎬", value: stats.totalLectures,  label: "محاضرة",      color: "emerald" as const },
            { icon: "🎟️", value: stats.totalCodes,     label: "كود كلي",     color: "gold"    as const },
            { icon: "✅", value: stats.codesUsed,      label: "كود مستخدم",  color: "emerald" as const },
            { icon: "🔑", value: stats.codesAvailable, label: "كود متاح",    color: "gold"    as const },
          ].map((s, i) => (
            <StaggerItem key={s.label}>
              <StatCard {...s} withAnimation delay={i * 0.07} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-28" />)}
        </div>
      )}

      {/* Owner actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24, marginBottom: 16 }}>
          صلاحيات المالك
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ownerActions.map((a) => (
            <motion.div key={a.label} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
              <Link href={a.href} style={{ textDecoration: "none" }}>
                <div className="rounded-2xl p-6"
                  style={{ background: "#fff", border: `1px solid ${a.color}22`, boxShadow: "0 4px 16px rgba(26,18,8,0.05)", cursor: "pointer" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                    style={{ background: `${a.color}15` }}>
                    {a.icon}
                  </div>
                  <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    {a.label}
                  </h3>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.6 }}>
                    {a.desc}
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
