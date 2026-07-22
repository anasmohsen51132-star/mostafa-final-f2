"use client";
// src/components/developer/ComingSoonModule.tsx
import { m as motion } from "framer-motion";
import Link from "next/link";
import type { DeveloperModule } from "@/components/developer/developerModules";

interface ComingSoonModuleProps {
  module: DeveloperModule;
}

// Full-page placeholder rendered by every developer/<module>/page.tsx.
// Intentionally static — no data fetching, no charts, no dynamic content.
// This is ONLY the UI foundation; each module's real implementation
// (monitoring, security scans, etc.) is explicitly out of scope for this task.
export function ComingSoonModule({ module }: ComingSoonModuleProps) {
  return (
    <div style={{ direction: "rtl" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg,#0D3D27,#1A6B47)",
          boxShadow: "0 8px 40px rgba(13,61,39,0.3)",
          minHeight: "50vh",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
          style={{ background: "rgba(201,168,76,0.15)" }}
        >
          {module.icon}
        </div>

        <span
          style={{
            fontFamily: "Cairo,sans-serif",
            color: "rgba(201,168,76,0.7)",
            fontSize: 13,
            marginBottom: 6,
            display: "block",
          }}
        >
          🛠️ لوحة المطور
        </span>

        <h1
          style={{
            fontFamily: "Amiri,serif",
            color: "#E8C97A",
            fontSize: "clamp(20px,3vw,32px)",
            marginBottom: 12,
          }}
        >
          {module.label}
        </h1>

        <p
          style={{
            fontFamily: "Cairo,sans-serif",
            color: "rgba(250,247,240,0.75)",
            fontSize: 14,
            maxWidth: 460,
            lineHeight: 1.8,
            marginBottom: 24,
          }}
        >
          سيتم تفعيل هذا القسم في مهام قادمة.
        </p>

        <Link
          href="/developer"
          style={{
            background: "#C9A84C",
            color: "#1A1208",
            borderRadius: 10,
            padding: "9px 22px",
            fontWeight: 700,
            fontFamily: "Cairo,sans-serif",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          الرجوع للوحة المطور
        </Link>
      </motion.div>
    </div>
  );
}
