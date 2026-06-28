"use client";
// src/app/(owner)/layout.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";
import { FullScreenSpinner } from "@/components/ui/FullScreenSpinner";
import { useAuth } from "@/hooks/useAuth";
import type { SidebarItem } from "@/components/layout/Sidebar";

const OWNER_NAV: SidebarItem[] = [
  { id: "overview",  label: "لوحة المالك",    icon: "👑", href: "/owner",           section: "الرئيسية" },
  { id: "courses",   label: "الكورسات",        icon: "📚", href: "/admin/courses",   section: "الإدارة"  },
  { id: "lectures",  label: "المحاضرات",       icon: "🎬", href: "/admin/lectures",  section: "الإدارة"  },
  { id: "codes",     label: "كودات الوصول",    icon: "🎟️", href: "/admin/codes",     section: "الإدارة"  },
  { id: "students",  label: "الطلاب",          icon: "👥", href: "/admin/students",  section: "الإدارة"  },
  { id: "results",   label: "النتائج",          icon: "📊", href: "/admin/results",   section: "الإدارة"  },
  { id: "admins",    label: "المشرفون",        icon: "🔵", href: "/owner/admins",    section: "المالك"   },
  { id: "customize", label: "تخصيص المنصة",   icon: "🎨", href: "/owner/customize", section: "المالك"   },
  { id: "settings",  label: "الإعدادات",       icon: "⚙️", href: "/owner/settings",  section: "المالك"   },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated, isAuthenticated, isOwner, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (!isOwner)          { router.replace("/dashboard"); }
  }, [isHydrated, isAuthenticated, isOwner, router]);

  const handleClose = useCallback(() => setSidebarOpen(false), []);

  if (!isHydrated) return <FullScreenSpinner />;
  if (!isAuthenticated || !user || !isOwner) return null;

  return (
    <div className="min-h-screen" style={{ background: "#F5F1E8", direction: "rtl" }}>
      <ToastContainer />
      <Sidebar
        items={OWNER_NAV}
        brandSub="👑 لوحة المالك"
        onLogout={logout}
        userName={user.name}
        userAvatar={user.avatar ?? user.name.charAt(0)}
        isOpen={sidebarOpen}
        onClose={handleClose}
      />
      <main className="min-h-screen">
        <div className="md:mr-64" style={{ padding: "24px 20px" }}>
          {/* Mobile top bar */}
          <div className="flex md:hidden items-center justify-between mb-5">
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
              👑 لوحة المالك
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
