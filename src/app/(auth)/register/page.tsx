client";
// src/app/(auth)/register/page.tsx
import { motion } from "framer-motion";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0D3D27 0%,#1A6B47 60%,#0D3D27 100%)" }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Orbs */}
      <motion.div
        className="absolute top-16 left-16 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(201,168,76,0.13),transparent 70%)" }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-16 right-16 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(45,158,107,0.1),transparent 70%)" }}
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
        style={{
          background: "rgba(13,61,39,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 28,
          padding: 40,
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
          style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.6),transparent)" }}
        />

        {/* Brand header */}
        <div className="text-center mb-8" style={{ direction: "rtl" }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 300 }}
            style={{ fontFamily: "Amiri,serif", color: "rgba(201,168,76,0.65)", fontSize: 34, marginBottom: 6 }}
          >
            ﷽
          </motion.div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            انضم إلى الأكاديمية
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 13 }}>
            أنشئ حسابك وابدأ رحلة التعلم
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
          <span style={{ color: "rgba(201,168,76,0.4)", fontSize: 14 }}>✦</span>
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
