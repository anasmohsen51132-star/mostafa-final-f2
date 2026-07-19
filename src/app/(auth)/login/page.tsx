"use client";
// src/app/(auth)/login/page.tsx
//
// PERF-008 FIX: this page used to run ~8 concurrent *infinite* Framer
// Motion animations at all times (2 pulsing orbs, 4 twinkling stars, a
// rotating divider glyph, a glowing Bismillah, plus 6 floating Arabic
// letters each animating y+rotate every frame) on top of a
// `backdrop-filter: blur(20px)` card — backdrop-filter is one of the most
// GPU/compositor-expensive CSS properties on mobile, and doing it
// continuously *while* several other elements animate underneath it is
// heavy even on decent phones. On the actual reported devices, opening the
// on-screen keyboard (which forces a viewport resize + layout reflow) on
// top of all that running animation work was what caused the freeze/lag.
//
// Fix: every animation below is now either static (no animation at all) or
// a one-time entrance transition that finishes ~0.5s after mount and never
// touches the render loop again — by the time someone taps an input to
// bring up the keyboard, there is zero ongoing animation work competing
// for the main thread. backdrop-filter is gone too, replaced by a solid,
// slightly higher-opacity card background that reads the same visually
// without the compositing cost.
import { m as motion } from "framer-motion";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,#0D3D27 0%,#1A6B47 60%,#0D3D27 100%)",
        padding: "16px",
      }}
    >
      {/* Background pattern — static, no cost */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Static glow blobs — same visual warmth as the old pulsing orbs,
          with zero animation cost since they never move. */}
      <div
        className="absolute top-10 right-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(201,168,76,0.13),transparent 70%)" }}
      />
      <div
        className="absolute bottom-10 left-10 w-28 h-28 sm:w-40 sm:h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(45,158,107,0.1),transparent 70%)" }}
      />

      {/* Card — one-time entrance only, no backdrop-filter */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full"
        style={{
          maxWidth: 440,
          background: "linear-gradient(160deg, rgba(16,68,44,0.97), rgba(10,45,29,0.98))",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 24,
          padding: "clamp(24px, 5vw, 40px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top accent bar — static */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
          style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)" }}
        />

        {/* Logo / Brand */}
        <div className="text-center mb-6" style={{ direction: "rtl" }}>
          <div
            style={{
              fontFamily: "Amiri,serif",
              color: "rgba(201,168,76,0.8)",
              fontSize: "clamp(22px, 6vw, 34px)",
              marginBottom: 6,
              lineHeight: 1.4,
              wordBreak: "keep-all",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            ﷽
          </div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(20px,5vw,26px)", fontWeight: 700, marginBottom: 4 }}>
            اكاديمية مستر مصطفى
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 13 }}>
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        {/* Divider — static */}
        <div className="flex items-center gap-3 mb-6">
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
          <span style={{ color: "rgba(201,168,76,0.5)", fontSize: 14 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
        </div>

        {/* The form */}
        <LoginForm />

        {/* Back to home */}
        <div className="text-center mt-4">
          <Link
            href="/"
            style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.3)", fontSize: 12, textDecoration: "none" }}
          >
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
