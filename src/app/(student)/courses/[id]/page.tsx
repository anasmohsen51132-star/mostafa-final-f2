"use client";
// src/app/(student)/courses/[id]/page.tsx
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchWithAuth(`/api/courses/${id}`),
    enabled: !!id,
  });

  const course = data?.data;

  if (isLoading) {
    return (
      <div style={{ direction: "rtl" }}>
        <div className="skeleton rounded-3xl h-40 mb-6" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-20" />)}
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="text-center py-20" style={{ direction: "rtl" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24 }}>
          الكورس غير موجود أو غير مصرح
        </h3>
        <Link href="/courses" style={{ fontFamily: "Cairo,sans-serif", color: "#C9A84C", fontSize: 14, textDecoration: "none" }}>
          ← العودة للكورسات
        </Link>
      </div>
    );
  }

  return (
    <div style={{ direction: "rtl" }}>
      {/* Course header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 mb-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${course.color}22, ${course.color}08)`,
          border: `1.5px solid ${course.color}30`,
          boxShadow: "0 8px 32px rgba(26,18,8,0.06)",
        }}
      >
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
            style={{ background: `${course.color}20`, border: `1px solid ${course.color}30` }}
          >
            {course.icon}
          </div>
          <div>
            <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 6 }}>
              {course.title}
            </h1>
            {course.description && (
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 15, lineHeight: 1.75 }}>
                {course.description}
              </p>
            )}
            <div className="flex gap-4 mt-4">
              <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
                📖 {course.lectures?.length ?? 0} محاضرة
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lecture list */}
      <div className="mb-4">
        <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24, marginBottom: 20 }}>
          المحاضرات
        </h2>
        {!course.lectures?.length ? (
          <div className="text-center py-12" style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(201,168,76,0.15)" }}>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 15 }}>
              لا توجد محاضرات بعد
            </p>
          </div>
        ) : (
          <StaggerContainer className="space-y-3">
            {course.lectures.map((cl: { order: number; lecture: { id: string; title: string; description?: string; _count?: { videos: number; pdfs: number; quizzes: number; homework: number } } }, idx: number) => (
              <StaggerItem key={cl.lecture.id}>
                <motion.div
                  whileHover={{ x: -4, transition: { duration: 0.2 } }}
                >
                  <Link
                    href={`/lecture/${cl.lecture.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="flex items-center gap-4 p-5 rounded-2xl transition-all"
                      style={{
                        background: "#fff",
                        border: "1px solid rgba(201,168,76,0.15)",
                        boxShadow: "0 2px 8px rgba(26,18,8,0.04)",
                        cursor: "pointer",
                      }}
                    >
                      {/* Order badge */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#C9A84C,#8B6914)", color: "#1A1208", fontFamily: "Amiri,serif", fontSize: 16 }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                          {cl.lecture.title}
                        </h3>
                        {cl.lecture.description && (
                          <p className="line-clamp-1" style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
                            {cl.lecture.description}
                          </p>
                        )}
                        {/* Content badges */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(cl.lecture._count?.videos ?? 0) > 0 && <Badge icon="🎥" count={cl.lecture._count!.videos} label="فيديو" />}
                          {(cl.lecture._count?.pdfs ?? 0) > 0 && <Badge icon="📄" count={cl.lecture._count!.pdfs} label="ملف" />}
                          {(cl.lecture._count?.quizzes ?? 0) > 0 && <Badge icon="📝" count={cl.lecture._count!.quizzes} label="اختبار" />}
                          {(cl.lecture._count?.homework ?? 0) > 0 && <Badge icon="📋" count={cl.lecture._count!.homework} label="واجب" />}
                        </div>
                      </div>
                      <span style={{ color: "#C9A84C", fontSize: 20 }}>←</span>
                    </div>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}

function Badge({ icon, count, label }: { icon: string; count: number; label: string }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 8,
        background: "rgba(201,168,76,0.1)",
        border: "1px solid rgba(201,168,76,0.2)",
        fontFamily: "Cairo,sans-serif",
        fontSize: 11,
        color: "#8B6914",
      }}
    >
      {icon} {count} {label}
    </span>
  );
}
