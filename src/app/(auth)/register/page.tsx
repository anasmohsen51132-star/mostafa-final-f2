"use client";
// src/app/(auth)/register/page.tsx

import { m as motion } from "framer-motion";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main
      className="min-h-screen relative flex justify-center overflow-x-hidden"
      style={{
        minHeight: "100dvh",
        alignItems: "center",
        background:
          "linear-gradient(135deg,#0D3D27 0%,#1A6B47 60%,#0D3D27 100%)",
        padding: "clamp(16px, 4vw, 32px)",
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Static glows */}
      <div
        className="absolute top-0 left-0 w-40 h-40 sm:w-52 sm:h-52 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(201,168,76,0.12),transparent 70%)",
        }}
      />

      <div
        className="absolute bottom-0 right-0 w-32 h-32 sm:w-44 sm:h-44 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle,rgba(45,158,107,0.12),transparent 70%)",
        }}
      />

      {/* Register card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full"
        style={{
          maxWidth: 500,
          margin: "auto",
          background:
            "linear-gradient(160deg,rgba(16,68,44,0.97),rgba(10,45,29,0.98))",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: "clamp(20px, 5vw, 28px)",
          padding: "clamp(22px, 6vw, 40px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg,transparent,rgba(201,168,76,0.7),transparent)",
          }}
        />

        {/* Brand header */}
        <div
          className="text-center"
          dir="rtl"
          style={{ marginBottom: "clamp(20px, 5vw, 28px)" }}
        >
          {/* Basmala */}
          <div
            className="flex items-center justify-center gap-2 sm:gap-3"
            style={{ marginBottom: 14 }}
          >
            <div
              style={{
                width: "clamp(18px,6vw,44px)",
                height: 1,
                background:
                  "linear-gradient(to left,transparent,rgba(201,168,76,0.7))",
              }}
            />

            <div
              style={{
                position: "relative",
                padding: "7px clamp(8px,2vw,14px)",
                borderTop: "1px solid rgba(201,168,76,0.25)",
                borderBottom: "1px solid rgba(201,168,76,0.25)",
                background:
                  "linear-gradient(90deg,transparent,rgba(201,168,76,0.07),transparent)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "Amiri, serif",
                  color: "#E8C97A",
                  fontSize: "clamp(13px,4.1vw,27px)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  textShadow: "0 2px 12px rgba(201,168,76,0.35)",
                }}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>

              <span
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "#C9A84C",
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ✦
              </span>
            </div>

            <div
              style={{
                width: "clamp(18px,6vw,44px)",
                height: 1,
                background:
                  "linear-gradient(to right,transparent,rgba(201,168,76,0.7))",
              }}
            />
          </div>

          <h1
            style={{
              fontFamily: "Amiri, serif",
              color: "#E8C97A",
              fontSize: "clamp(23px,5.5vw,30px)",
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 5,
            }}
          >
            انضم إلى الأكاديمية
          </h1>

          <p
            style={{
              fontFamily: "Cairo, sans-serif",
              color: "rgba(250,247,240,0.55)",
              fontSize: "clamp(12px,3.5vw,13px)",
              margin: 0,
            }}
          >
            أنشئ حسابك وابدأ رحلة التعلم
          </p>
        </div>

        {/* Divider */}
        <div
          className="flex items-center gap-3"
          style={{ marginBottom: "clamp(20px, 5vw, 28px)" }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(201,168,76,0.2)",
            }}
          />
          <span style={{ color: "rgba(201,168,76,0.6)", fontSize: 14 }}>
            ✦
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(201,168,76,0.2)",
            }}
          />
        </div>

        <RegisterForm />

        <div className="text-center" style={{ marginTop: 20 }}>
          <Link
            href="/"
            style={{
              fontFamily: "Cairo, sans-serif",
              color: "rgba(250,247,240,0.4)",
              fontSize: "clamp(11px,3vw,12px)",
              textDecoration: "none",
            }}
          >
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
