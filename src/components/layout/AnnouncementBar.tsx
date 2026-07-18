"use client";
// src/components/layout/AnnouncementCard.tsx
//
// CUSTOM-010 v2: this used to be a full-width bar wired into providers.tsx
// (site-wide — landing page, admin, everywhere). Per request, it's now
// student-dashboard-only, so it's rendered from (student)/layout.tsx
// instead, and redesigned to sit as a proper card inside the dashboard's
// content column rather than a thin bar spanning the whole viewport.
import { useEffect, useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import type { SiteSettings } from "@/types";

const DISMISS_KEY = "announcement-dismissed";

export function AnnouncementBar() {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchWithAuth("/api/customize"),
    staleTime: 60_000,
  });

  const settings: SiteSettings | undefined = data?.data;

  const versionKey = settings
    ? `${settings.announcementTitle ?? ""}|${settings.announcementText ?? ""}|${settings.announcementLink ?? ""}`
    : null;

  useEffect(() => {
    setHydrated(true);
    try {
      setDismissedKey(localStorage.getItem(DISMISS_KEY));
    } catch {
      /* localStorage unavailable (private mode) — just never treat as dismissed */
    }
  }, []);

  const handleDismiss = () => {
    if (!versionKey) return;
    setDismissedKey(versionKey);
    try {
      localStorage.setItem(DISMISS_KEY, versionKey);
    } catch {
      /* non-critical */
    }
  };

  const shouldShow =
    hydrated &&
    !!settings?.announcementEnabled &&
    !!(settings?.announcementTitle || settings?.announcementText) &&
    !(settings?.announcementDismissible && dismissedKey === versionKey);

  return (
    <AnimatePresence>
      {shouldShow && settings && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl mb-5"
          style={{
            background: "linear-gradient(120deg,#0D3D27 0%,#1A6B47 55%,#0D3D27 100%)",
            border: "1px solid rgba(201,168,76,0.35)",
            boxShadow: "0 8px 28px rgba(13,61,39,0.28)",
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 220, height: 220, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)",
              top: -90, insetInlineStart: -60,
            }}
          />

          <div className="relative flex items-start gap-4 px-5 py-4" style={{ direction: "rtl" }}>
            {/* Icon badge */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 42, height: 42,
                background: "rgba(201,168,76,0.16)",
                border: "1px solid rgba(201,168,76,0.4)",
                fontSize: 19,
              }}
            >
              📢
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              {settings.announcementTitle && (
                <h3
                  style={{
                    fontFamily: "Amiri,serif", color: "#E8C97A", fontWeight: 700,
                    fontSize: 16, lineHeight: 1.5, marginBottom: settings.announcementText ? 3 : 0,
                  }}
                >
                  {settings.announcementTitle}
                </h3>
              )}
              {settings.announcementText && (
                <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.82)", fontSize: 13, lineHeight: 1.6 }}>
                  {settings.announcementText}
                </p>
              )}
              {settings.announcementLink && (
                <a
                  href={settings.announcementLink}
                  className="inline-flex items-center gap-1 mt-2.5 rounded-full transition-transform hover:-translate-y-0.5"
                  style={{
                    padding: "6px 16px", background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                    color: "#1A1208", fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: 12.5,
                  }}
                >
                  اعرف أكتر ←
                </a>
              )}
            </div>

            {settings.announcementDismissible && (
              <button
                onClick={handleDismiss}
                aria-label="إغلاق الإعلان"
                className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                style={{ width: 28, height: 28, background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
