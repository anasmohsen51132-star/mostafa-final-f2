"use client";
// src/app/(student)/courses/page.tsx
import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import type { Course } from "@/types";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => fetchWithAuth("/api/courses"),
  });

  const allCourses: (Course & { unlocked: boolean })[] = data?.data ?? [];
  const filtered = allCourses.filter(
    (c) =>
      c.isPublished &&
      (search === "" ||
        c.title.includes(search) ||
        (c.description ?? "").includes(search))
  );

  return (
    <div style={{ direction: "rtl" }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl p-8 mb-8 overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0D3D27,#1A6B47)",
          boxShadow: "0 8px 32px rgba(13,61,39,0.25)",
        }}
      >
        {/* pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* drifting orbs */}
        <motion.div className="absolute -top-10 -left-10 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(45,158,107,0.15),transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        {/* shimmer sweep */}
        <motion.div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(115deg,transparent 30%,rgba(232,201,122,0.08) 50%,transparent 70%)" }}
          animate={{ x: ["-30%","30%"] }} transition={{ duration: 5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <motion.span style={{ fontSize: 28 }}
              animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              📚
            </motion.span>
            <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(22px,4vw,36px)", fontWeight: 700 }}>
              الكورسات المتاحة
            </h1>
          </div>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.65)", fontSize: 14 }}>
            اكتشف جميع الكورسات — لديك{" "}
            <span style={{ color: "#C9A84C", fontWeight: 700 }}>
              {allCourses.filter(c => c.unlocked).length}
            </span>{" "}
            كورس مفتوح من أصل{" "}
            <span style={{ color: "#C9A84C", fontWeight: 700 }}>{allCourses.filter(c => c.isPublished).length}</span>
          </p>
        </div>
      </motion.div>

      {/* ── Search ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div style={{ position: "relative", maxWidth: 440 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن كورس..."
            style={{
              width: "100%",
              padding: "13px 48px 13px 44px",
              borderRadius: 16,
              border: "1.5px solid rgba(201,168,76,0.25)",
              background: "#fff",
              fontFamily: "Cairo,sans-serif",
              fontSize: 14,
              color: "#1A1208",
              outline: "none",
              direction: "rtl",
              boxShadow: "0 2px 12px rgba(26,18,8,0.05)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(201,168,76,0.6)";
              e.target.style.boxShadow = "0 2px 16px rgba(201,168,76,0.15)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(201,168,76,0.25)";
              e.target.style.boxShadow = "0 2px 12px rgba(26,18,8,0.05)";
            }}
          />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>
            🔍
          </span>
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(201,168,76,0.15)", border: "none", borderRadius: "50%",
                  width: 22, height: 22, cursor: "pointer", fontSize: 12,
                  color: "#8B6914", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {search && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginTop: 8 }}>
            {filtered.length} نتيجة للبحث عن "{search}"
          </motion.p>
        )}
      </motion.div>

      {/* ── Loading skeletons ── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.1)" }}>
              <div className="skeleton h-32" />
              <div className="p-5 space-y-3">
                <div className="skeleton h-4 rounded-full w-3/4" />
                <div className="skeleton h-3 rounded-full w-full" />
                <div className="skeleton h-3 rounded-full w-2/3" />
                <div className="flex justify-between items-center pt-2">
                  <div className="skeleton h-3 rounded-full w-20" />
                  <div className="skeleton h-8 rounded-xl w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Courses grid ── */}
      {!isLoading && filtered.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <StaggerItem key={course.id}>
              <motion.div
                onHoverStart={() => setHoveredId(course.id)}
                onHoverEnd={() => setHoveredId(null)}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#fff",
                  border: `1px solid ${hoveredId === course.id ? course.color + "55" : "rgba(201,168,76,0.15)"}`,
                  boxShadow: hoveredId === course.id
                    ? `0 12px 32px ${course.color}22, 0 2px 8px rgba(26,18,8,0.06)`
                    : "0 4px 20px rgba(26,18,8,0.06)",
                  transition: "border-color 0.25s, box-shadow 0.25s",
                }}
              >
                {/* Card header */}
                <div
                  className="h-32 flex items-center justify-center relative overflow-hidden"
                  style={{ background: `linear-gradient(145deg,${course.color}22,${course.color}10)`, borderBottom: `2px solid ${course.color}30` }}
                >
                  {/* bg pattern dots */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `radial-gradient(${course.color}20 1px, transparent 1px)`,
                    backgroundSize: "18px 18px",
                  }} />
                  {/* shimmer on hover */}
                  <AnimatePresence>
                    {hoveredId === course.id && (
                      <motion.div aria-hidden
                        initial={{ x: "-80%", opacity: 0 }}
                        animate={{ x: "120%", opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(105deg,transparent,rgba(255,255,255,0.25),transparent)", transform: "skewX(-15deg)" }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.span
                    className="relative z-10 text-5xl"
                    animate={hoveredId === course.id ? { scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {course.icon}
                  </motion.span>

                  {/* Unlocked badge */}
                  {course.unlocked && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                      style={{ background: "rgba(13,61,39,0.85)", color: "#E8C97A", fontFamily: "Cairo,sans-serif", backdropFilter: "blur(4px)" }}
                    >
                      ✦ مفتوح
                    </motion.div>
                  )}

                  {/* Lecture count badge */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs"
                    style={{ background: "rgba(0,0,0,0.2)", color: "#fff", fontFamily: "Cairo,sans-serif", backdropFilter: "blur(4px)" }}>
                    {course._count?.lectures ?? 0} 📖
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 16, fontWeight: 700, marginBottom: 6, lineHeight: 1.5 }}>
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="line-clamp-2"
                      style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                      {course.description}
                    </p>
                  )}

                  {/* thin divider */}
                  <div style={{ height: 1, background: `linear-gradient(90deg,${course.color}30,transparent)`, marginBottom: 14 }} />

                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                      📖 {course._count?.lectures ?? 0} محاضرة
                    </span>
                    {course.unlocked ? (
                      <Link href={`/courses/${course.id}`}
                        style={{
                          padding: "8px 20px", borderRadius: 12,
                          background: `linear-gradient(135deg,${course.color},${course.color}cc)`,
                          color: "#1A1208", fontFamily: "Cairo,sans-serif",
                          fontWeight: 700, fontSize: 13, textDecoration: "none",
                          boxShadow: `0 4px 12px ${course.color}40`,
                          transition: "transform 0.15s, box-shadow 0.15s",
                          display: "inline-block",
                        }}
                      >
                        ادخل ←
                      </Link>
                    ) : (
                      <Link href="/redeem"
                        style={{
                          padding: "8px 20px", borderRadius: 12,
                          border: "1.5px solid rgba(201,168,76,0.35)",
                          color: "#C9A84C", fontFamily: "Cairo,sans-serif",
                          fontWeight: 600, fontSize: 13, textDecoration: "none",
                          background: "rgba(201,168,76,0.05)",
                          transition: "background 0.15s",
                        }}
                      >
                        🔒 فتح بكود
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* ── Empty state ── */}
      {!isLoading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
          style={{ background: "#fff", borderRadius: 24, border: "1px solid rgba(201,168,76,0.12)" }}>
          <motion.div style={{ fontSize: 60, marginBottom: 16 }}
            animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            {search ? "🔍" : "📭"}
          </motion.div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24, marginBottom: 8 }}>
            {search ? "لا توجد نتائج" : "لا توجد كورسات بعد"}
          </h3>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {search ? "جرب البحث بكلمات مختلفة" : "سيتم إضافة الكورسات قريباً"}
          </p>
          {search && (
            <motion.button onClick={() => setSearch("")}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                marginTop: 20, padding: "10px 28px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                color: "#1A1208", fontFamily: "Cairo,sans-serif", fontWeight: 700,
                fontSize: 14, cursor: "pointer",
              }}>
              مسح البحث
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
