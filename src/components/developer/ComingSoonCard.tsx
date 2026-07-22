"use client";
// src/components/developer/ComingSoonCard.tsx
import { m as motion } from "framer-motion";
import Link from "next/link";
import type { DeveloperModule } from "@/components/developer/developerModules";

interface ComingSoonCardProps {
  module: DeveloperModule;
}

// A single "Coming Soon" card on the Developer Dashboard home. Purely
// presentational — no data fetching, no fake metrics, just an icon, a
// label, a short description and a "قريباً" badge. Clicking it navigates
// to the module's own placeholder page (see ComingSoonModule).
export function ComingSoonCard({ module }: ComingSoonCardProps) {
  return (
    <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
      <Link href={module.href} style={{ textDecoration: "none" }}>
        <div
          className="rounded-2xl p-6 h-full relative overflow-hidden"
          style={{
            background: "#fff",
            border: "1px solid rgba(201,168,76,0.18)",
            boxShadow: "0 4px 16px rgba(26,18,8,0.05)",
            cursor: "pointer",
          }}
        >
          <span
            className="absolute top-4 left-4 text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{
              background: "rgba(201,168,76,0.12)",
              color: "#8A6D1D",
              fontFamily: "Cairo,sans-serif",
            }}
          >
            قريباً
          </span>

          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
            style={{ background: "rgba(13,61,39,0.08)" }}
          >
            {module.icon}
          </div>

          <h3
            style={{
              fontFamily: "Cairo,sans-serif",
              color: "#1A1208",
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {module.label}
          </h3>

          <p
            style={{
              fontFamily: "Cairo,sans-serif",
              color: "#7A6E5A",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {module.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
