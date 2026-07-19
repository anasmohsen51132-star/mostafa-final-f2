"use client";
// src/app/(auth)/register/page.tsx
// PERF-008 FIX: see the matching note in login/page.tsx — same fix applied
// here (no infinite animations, no backdrop-filter), for the same reason.
import { m as motion } from "framer-motion";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0D3D27 0%,#1A6B47 60%,#0D3D27 100%)" }}
    >
      {/* Background pattern — static */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Static glow blobs */}
      <div
        className="absolute top-16 left-16 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(201,168,76,0.12),transparent 70%)" }}
      />
      <div
        className="absolute bottom-16 right-16 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(45,158,107,0.09),transparent 70%)" }}
      />

      {/* Card — one-time entrance only, no backdrop-filter */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
        style={{
          background: "linear-gradient(160deg, rgba(16,68,44,0.96), rgba(10,45,29,0.97))",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 28,
          padding: 40,
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
          style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)" }}
        />

        {/* Brand header */}
        <div className="text-center mb-8" style={{ direction: "rtl" }}>
          <div style={{ fontFamily: "Amiri,serif", color: "rgba(201,168,76,0.7)", fontSize: 34, marginBottom: 6 }}>
            ﷽
          </div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            انضم إلى الأكاديمية
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 13 }}>
            أنشئ حسابك وابدأ رحلة التعلم
          </p>
        </div>

        {/* Divider — static */}
        <div className="flex items-center gap-3 mb-8">
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
          <span style={{ color: "rgba(201,168,76,0.5)", fontSize: 14 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
        </div>

        {/* The form */}
        <RegisterForm />

        {/* Back to home */}
        <div className="text-center mt-6">
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
