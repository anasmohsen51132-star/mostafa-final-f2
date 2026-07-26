"use client";
// src/app/(developer)/layout.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";
import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";
import { useAuth } from "@/hooks/useAuth";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";
import type { SidebarItem } from "@/components/layout/Sidebar";

// Reuses the same DEVELOPER_MODULES list that drives the dashboard home
// cards, plus a "Dashboard" entry pointing at /developer itself, so the
// sidebar never drifts out of sync with the module registry.
const DEVELOPER_NAV: SidebarItem[] = [
  { id: "overview", label: "لوحة التحكم", icon: "🖥️", href: "/developer", section: "الرئيسية" },
  ...DEVELOPER_MODULES.map((m) => ({
    id: m.id,
    label: m.label,
    icon: m.icon,
    href: m.href,
    section: "الوحدات",
  })),
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated, isSessionVerified, isAuthenticated, isDeveloper, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    // Same pattern as (owner)/layout.tsx and (admin)/layout.tsx: wait for
    // the authoritative role from /api/auth/me (isSessionVerified) before
    // making any redirect decision — right after localStorage rehydration
    // `user` only has {name, avatar}, so isDeveloper would briefly read
    // false for a real developer and redirect them away incorrectly.
    if (!isHydrated || !isSessionVerified) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    // Unlike /owner and /admin, this area is exclusive to DEVELOPER —
    // OWNER does not fall through here, matching middleware.ts.
    if (!isDeveloper)      { router.replace("/dashboard"); }
  }, [isHydrated, isSessionVerified, isAuthenticated, isDeveloper, router]);

  const handleClose = useCallback(() => setSidebarOpen(false), []);

  if (!isHydrated || !isSessionVerified) return <FullScreenSpinner />;
  if (!isAuthenticated || !user || !isDeveloper) return null;

  return (
    <div className="min-h-screen" style={{ background: "#F5F1E8", direction: "rtl" }}>
      <ToastContainer />
      <div className="print:hidden">
        <Sidebar
          items={DEVELOPER_NAV}
          brandSub="🛠️ لوحة المطور"
          onLogout={logout}
          userName={user.name}
          userAvatar={user.avatar ?? user.name.charAt(0)}
          isOpen={sidebarOpen}
          onClose={handleClose}
        />
      </div>
      <main className="min-h-screen">
        <div className="lg:mr-64 print:mr-0 px-3 sm:px-4 md:px-5 py-4 sm:py-5 md:py-6">
          {/* Mobile top bar */}
          <div className="flex lg:hidden print:hidden items-center justify-between mb-5">
            <button onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer" }}
              aria-label="فتح القائمة">
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <rect width="20" height="2.5" rx="1.25" fill="#C9A84C"/>
                <rect y="6.75" width="14" height="2.5" rx="1.25" fill="#C9A84C"/>
                <rect y="13.5" width="20" height="2.5" rx="1.25" fill="#C9A84C"/>
              </svg>
            </button>
            <span style={{ fontFamily: "Amiri,serif", color: "#1A6B47", fontSize: 16, fontWeight: 700 }}>
              🛠️ لوحة المطور
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#C9A84C,#2D9E6B)", color: "#1A1208" }}>
              {user.avatar ?? user.name.charAt(0)}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
