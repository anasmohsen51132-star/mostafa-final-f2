// src/app/manifest.ts
//
// Next.js App Router convention: automatically served at
// /manifest.webmanifest, with Next.js auto-injecting the matching
// <link rel="manifest"> tag into every page's <head> — no manual wiring
// needed in layout.tsx.
import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_NAME_SHORT, SITE_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME_SHORT,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F0", // brand cream
    theme_color: "#1A6B47",      // brand emerald
    lang: "ar",
    dir: "rtl",
    icons: [
      // BUGFIX: this used to reference /icon and /icon-512 — the routes
      // for the old code-generated (single-letter) icons, which have now
      // been replaced by the real logo the owner supplied. Static icon
      // files under src/app/ (icon.png, apple-icon.png) are served at
      // /icon.png and /apple-icon.png respectively; the two extra manifest
      // sizes live as plain files in /public.
      { src: "/icon.png", sizes: "32x32", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
