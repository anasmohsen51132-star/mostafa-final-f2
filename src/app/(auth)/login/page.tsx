"use client";
// src/app/(auth)/login/page.tsx
import { motion } from "framer-motion";
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
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Orbs — hidden on very small screens to avoid overflow */}
      <motion.div
        className="absolute top-10 right-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-28 h-28 sm:w-40 sm:h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(45,158,107,0.12),transparent 70%)" }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Stars — only on screens wider than mobile */}
      {[
        { top: "15%", left: "12%", delay: 0 },
        { top: "70%", left: "8%",  delay: 0.8 },
        { top: "25%", left: "88%", delay: 1.4 },
        { top: "80%", left: "85%", delay: 0.4 },
      ].map((star, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none hidden sm:block"
          style={{ top: star.top, left: star.left, fontSize: 14, color: "rgba(232,201,122,0.5)" }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
        >
          ✦
        </motion.div>
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 w-full lux-shine-border"
        style={{
          maxWidth: 440,
          background: "rgba(13,61,39,0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 24,
          padding: "clamp(24px, 5vw, 40px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
          style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)" }}
        />

        {/* Logo / Brand */}
        <div className="text-center mb-6" style={{ direction: "rtl" }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 300 }}
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
            <motion.span
              animate={{ filter: ["drop-shadow(0 0 0px rgba(232,201,122,0))","drop-shadow(0 0 10px rgba(232,201,122,0.6))","drop-shadow(0 0 0px rgba(232,201,122,0))"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              ﷽
            </motion.span>
          </motion.div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(20px,5vw,26px)", fontWeight: 700, marginBottom: 4 }}>
            اكاديمية مستر مصطفى
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 13 }}>
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
          <motion.span
            style={{ color: "rgba(201,168,76,0.4)", fontSize: 14 }}
            animate={{ opacity: [0.4, 1, 0.4], rotate: [0, 180, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            ✦
          </motion.span>
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
