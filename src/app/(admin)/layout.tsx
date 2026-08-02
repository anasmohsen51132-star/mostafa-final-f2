"use client";
// src/app/(admin)/layout.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";
import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { SidebarItem } from "@/components/layout/Sidebar";

// Shared by ADMIN, OWNER, and DEVELOPER — matches the /admin and /api/admin
// role checks in middleware.ts. Owner-only extras (customize, settings,
// admins management) live under /owner, reached from the owner's own nav.
const ADMIN_NAV: SidebarItem[] = [
  { id: "overview",     label: "لوحة الإدارة",  icon: "🔵", href: "/admin",              section: "الرئيسية" },
  { id: "courses",      label: "الكورسات",      icon: "📚", href: "/admin/courses",      section: "الإدارة"  },
  { id: "lectures",     label: "المحاضرات",     icon: "🎬", href: "/admin/lectures",     section: "الإدارة"  },
  { id: "quiz-builder", label: "الاختبارات",    icon: "📝", href: "/admin/quiz-builder", section: "الإدارة"  },
  { id: "codes",        label: "كودات الوصول",  icon: "🎟️", href: "/admin/codes",        section: "الإدارة"  },
  { id: "students",     label: "الطلاب",        icon: "👥", href: "/admin/students",     section: "الإدارة"  },
  { id: "results",      label: "النتائج",       icon: "📊", href: "/admin/results",      section: "الإدارة"  },
  { id: "announcement", label: "الإعلان الشريطي", icon: "📢", href: "/admin/announcement", section: "الإدارة" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated, isSessionVerified, isAuthenticated, isAdmin, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    // NEXT-001 FIX: wait for the persisted store to finish rehydrating AND
    // for isSessionVerified — rehydrated `user` only has {name, avatar}
    // until /api/auth/me resolves, so isAdmin would briefly read false for
    // a real admin/owner/developer and redirect them away incorrectly.
    // Same pattern as (owner)/layout.tsx and (developer)/layout.tsx.
    if (!isHydrated || !isSessionVerified) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (!isAdmin)          { router.replace("/dashboard"); }
  }, [isHydrated, isSessionVerified, isAuthenticated, isAdmin, router]);

  const handleClose = useCallback(() => setSidebarOpen(false), []);

  if (!isHydrated || !isSessionVerified) return <FullScreenSpinner />;
  if (!isAuthenticated || !user || !isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background: "#FAF7F0", direction: "rtl" }}>
      <ToastContainer />
      <Sidebar
        items={ADMIN_NAV}
        brandSub="🔵 لوحة الإدارة"
        onLogout={logout}
        userName={user.name}
        userAvatar={user.avatar ?? user.name.charAt(0)}
        isOpen={sidebarOpen}
        onClose={handleClose}
      />
      <main className="min-h-screen">
        {/* lg:mr-64 provides desktop sidebar offset; mobile/tablet = full width. */}
        <div className="lg:mr-64 px-3 sm:px-4 md:px-5 py-4 sm:py-5 md:py-6">
          {/* Mobile top bar */}
          <div className="flex lg:hidden items-center justify-between mb-5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer" }}
              aria-label="فتح القائمة"
            >
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <rect width="20" height="2.5" rx="1.25" fill="#C9A84C"/>
                <rect y="6.75" width="14" height="2.5" rx="1.25" fill="#C9A84C"/>
                <rect y="13.5" width="20" height="2.5" rx="1.25" fill="#C9A84C"/>
              </svg>
            </button>
            <span style={{ fontFamily: "Amiri,serif", color: "#1A6B47", fontSize: 16, fontWeight: 700 }}>
              اكاديمية مستر مصطفى
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
