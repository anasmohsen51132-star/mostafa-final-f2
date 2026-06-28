"use client";
// src/components/landing/TeacherSection.tsx
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { SiteSettings } from "@/types";

interface Props {
  settings: Partial<SiteSettings> | null;
}

const STATS_DEFAULT = [
  { value: "١٥+", label: "سنة خبرة" },
  { value: "٥٠٠٠+", label: "طالب مستفيد" },
  { value: "٩٨٪", label: "نسبة نجاح" },
];

export function TeacherSection({ settings }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  let teacherStats = STATS_DEFAULT;
  try {
    if (settings?.teacherStats && Array.isArray(settings.teacherStats)) {
      teacherStats = settings.teacherStats as typeof STATS_DEFAULT;
    }
  } catch {
    teacherStats = STATS_DEFAULT;
  }

  const teacherName  = settings?.teacherName  ?? "مستر مصطفى";
  const teacherTitle = settings?.teacherTitle ?? "خبير تدريس اللغة العربية";
  const teacherBio   = settings?.teacherBio   ?? "معلم متميز بخبرة تزيد عن خمس عشرة عاماً في تدريس اللغة العربية لجميع المراحل الدراسية، حاصل على شهادات متعددة في التدريس وعلم اللغة.";

  return (
    <section
      ref={ref}
      className="py-24 px-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0D3D27 0%,#1A6B47 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Avatar column */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex-shrink-0 flex flex-col items-center"
          >
            {/* Avatar circle */}
            <div className="relative">
              {/* Animated ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: "2px solid rgba(201,168,76,0.4)", transform: "scale(1.08)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: "1px dashed rgba(201,168,76,0.2)", transform: "scale(1.2)" }}
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              {/* Main avatar */}
              <div
                className="relative w-48 h-48 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,rgba(201,168,76,0.3),rgba(45,158,107,0.3))",
                  border: "3px solid rgba(201,168,76,0.5)",
                }}
              >
                <span style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: 72 }}>م</span>
              </div>
            </div>

            {/* Name card */}
            <div
              className="mt-6 px-6 py-3 rounded-2xl text-center"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <div style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: 22, fontWeight: 700 }}>
                {teacherName}
              </div>
              <div style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.6)", fontSize: 12, marginTop: 2 }}>
                {teacherTitle}
              </div>
            </div>
          </motion.div>

          {/* Content column */}
          <div className="flex-1 text-center lg:text-right">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: "rgba(201,168,76,0.15)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#E8C97A",
                  fontFamily: "Cairo,sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                👨‍🏫 عن الأستاذ
              </span>
              <h2
                className="mb-6"
                style={{
                  fontFamily: "Amiri,serif",
                  color: "#E8C97A",
                  fontSize: "clamp(26px,4vw,44px)",
                  lineHeight: 1.3,
                }}
              >
                {teacherTitle}
              </h2>
              <p
                className="mb-10 leading-relaxed"
                style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.75)", fontSize: 16, lineHeight: 1.9 }}
              >
                {teacherBio}
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="flex gap-8 justify-center lg:justify-start flex-wrap"
            >
              {teacherStats.map((s, i) => (
                <div
                  key={i}
                  className="text-center px-5 py-4 rounded-2xl"
                  style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  <div style={{ fontFamily: "Amiri,serif", color: "#C9A84C", fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.55)", fontSize: 12, marginTop: 6 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
