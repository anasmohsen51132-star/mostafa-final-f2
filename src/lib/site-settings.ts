// src/lib/site-settings.ts
//
// PERF-007 FIX: this used to be a plain per-request-deduped DB read (React
// cache() only) — meaning literally every single page navigation across
// the *entire site*, including /login and /register, triggered a fresh
// Prisma round-trip via the root layout's generateMetadata(). On a cold or
// slow DB connection this alone was multiple seconds of blank white screen
// before Next.js could even start sending page HTML — exactly the reported
// slowness, and it hit every route, not just the ones that actually show
// customized branding.
//
// Fix: wrap the DB read in unstable_cache with a 60s revalidation window.
// Site branding/colors/SEO text don't need split-second freshness across
// the whole platform — a 60s-stale worst case is an entirely reasonable
// trade-off for making every page load instant instead of blocking on a DB
// call. The OWNER's own customize dashboard is unaffected: it reads via
// GET /api/customize, which already has `export const dynamic =
// "force-dynamic"` (a separate, deliberately always-fresh code path) so
// saves still show up immediately there regardless of this cache.
import { cache } from "react";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { SiteSettings } from "@/types";

// BUGFIX: this had no error handling at all — since it backs the ROOT
// layout's generateMetadata() (which runs for literally every route with
// no exceptions), an uncaught DB error here didn't just break one page,
// it could crash the *entire site*. A brief Neon connection hiccup — this
// project has hit that before — was enough to take everything down. These
// fallback values mirror the Prisma schema's own @default(...) values, so
// failing here just means "the site looks like a fresh, uncustomized
// install for this one request" instead of a hard crash.
const FALLBACK_SETTINGS: SiteSettings = {
  id: "singleton",
  heroTitle: "اتقن اللغة العربية",
  heroSubtitle: "مع نخبة من أفضل الأساتذة",
  heroDesc: "انضم إلى آلاف الطلاب في رحلة تعليمية استثنائية تجمع بين الأصالة والحداثة",
  teacherName: "مستر مصطفى",
  teacherTitle: "خبير تدريس اللغة العربية",
  teacherBio: "معلم متميز بخبرة تزيد عن خمس عشرة عاماً في تدريس اللغة العربية لجميع المراحل الدراسية",
  teacherStats: [],
  features: [],
  platformName: "اكاديمية مستر مصطفى",
  platformTagline: "لتدريس اللغة العربية",
  loginBgGradient: "135deg, #0D3D27 0%, #1A6B47 100%",
  dashboardWelcome: "أهلاً وسهلاً بك في منصتك التعليمية",
  footerText: "© ٢٠٢٤ اكاديمية مستر مصطفى — جميع الحقوق محفوظة",
  statsBar: [],
  primaryColor: "#C9A84C", secondaryColor: "#1A6B47", accentColor: "#1A6B47",
  backgroundColor: "#F5F1E8", surfaceColor: "#FFFFFF", textColor: "#1A1208",
  buttonColor: "#C9A84C", hoverColor: "#8B6914",
  successColor: "#16A34A", warningColor: "#D97706", errorColor: "#DC2626",
  ctaButtons: [],
  announcementEnabled: false,
  announcementDismissible: true,
};

const readSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
      if (!settings) {
        settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
      }
      return settings as unknown as SiteSettings;
    } catch (e) {
      console.error("[getSiteSettings]", e);
      return FALLBACK_SETTINGS;
    }
  },
  ["site-settings-singleton"],
  { revalidate: 60, tags: ["site-settings"] }
);

// React cache() on top: dedupes the (now-cached-anyway) call so a single
// request that needs it twice — generateMetadata() and <ThemeStyle> both
// read it — only invokes it once per request, cached or not.
export const getSiteSettings = cache(readSiteSettings);
