"use client";
// src/components/layout/Sidebar.tsx
import { m as motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string | number;
  section?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  brandTitle?: string;
  brandSub?: string;
  onLogout?: () => void;
  userName?: string;
  userAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  items,
  brandTitle = "اكاديمية مستر مصطفى",
  brandSub,
  onLogout,
  userName,
  userAvatar = "م",
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const sections = items.reduce<Record<string, SidebarItem[]>>((acc, item) => {
    const sec = item.section || "_";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  // Shared inner content rendered in both desktop aside and mobile drawer
  const inner = (
    <div className="h-full flex flex-col overflow-y-auto" style={{ background: "#0D3D27", direction: "rtl" }}>
      {/* Brand */}
      <div className="px-5 py-6 flex-shrink-0" style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div className="text-[10px] font-semibold tracking-widest mb-1 uppercase"
          style={{ color: "rgba(201,168,76,0.4)", fontFamily: "Cairo,sans-serif" }}>
          {brandSub ?? "المنصة التعليمية"}
        </div>
        <div className="text-[15px] font-bold leading-tight"
          style={{ color: "#E8C97A", fontFamily: "Amiri,serif" }}>
          {brandTitle}
        </div>
      </div>

      {/* User badge */}
      {userName && (
        <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#C9A84C,#2D9E6B)", color: "#1A1208" }}>
              {userAvatar}
            </div>
            <span className="text-sm truncate" style={{ color: "rgba(250,247,240,0.8)", fontFamily: "Cairo,sans-serif" }}>
              {userName}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4">
        {Object.entries(sections).map(([section, sectionItems]) => (
          <div key={section}>
            {section !== "_" && (
              <div className="px-5 py-2 text-[10px] tracking-widest uppercase font-semibold"
                style={{ color: "rgba(250,247,240,0.3)", fontFamily: "Cairo,sans-serif" }}>
                {section}
              </div>
            )}
            {sectionItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.id} href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200 relative",
                    isActive ? "border-r-[3px] border-[#C9A84C]" : "hover:bg-white/5"
                  )}
                  style={{
                    color: isActive ? "#C9A84C" : "rgba(250,247,240,0.7)",
                    fontFamily: "Cairo,sans-serif",
                    background: isActive ? "rgba(201,168,76,0.1)" : undefined,
                  }}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div layoutId="sidebar-active-bg"
                        className="absolute inset-0"
                        style={{ background: "rgba(201,168,76,0.08)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                  </AnimatePresence>
                  <span className="relative z-10 text-base">{item.icon}</span>
                  <span className="relative z-10 flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="relative z-10 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "#C9A84C", color: "#1A1208" }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      {onLogout && (
        <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
          <button onClick={() => { onLogout(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm"
            style={{ color: "rgba(250,247,240,0.5)", fontFamily: "Cairo,sans-serif", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget).style.color = "#F87171"; (e.currentTarget).style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.color = "rgba(250,247,240,0.5)"; (e.currentTarget).style.background = "none"; }}
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ══ DESKTOP ≥768px — fixed sidebar ══ */}
      <aside className="hidden md:flex fixed top-0 right-0 h-screen w-64 flex-col z-50"
        style={{ background: "#0D3D27" }}>
        {inner}
      </aside>

      {/* ══ MOBILE <768px — slide-in drawer ══ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.aside key="drawer"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="fixed top-0 right-0 h-full w-72 z-50 md:hidden shadow-2xl"
              style={{ background: "#0D3D27" }}
            >
              {/* Close button */}
              <button onClick={onClose}
                className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
                style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
                  color: "#C9A84C", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
                aria-label="إغلاق القائمة">×</button>
              {inner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
