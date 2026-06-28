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

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: "easeOut" } }),
};

// الحروف العربية الطافية في الخلفية
const FLOATING_LETTERS = [
  { char: "ع", x: "8%",  y: "18%", size: 120, duration: 14, delay: 0,   rotate: -15 },
  { char: "ر", x: "82%", y: "12%", size: 90,  duration: 18, delay: 1.5, rotate: 12  },
  { char: "ب", x: "72%", y: "62%", size: 140, duration: 12, delay: 0.8, rotate: -8  },
  { char: "ي", x: "5%",  y: "65%", size: 100, duration: 16, delay: 2.2, rotate: 20  },
  { char: "ة", x: "88%", y: "40%", size: 80,  duration: 20, delay: 0.4, rotate: -20 },
  { char: "م", x: "15%", y: "80%", size: 110, duration: 15, delay: 1.8, rotate: 8   },
  { char: "ص", x: "50%", y: "8%",  size: 70,  duration: 22, delay: 3,   rotate: -5  },
  { char: "ا", x: "60%", y: "78%", size: 95,  duration: 17, delay: 1.1, rotate: 15  },
  { char: "ف", x: "35%", y: "88%", size: 65,  duration: 19, delay: 2.6, rotate: -12 },
  { char: "ن", x: "92%", y: "80%", size: 85,  duration: 13, delay: 0.6, rotate: 18  },
];

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

      {/* ── الحروف العربية الطافية ── */}
      {FLOATING_LETTERS.map((l, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            left: l.x,
            top: l.y,
            fontFamily: "Amiri,serif",
            fontSize: l.size,
            color: "rgba(201,168,76,0.07)",
            fontWeight: 700,
            lineHeight: 1,
            rotate: l.rotate,
            willChange: "transform",
          }}
          animate={{
            y: [0, -22, 8, -14, 0],
            rotate: [l.rotate, l.rotate + 6, l.rotate - 4, l.rotate + 2, l.rotate],
            opacity: [0.07, 0.13, 0.07, 0.11, 0.07],
          }}
          transition={{
            duration: l.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: l.delay,
          }}
        >
          {l.char}
        </motion.div>
      ))}

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

        {/* Main heading */}
        <motion.h1
          initial="hidden" animate="show" custom={0.22} variants={fadeUp}
          style={{
            fontFamily: "Amiri,serif",
            color: "#E8C97A",
            fontSize: "clamp(30px,8vw,72px)",
            lineHeight: 1.3,
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
          <Link
            href="/register"
            className="transition-transform hover:-translate-y-1 active:translate-y-0"
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
          <Link
            href="/login"
            className="transition-transform hover:-translate-y-1 active:translate-y-0"
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

        {/* Stats bar — 2x2 on mobile, row on desktop */}
        <motion.div
          initial="hidden" animate="show" custom={0.75} variants={fadeUp}
          className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-center mt-14"
          style={{ gap: "clamp(16px,5vw,40px)" }}
        >
          {statsBar.map((s, i) => (
            <div key={i} className="text-center py-2">
              <div style={{ fontFamily: "Amiri,serif", color: "#C9A84C", fontSize: "clamp(28px,7vw,40px)", fontWeight: 700, lineHeight: 1.2 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: "clamp(11px,2.5vw,12px)", marginTop: 4 }}>
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
