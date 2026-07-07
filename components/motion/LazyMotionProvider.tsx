"use client";
// src/components/motion/LazyMotionProvider.tsx
//
// BUNDLE-001 FIX: importing `motion` directly from "framer-motion" bundles
// its full animation engine synchronously into every page that uses it —
// ~100KB gzipped, even for pages doing nothing more than a simple fade-in.
// `LazyMotion` + the `m` component split that engine into a separate chunk
// loaded asynchronously the first time any animation actually needs to
// render, instead of blocking initial page load everywhere.
//
// `domMax` (not the smaller `domAnimation`) is required here specifically
// because src/components/layout/Sidebar.tsx uses `layoutId` for its active-
// nav-item indicator, which needs the layout-animation feature set that
// only `domMax` includes. This is still a net win over the previous
// approach: the cost moves from "always in the main bundle" to "one async
// chunk, loaded once, cached after."
//
// Every file that previously did
//   import { motion, AnimatePresence } from "framer-motion"
// now does
//   import { m as motion, AnimatePresence } from "framer-motion"
// — every existing <motion.div>, <motion.a>, etc. JSX usage keeps working
// unchanged; only the import line differs. AnimatePresence itself is small
// and isn't part of the lazy-loaded feature bundle.
import { LazyMotion } from "framer-motion";

// Dynamic import of a LOCAL module (not "framer-motion" again) — this is
// framer-motion's own documented pattern. Re-importing the same external
// package dynamically that's already statically imported elsewhere can get
// collapsed back into the same chunk by some bundlers, silently defeating
// the split; a separate local file guarantees it.
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export function LazyMotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
