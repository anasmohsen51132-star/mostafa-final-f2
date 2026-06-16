"use client";
// src/app/(student)/courses/page.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import type { Course } from "@/types";

export default function CoursesPage() {
  const [search, setSearch] = useState("");

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
          الكورسات المتاحة
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 15 }}>
          اكتشف جميع الكورسات المتاحة على المنصة
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div style={{ position: "relative", maxWidth: 420 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن كورس..."
            style={{
              width: "100%",
              padding: "12px 44px 12px 16px",
              borderRadius: 14,
              border: "1.5px solid rgba(201,168,76,0.25)",
              background: "#fff",
              fontFamily: "Cairo,sans-serif",
              fontSize: 14,
              color: "#1A1208",
              outline: "none",
              direction: "rtl",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>
            🔍
          </span>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-52" />
          ))}
        </div>
      )}

      {/* Courses grid */}
      {!isLoading && filtered.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <StaggerItem key={course.id}>
              <motion.div
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(201,168,76,0.15)",
                  boxShadow: "0 4px 20px rgba(26,18,8,0.06)",
                }}
              >
                <div
                  className="h-28 flex items-center justify-center text-5xl relative"
                  style={{ background: `${course.color}18`, borderBottom: `2px solid ${course.color}25` }}
                >
                  {course.icon}
                  {course.unlocked && (
                    <div
                      className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(45,158,107,0.85)", color: "#fff", fontFamily: "Cairo,sans-serif" }}
                    >
                      ✅ مفتوح
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                    {course.title}
                  </h3>
                  {course.description && (
                    <p
                      className="line-clamp-2"
                      style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}
                    >
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                      📖 {course._count?.lectures ?? 0} محاضرة
                    </span>
                    {course.unlocked ? (
                      <Link
                        href={`/courses/${course.id}`}
                        style={{
                          padding: "7px 18px", borderRadius: 10,
                          background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                          color: "#1A1208", fontFamily: "Cairo,sans-serif",
                          fontWeight: 700, fontSize: 13, textDecoration: "none",
                        }}
                      >
                        ادخل →
                      </Link>
                    ) : (
                      <Link
                        href="/redeem"
                        style={{
                          padding: "7px 18px", borderRadius: 10,
                          border: "1px solid rgba(201,168,76,0.35)",
                          color: "#C9A84C", fontFamily: "Cairo,sans-serif",
                          fontWeight: 600, fontSize: 13, textDecoration: "none",
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

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 8 }}>
            {search ? "لا توجد نتائج" : "لا توجد كورسات بعد"}
          </h3>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {search ? "جرب البحث بكلمات مختلفة" : "سيتم إضافة الكورسات قريباً"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
