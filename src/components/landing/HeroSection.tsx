"use client";
// src/components/landing/HeroSection.tsx
import { m as motion } from "framer-motion";
import Link from "next/link";
import type { SiteSettings } from "@/types";
import { DrawnText } from "@/components/effects/DrawnText";
import { FloatingArabicBackground } from "@/components/effects/FloatingArabicBackground";

interface Props {
  settings: Partial<SiteSettings> | null;
}

const STATS_DEFAULT = [
  { value: "٥٠٠٠+", label: "طالب مسجل" },
  { value: "٢٠",    label: "دورة متاحة" },
  { value: "١٥+",   label: "سنة خبرة"  },
  { value: "٩٨٪",  label: "نسبة الرضا" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 20, delay } }),
};

// الحروف العربية الطافية في الخلفية
export function HeroSection({ settings }: Props) {
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
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.04'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Large decorative letters anchoring the empty top-right / bottom-left
          corners left bare by the diagonal gradient — bigger and bolder than
          the scattered field below, bleeding slightly off-edge for a
          calligraphic-poster feel. */}
      <motion.div
        className="absolute pointer-events-none select-none hidden sm:block"
        style={{
          top: "-6%", right: "-4%",
          fontFamily: "Amiri,serif", fontSize: "clamp(220px,26vw,340px)",
          color: "rgba(201,168,76,0.12)", fontWeight: 700, lineHeight: 1,
          rotate: -12, willChange: "transform",
        }}
        animate={{
          y: [0, -28, 10, 0],
          rotate: [-12, -6, -15, -12],
          opacity: [0.1, 0.16, 0.1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      >
        م
      </motion.div>
      <motion.div
        className="absolute pointer-events-none select-none hidden sm:block"
        style={{
          bottom: "-8%", left: "-5%",
          fontFamily: "Amiri,serif", fontSize: "clamp(200px,24vw,300px)",
          color: "rgba(201,168,76,0.11)", fontWeight: 700, lineHeight: 1,
          rotate: 15, willChange: "transform",
        }}
        animate={{
          y: [0, 24, -14, 0],
          rotate: [15, 22, 10, 15],
          opacity: [0.09, 0.15, 0.09],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      >
        ص
      </motion.div>

      {/* ── الحروف العربية الطافية ── */}
      <FloatingArabicBackground />

      {/* Orbs */}
      <motion.div
        className="absolute top-20 right-10 sm:right-20 w-40 h-40 sm:w-64 sm:h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(201,168,76,0.18),transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 left-6 sm:left-16 w-32 h-32 sm:w-48 sm:h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(45,158,107,0.15),transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* ── Navbar ── */}
      <nav
        className="absolute top-0 inset-x-0 h-16 flex items-center z-20"
        style={{
          background: "rgba(13,61,39,0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(201,168,76,0.15)",
          padding: "0 16px",
        }}
      >
        <div className="flex-1 min-w-0">
          <span
            className="font-bold leading-tight block truncate"
            style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(13px,3.5vw,16px)" }}
          >
            {settings?.platformName ?? "اكاديمية مستر مصطفى"}
          </span>
          <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.5)", fontSize: 11 }}>
            {settings?.platformTagline ?? "لتدريس اللغة العربية"}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="text-sm px-3 py-2 transition-colors whitespace-nowrap"
            style={{ color: "rgba(250,247,240,0.75)", fontFamily: "Cairo,sans-serif", fontSize: "clamp(12px,3vw,14px)" }}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="px-3 sm:px-5 py-2 rounded-xl font-semibold transition-transform hover:-translate-y-0.5 whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg,#C9A84C,#8B6914)",
              boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
              color: "#1A1208",
              fontFamily: "Cairo,sans-serif",
              fontSize: "clamp(12px,3vw,14px)",
            }}
          >
            إنشاء حساب
          </Link>
        </div>
      </nav>

      {/* ── Hero content ── */}
      <div className="relative z-10 text-center w-full" style={{ padding: "80px 20px 96px" }}>

        {/* Platform badge */}
        <motion.div
          initial="hidden" animate="show" custom={0} variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.28)" }}
        >
          <span>🌟</span>
          <span style={{ color: "#E8C97A", fontFamily: "Cairo,sans-serif", fontSize: "clamp(11px,3vw,13px)" }}>
            المنصة التعليمية الأولى للغة العربية
          </span>
        </motion.div>

        {/* Basmala */}
        <motion.div
          initial="hidden" animate="show" custom={0.1} variants={fadeUp}
          style={{ fontFamily: "Amiri,serif", color: "rgba(201,168,76,0.65)", fontSize: "clamp(24px,7vw,36px)", marginBottom: 8 }}
        >
          ﷽
        </motion.div>

        {/* Main heading — drawn stroke-by-stroke, then settles into solid text */}
        <motion.div
          initial="hidden" animate="show" custom={0.15} variants={fadeUp}
          style={{ marginBottom: 10 }}
        >
          <DrawnText
            text={settings?.heroTitle ?? "اتقن اللغة العربية"}
            fontSize={64}
            color="#E8C97A"
            strokeColor="#C9A84C"
            duration={2}
            delay={0.3}
          />
        </motion.div>

        {/* Sub-heading */}
        <motion.h2
          initial="hidden" animate="show" custom={0.34} variants={fadeUp}
          style={{
            fontFamily: "Amiri,serif",
            color: "rgba(201,168,76,0.65)",
            fontSize: "clamp(16px,4.5vw,38px)",
            fontWeight: 400,
            marginBottom: 24,
          }}
        >
          {settings?.heroSubtitle ?? "مع نخبة من أفضل الأساتذة"}
        </motion.h2>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <div style={{ height: 1, width: 60, background: "linear-gradient(to right,transparent,rgba(201,168,76,0.5))" }} />
          <motion.span
            style={{ color: "rgba(201,168,76,0.55)", fontFamily: "Amiri,serif", fontSize: 20 }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            ✦
          </motion.span>
          <div style={{ height: 1, width: 60, background: "linear-gradient(to left,transparent,rgba(201,168,76,0.5))" }} />
        </motion.div>

        {/* Description */}
        <motion.p
          initial="hidden" animate="show" custom={0.5} variants={fadeUp}
          style={{
            color: "rgba(250,247,240,0.7)",
            fontFamily: "Cairo,sans-serif",
            fontSize: "clamp(14px,3.5vw,18px)",
            lineHeight: 1.9,
            maxWidth: 520,
            margin: "0 auto 36px",
          }}
        >
          {settings?.heroDesc ?? "انضم إلى آلاف الطلاب في رحلة تعليمية استثنائية تجمع بين الأصالة والحداثة"}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial="hidden" animate="show" custom={0.6} variants={fadeUp}
          className="flex justify-center flex-wrap"
          style={{ gap: "12px" }}
        >
          <motion.div whileHover={{ y: -6, scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            <Link
              href="/register"
              style={{
                padding: "14px 32px",
                borderRadius: 16,
                background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                boxShadow: "0 6px 24px rgba(201,168,76,0.4)",
                color: "#1A1208",
                fontFamily: "Cairo,sans-serif",
                fontWeight: 700,
                fontSize: "clamp(14px,3.5vw,17px)",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              ابدأ رحلتك الآن 🚀
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -6, scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            <Link
              href="/login"
              style={{
                padding: "14px 32px",
                borderRadius: 16,
                border: "1.5px solid rgba(201,168,76,0.4)",
                background: "rgba(201,168,76,0.08)",
                color: "#E8C97A",
                fontFamily: "Cairo,sans-serif",
                fontWeight: 600,
                fontSize: "clamp(14px,3.5vw,17px)",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              تسجيل الدخول
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats bar — 2x2 on mobile, row on desktop */}
        <motion.div
          initial="hidden" animate="show" custom={0.75} variants={fadeUp}
          className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-center mt-14"
          style={{ gap: "clamp(16px,5vw,40px)" }}
        >
          {statsBar.map((s, i) => (
            <motion.div
              key={i}
              className="text-center py-2"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.85 + i * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              <div style={{ fontFamily: "Amiri,serif", color: "#C9A84C", fontSize: "clamp(28px,7vw,40px)", fontWeight: 700, lineHeight: 1.2 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: "clamp(11px,2.5vw,12px)", marginTop: 4 }}>
                {s.label}
              </div>
            </motion.div>
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
