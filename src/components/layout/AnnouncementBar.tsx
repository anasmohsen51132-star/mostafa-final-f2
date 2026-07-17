"use client";
// src/components/layout/AnnouncementBar.tsx
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

  // A "version key" derived from the announcement's own content: dismissing
  // today's announcement should NOT hide a different one the admin posts
  // next week, even though both are technically "the same field" in the DB.
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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: "hidden", background: "linear-gradient(90deg,#0D3D27,#1A6B47)" }}
        >
          <div className="relative flex items-center justify-center px-10 py-3 text-center" style={{ direction: "rtl" }}>
            {settings.announcementDismissible && (
              <button
                onClick={handleDismiss}
                aria-label="إغلاق الإعلان"
                className="absolute"
                style={{ left: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer", padding: 4 }}
              >
                ✕
              </button>
            )}
            <div>
              {settings.announcementTitle && (
                settings.announcementLink ? (
                  <a
                    href={settings.announcementLink}
                    style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontWeight: 700, fontSize: 14, textDecoration: "underline" }}
                  >
                    {settings.announcementTitle}
                  </a>
                ) : (
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontWeight: 700, fontSize: 14 }}>
                    {settings.announcementTitle}
                  </span>
                )
              )}
              {settings.announcementText && (
                <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(255,255,255,0.85)", fontSize: 12.5, marginTop: 2 }}>
                  {settings.announcementText}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
