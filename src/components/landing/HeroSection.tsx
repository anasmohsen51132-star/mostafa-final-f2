"use client";
// src/components/landing/HeroSection.tsx
import { motion } from "framer-motion";
import Link from "next/link";
import type { SiteSettings } from "@/types";

interface Props {
  settings: Partial<SiteSettings> | null;
}

const STATS_DEFAULT = [
  { value: "٥٠٠٠+", label: "طالب مسجل" },
  { value: "٢٠",    label: "دورة متاحة" },
  { value: "١٥+",   label: "سنة خبرة"  },
  { value: "٩٨٪",  label: "نسبة الرضا" },
];

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: "easeOut" } }),
};

export function HeroSection({ settings }: Props) {
  // statsBar is stored as JSON in DB — parse safely
  let statsBar = STATS_DEFAULT;
  try {
    if (settings?.statsBar) {
      const raw = settings.statsBar;
      statsBar = Array.isArray(raw) ? raw : STATS_DEFAULT;
    }
  } catch {
    statsBar = STATS_DEFAULT;
  }

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0D3D27 0%,#1A6B47 60%,#0D3D27 100%)" }}
    >
      {/* Arabesque pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gold orb top-right */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(201,168,76,0.18),transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Green orb bottom-left */}
      <motion.div
        className="absolute bottom-32 left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(45,158,107,0.15),transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* ── Navbar ── */}
      <nav
        className="absolute top-0 inset-x-0 h-16 flex items-center px-6 z-20"
        style={{
          background: "rgba(13,61,39,0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(201,168,76,0.15)",
        }}
      >
        <div className="flex-1">
          <span className="font-bold leading-tight" style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: 16 }}>
            {settings?.platformName ?? "اكاديمية مستر مصطفى"}
          </span>
          <br />
          <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.5)", fontSize: 11 }}>
            {settings?.platformTagline ?? "لتدريس اللغة العربية"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm px-3 py-2 transition-colors"
            style={{ color: "rgba(250,247,240,0.75)", fontFamily: "Cairo,sans-serif" }}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 rounded-xl font-semibold text-sm transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg,#C9A84C,#8B6914)",
              boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
              color: "#1A1208",
              fontFamily: "Cairo,sans-serif",
            }}
          >
            إنشاء حساب
          </Link>
        </div>
      </nav>

      {/* ── Hero content ── */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pt-16">

        {/* Platform badge */}
        <motion.div
          initial="hidden" animate="show" custom={0}
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.28)" }}
        >
          <span>🌟</span>
          <span style={{ color: "#E8C97A", fontFamily: "Cairo,sans-serif", fontSize: 13 }}>
            المنصة التعليمية الأولى للغة العربية
          </span>
        </motion.div>

        {/* Basmala */}
        <motion.div
          initial="hidden" animate="show" custom={0.1} variants={fadeUp}
          style={{ fontFamily: "Amiri,serif", color: "rgba(201,168,76,0.65)", fontSize: 36, marginBottom: 8 }}
        >
          ﷽
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial="hidden" animate="show" custom={0.22} variants={fadeUp}
          style={{
            fontFamily: "Amiri,serif",
            color: "#E8C97A",
            fontSize: "clamp(36px,7vw,72px)",
            lineHeight: 1.25,
            marginBottom: 10,
          }}
        >
          {settings?.heroTitle ?? "اتقن اللغة العربية"}
        </motion.h1>

        {/* Sub-heading */}
        <motion.h2
          initial="hidden" animate="show" custom={0.34} variants={fadeUp}
          style={{
            fontFamily: "Amiri,serif",
            color: "rgba(201,168,76,0.65)",
            fontSize: "clamp(20px,4vw,38px)",
            fontWeight: 400,
            marginBottom: 24,
          }}
        >
          {settings?.heroSubtitle ?? "مع نخبة من أفضل الأساتذة"}
        </motion.h2>

        {/* Ornamental divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div style={{ height: 1, width: 80, background: "linear-gradient(to right,transparent,rgba(201,168,76,0.5))" }} />
          <span style={{ color: "rgba(201,168,76,0.55)", fontFamily: "Amiri,serif", fontSize: 20 }}>✦</span>
          <div style={{ height: 1, width: 80, background: "linear-gradient(to left,transparent,rgba(201,168,76,0.5))" }} />
        </motion.div>

        {/* Description */}
        <motion.p
          initial="hidden" animate="show" custom={0.5} variants={fadeUp}
          style={{
            color: "rgba(250,247,240,0.7)",
            fontFamily: "Cairo,sans-serif",
            fontSize: "clamp(15px,2.5vw,18px)",
            lineHeight: 1.9,
            maxWidth: 520,
            margin: "0 auto 40px",
          }}
        >
          {settings?.heroDesc ?? "انضم إلى آلاف الطلاب في رحلة تعليمية استثنائية تجمع بين الأصالة والحداثة"}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial="hidden" animate="show" custom={0.6} variants={fadeUp}
          className="flex gap-4 justify-center flex-wrap"
        >
          <Link
            href="/register"
            className="transition-transform hover:-translate-y-1 active:translate-y-0"
            style={{
              padding: "16px 40px",
              borderRadius: 16,
              background: "linear-gradient(135deg,#C9A84C,#8B6914)",
              boxShadow: "0 6px 24px rgba(201,168,76,0.4)",
              color: "#1A1208",
              fontFamily: "Cairo,sans-serif",
              fontWeight: 700,
              fontSize: 17,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            ابدأ رحلتك الآن 🚀
          </Link>
          <Link
            href="/login"
            className="transition-transform hover:-translate-y-1 active:translate-y-0"
            style={{
              padding: "16px 40px",
              borderRadius: 16,
              border: "1.5px solid rgba(201,168,76,0.4)",
              background: "rgba(201,168,76,0.08)",
              color: "#E8C97A",
              fontFamily: "Cairo,sans-serif",
              fontWeight: 600,
              fontSize: 17,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            تسجيل الدخول
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial="hidden" animate="show" custom={0.75} variants={fadeUp}
          className="flex gap-10 justify-center flex-wrap mt-16"
        >
          {statsBar.map((s, i) => (
            <div key={i} className="text-center">
              <div style={{ fontFamily: "Amiri,serif", color: "#C9A84C", fontSize: 40, fontWeight: 700 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 12, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span style={{ color: "rgba(201,168,76,0.35)", fontFamily: "Cairo,sans-serif", fontSize: 11 }}>اكتشف المزيد</span>
        <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom,rgba(201,168,76,0.4),transparent)" }} />
      </motion.div>
    </section>
  );
}
