"use client";
// src/app/(student)/dashboard/page.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { fetchWithAuth } from "@/hooks/useAuth";
import { WelcomeAnimation } from "@/components/dashboard/WelcomeAnimation";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import type { Course } from "@/types";

function useFirstVisit() {
  const [isFirst, setIsFirst] = useState(false);
  useEffect(() => {
    const key = "mustafa_welcomed";
    if (!sessionStorage.getItem(key)) {
      setIsFirst(true);
      sessionStorage.setItem(key, "1");
    }
  }, []);
  return isFirst;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const isFirst = useFirstVisit();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isFirst) setShowWelcome(true);
  }, [isFirst]);

  const { data: coursesRes } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => fetchWithAuth("/api/courses"),
    enabled: !!user,
  });

  const courses: (Course & { unlocked: boolean })[] = coursesRes?.data ?? [];
  const myCourses = courses.filter((c) => c.unlocked);
  const availableCourses = courses.filter((c) => !c.unlocked && c.isPublished);

  const firstName = user?.name?.split(" ")[0] ?? "الطالب";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور";

  return (
    <>
      {showWelcome && (
        <WelcomeAnimation name={firstName} onDone={() => setShowWelcome(false)} />
      )}

      <div style={{ direction: "rtl" }}>
        {/* ── Header greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#0D3D27,#1A6B47)",
              boxShadow: "0 8px 32px rgba(13,61,39,0.25)",
            }}
          >
            {/* Pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            {/* Gold orb */}
            <div
              className="absolute -top-8 -left-8 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%)" }}
            />
            <div className="relative z-10">
              <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.7)", fontSize: 14, marginBottom: 4 }}>
                {greeting}، 👋
              </p>
              <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(24px,4vw,40px)", marginBottom: 8 }}>
                {user?.name}
              </h1>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.65)", fontSize: 14 }}>
                لديك{" "}
                <span style={{ color: "#C9A84C", fontWeight: 700 }}>{myCourses.length}</span>
                {" "}كورس نشط
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Quick stats ── */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "📚", value: myCourses.length,      label: "كورساتي",      color: "#C9A84C" },
            { icon: "🎯", value: availableCourses.length, label: "كورسات متاحة", color: "#2D9E6B" },
            { icon: "🎟️", value: "—",                   label: "استخدم كوداً",  color: "#C9A84C", link: "/redeem" },
            { icon: "👤", value: "ملفي",                 label: "الإعدادات",    color: "#2D9E6B", link: "/profile" },
          ].map((s, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl p-5"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(201,168,76,0.15)",
                  boxShadow: "0 2px 12px rgba(26,18,8,0.06)",
                  cursor: s.link ? "pointer" : "default",
                }}
                onClick={() => s.link && (window.location.href = s.link)}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ background: `${s.color}18` }}
                >
                  {s.icon}
                </div>
                <div style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 28, fontWeight: 700 }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginTop: 2 }}>
                  {s.label}
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* ── My Courses ── */}
        {myCourses.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22 }}>كورساتي</h2>
              <Link href="/my-courses" style={{ fontFamily: "Cairo,sans-serif", color: "#C9A84C", fontSize: 13, textDecoration: "none" }}>
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myCourses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} unlocked />
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Available Courses ── */}
        {availableCourses.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22 }}>كورسات متاحة</h2>
              <Link href="/courses" style={{ fontFamily: "Cairo,sans-serif", color: "#C9A84C", fontSize: 13, textDecoration: "none" }}>
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableCourses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} unlocked={false} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {myCourses.length === 0 && availableCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
            <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24, marginBottom: 8 }}>
              لا توجد كورسات بعد
            </h3>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 15, marginBottom: 24 }}>
              استخدم كود الوصول لفتح أول كورس لك
            </p>
            <Link
              href="/redeem"
              style={{
                padding: "12px 32px", borderRadius: 14,
                background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                color: "#1A1208", fontFamily: "Cairo,sans-serif",
                fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}
            >
              🎟️ استخدم كوداً الآن
            </Link>
          </motion.div>
        )}
      </div>
    </>
  );
}

// ── Inline CourseCard ──
function CourseCard({ course, unlocked }: { course: Course; unlocked: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#fff",
        border: "1px solid rgba(201,168,76,0.15)",
        boxShadow: "0 4px 16px rgba(26,18,8,0.06)",
      }}
    >
      {/* Color header */}
      <div
        className="h-24 flex items-center justify-center text-4xl relative"
        style={{ background: `${course.color}22`, borderBottom: `2px solid ${course.color}30` }}
      >
        {course.icon}
        {!unlocked && (
          <div
            className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(0,0,0,0.5)", color: "#FAF7F0", fontFamily: "Cairo,sans-serif" }}
          >
            🔒 يحتاج كود
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
          {course.title}
        </h3>
        {course.description && (
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}
            className="line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
            📖 {course._count?.lectures ?? 0} محاضرة
          </span>
          {unlocked ? (
            <Link
              href={`/courses/${course.id}`}
              style={{
                padding: "6px 16px", borderRadius: 10,
                background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                color: "#1A1208", fontFamily: "Cairo,sans-serif",
                fontWeight: 700, fontSize: 12, textDecoration: "none",
              }}
            >
              ادخل ←
            </Link>
          ) : (
            <Link
              href="/redeem"
              style={{
                padding: "6px 16px", borderRadius: 10,
                border: "1px solid rgba(201,168,76,0.35)",
                color: "#C9A84C", fontFamily: "Cairo,sans-serif",
                fontWeight: 600, fontSize: 12, textDecoration: "none",
              }}
            >
              🎟️ فتح
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
