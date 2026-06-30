"use client";
// src/app/(owner)/owner/settings/page.tsx
import { m as motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

export default function OwnerSettingsPage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 24 }}>
          الإعدادات
        </h1>

        {/* Profile */}
        <div className="rounded-3xl p-7 mb-6"
          style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 4px 20px rgba(26,18,8,0.05)" }}>
          <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 20 }}>
            حساب المالك
          </h2>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ background: "linear-gradient(135deg,#C9A84C,#8B6914)", color: "#1A1208" }}>
              {user.avatar ?? user.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 18, fontWeight: 700 }}>
                {user.name}
              </h3>
              <span style={{
                display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: "rgba(201,168,76,0.15)", color: "#8B6914", fontFamily: "Cairo,sans-serif",
              }}>
                👑 مالك المنصة
              </span>
            </div>
          </div>
          {[
            { icon: "📱", label: "رقم الهاتف",       value: user.phone },
            { icon: "📅", label: "تاريخ التسجيل",   value: formatDate(user.joinedAt) },
            { icon: "🔑", label: "الصلاحية",         value: "وصول كامل لجميع الإعدادات" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
              <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
                {row.icon} {row.label}
              </span>
              <span style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 600 }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: "🎨", label: "تخصيص المنصة",    href: "/owner/customize" },
            { icon: "🔵", label: "إدارة المشرفين",  href: "/owner/admins"   },
            { icon: "📊", label: "لوحة التحكم",      href: "/owner"          },
          ].map((link) => (
            <a key={link.label} href={link.href} style={{ textDecoration: "none" }}>
              <motion.div whileHover={{ y: -3 }} className="rounded-2xl p-5 text-center"
                style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", cursor: "pointer" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{link.icon}</div>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, fontWeight: 600 }}>
                  {link.label}
                </p>
              </motion.div>
            </a>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all hover:-translate-y-0.5 max-w-sm"
          style={{
            border: "1.5px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.05)",
            color: "#DC2626", fontFamily: "Cairo,sans-serif", cursor: "pointer",
          }}
        >
          🚪 تسجيل الخروج
        </button>
      </motion.div>
    </div>
  );
}
