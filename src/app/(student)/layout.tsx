"use client";
// src/app/(student)/layout.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import type { SidebarItem } from "@/components/layout/Sidebar";

const STUDENT_NAV: SidebarItem[] = [
  { id: "dashboard",  label: "لوحة التحكم",  icon: "🏠", href: "/dashboard"  },
  { id: "courses",    label: "الكورسات",      icon: "📚", href: "/courses"    },
  { id: "my-courses", label: "كورساتي",       icon: "🎓", href: "/my-courses" },
  { id: "redeem",     label: "استخدام كود",   icon: "🎟️", href: "/redeem"     },
  { id: "profile",    label: "الملف الشخصي",  icon: "👤", href: "/profile"    },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const handleClose = useCallback(() => setSidebarOpen(false), []);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#FAF7F0", direction: "rtl" }}>
      <ToastContainer />
      <Sidebar
        items={STUDENT_NAV}
        brandSub="منصة الطالب"
        onLogout={logout}
        userName={user.name}
        userAvatar={user.avatar ?? user.name.charAt(0)}
        isOpen={sidebarOpen}
        onClose={handleClose}
      />
      <main className="min-h-screen">
        {/* md:mr-64 provides desktop sidebar offset; mobile = full width */}
        <div className="md:mr-64" style={{ padding: "24px 20px" }}>
          {/* Mobile top bar */}
          <div className="flex md:hidden items-center justify-between mb-5">
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
