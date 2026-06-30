"use client";
// src/app/(student)/my-courses/page.tsx
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { ACADEMIC_LEVEL_LABELS } from "@/types";
import type { Course } from "@/types";

export default function MyCoursesPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => fetchWithAuth("/api/courses"),
    enabled: !!user,
  });

  const allCourses: (Course & { unlocked: boolean })[] = data?.data ?? [];
  const myCourses = allCourses.filter((c) => c.unlocked);

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
              كورساتي
            </h1>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 15 }}>
              الكورسات التي حصلت عليها
              {user?.academicLevel && (
                <span
                  className="mr-2 inline-block px-3 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(201,168,76,0.12)", color: "#8B6914", border: "1px solid rgba(201,168,76,0.25)" }}
                >
                  🎓 {ACADEMIC_LEVEL_LABELS[user.academicLevel]}
                </span>
              )}
            </p>
          </div>
          <Link
            href="/redeem"
            style={{
              padding: "10px 24px", borderRadius: 12,
              background: "linear-gradient(135deg,#C9A84C,#8B6914)",
              color: "#1A1208", fontFamily: "Cairo,sans-serif",
              fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}
          >
            🎟️ إضافة كورس جديد
          </Link>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-52" />
          ))}
        </div>
      )}

      {/* Courses grid */}
      {!isLoading && myCourses.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {myCourses.map((course) => (
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
                {/* Color header */}
                <div
                  className="h-28 flex items-center justify-center text-5xl relative"
                  style={{ background: `${course.color}18`, borderBottom: `2px solid ${course.color}25` }}
                >
                  {course.icon}
                  <div
                    className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(45,158,107,0.85)", color: "#fff", fontFamily: "Cairo,sans-serif" }}
                  >
                    ✅ مفتوح
                  </div>
                </div>

                <div className="p-5">
                  <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                    {course.title}
                  </h3>
                  {course.description && (
                    <p
                      className="line-clamp-2"
                      style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}
                    >
                      {course.description}
                    </p>
                  )}

                  {/* Level badges */}
                  {course.levels && course.levels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-12">
                      {course.levels.map((l) => (
                        <span
                          key={l.academicLevel}
                          style={{
                            padding: "2px 8px", borderRadius: 6, fontSize: 10,
                            background: "rgba(201,168,76,0.1)", color: "#8B6914",
                            border: "1px solid rgba(201,168,76,0.2)",
                            fontFamily: "Cairo,sans-serif",
                          }}
                        >
                          {ACADEMIC_LEVEL_LABELS[l.academicLevel]}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                      📖 {course._count?.lectures ?? 0} محاضرة
                    </span>
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
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Empty state */}
      {!isLoading && myCourses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 rounded-3xl"
          style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎒</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 26, marginBottom: 10 }}>
            لا توجد كورسات بعد
          </h3>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 15, marginBottom: 28 }}>
            استخدم كود الوصول لفتح أول كورس لك
          </p>
          <Link
            href="/redeem"
            style={{
              padding: "14px 40px", borderRadius: 16,
              background: "linear-gradient(135deg,#C9A84C,#8B6914)",
              boxShadow: "0 6px 20px rgba(201,168,76,0.35)",
              color: "#1A1208", fontFamily: "Cairo,sans-serif",
              fontWeight: 700, fontSize: 16, textDecoration: "none",
              display: "inline-block",
            }}
          >
            🎟️ استخدم كوداً الآن
          </Link>
        </motion.div>
      )}
    </div>
  );
}
