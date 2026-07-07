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
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
