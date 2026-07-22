"use client";
// src/app/(developer)/developer/page.tsx
import { m as motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ComingSoonCard } from "@/components/developer/ComingSoonCard";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";

export default function DeveloperDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header banner — mirrors the owner/admin dashboard banners */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", boxShadow: "0 8px 40px rgba(13,61,39,0.3)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}
          />
          <motion.div
            className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <div className="relative z-10">
            <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.7)", fontSize: 13 }}>
              🛠️ لوحة المطور
            </span>
            <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(22px,3.5vw,40px)", marginTop: 4, marginBottom: 8 }}>
              أهلاً، {user?.name}
            </h1>
            <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.65)", fontSize: 14 }}>
              هذه هي بداية أدوات المطور الخاصة بالمنصة — المزيد من الوحدات قادم قريباً
            </p>
          </div>
        </div>
      </motion.div>

      {/* Module cards */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24, marginBottom: 16 }}>
          الوحدات
        </h2>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {DEVELOPER_MODULES.map((mod) => (
            <StaggerItem key={mod.id}>
              <ComingSoonCard module={mod} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </motion.div>
    </div>
  );
}
