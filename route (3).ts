"use client";
// src/components/dashboard/DashboardStats.tsx
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types";

export function DashboardStats() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["my-courses"],
    queryFn:  () => fetchWithAuth("/api/courses"),
    enabled:  !!user,
  });

  const courses: (Course & { unlocked: boolean })[] = data?.data ?? [];
  const myCourses  = courses.filter((c) => c.unlocked);
  const available  = courses.filter((c) => !c.unlocked && c.isPublished);

  const stats = [
    {
      icon: "🎓", value: myCourses.length,
      label: "كورساتي", color: "#C9A84C",
      bg: "rgba(201,168,76,0.1)", delay: 0,
    },
    {
      icon: "📚", value: available.length,
      label: "متاح للفتح", color: "#2D9E6B",
      bg: "rgba(45,158,107,0.1)", delay: 0.08,
    },
    {
      icon: "📖",
      value: myCourses.reduce((sum, c) => sum + (c._count?.lectures ?? 0), 0),
      label: "محاضرة", color: "#C9A84C",
      bg: "rgba(201,168,76,0.1)", delay: 0.16,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: s.delay, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.18 } }}
          className="rounded-2xl p-5 text-center"
          style={{
            background: "#fff",
            border: "1px solid rgba(201,168,76,0.15)",
            boxShadow: "0 2px 12px rgba(26,18,8,0.05)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-3"
            style={{ background: s.bg }}
          >
            {s.icon}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: s.delay + 0.2 }}
            style={{ fontFamily: "Amiri,serif", color: s.color, fontSize: 32, fontWeight: 700, lineHeight: 1 }}
          >
            {s.value}
          </motion.div>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, marginTop: 4 }}>
            {s.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
