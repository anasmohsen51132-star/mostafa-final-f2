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
    // BUGFIX: find-then-create was two separate round-trips. Under
    // concurrent requests (e.g. several admin-panel components fetching
    // settings at once on the very first load, before this row exists),
    // two requests could both see `null` from findUnique and both try to
    // create the same `id: "singleton"` row — the second create() then
    // throws a unique-constraint error, which (via generateMetadata, which
    // runs on every route) surfaced as the site-wide error screen instead
    // of a page-specific one. upsert is atomic: Postgres itself resolves
    // the race, so no client-side create-vs-create collision is possible.
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
    return settings as unknown as SiteSettings;
  },
  ["site-settings-singleton"],
  { revalidate: 60, tags: ["site-settings"] }
);

// React cache() on top: dedupes the (now-cached-anyway) call so a single
// request that needs it twice — generateMetadata() and <ThemeStyle> both
// read it — only invokes it once per request, cached or not.
export const getSiteSettings = cache(readSiteSettings);
