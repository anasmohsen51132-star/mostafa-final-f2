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

const readSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
    }
    return settings as unknown as SiteSettings;
  },
  ["site-settings-singleton"],
  { revalidate: 60, tags: ["site-settings"] }
);

// React cache() on top: dedupes the (now-cached-anyway) call so a single
// request that needs it twice — generateMetadata() and <ThemeStyle> both
// read it — only invokes it once per request, cached or not.
export const getSiteSettings = cache(readSiteSettings);
