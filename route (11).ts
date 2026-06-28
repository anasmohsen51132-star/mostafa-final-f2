/* src/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@300;400;500;700;900&family=Cairo:wght@300;400;600;700;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================
   ROOT VARIABLES
   ============================================================ */
:root {
  --gold: #C9A84C;
  --gold-light: #E8C97A;
  --gold-dark: #8B6914;
  --emerald: #1A6B47;
  --emerald-light: #2D9E6B;
  --emerald-dark: #0D3D27;
  --cream: #FAF7F0;
  --ink: #1A1208;
  --ink-muted: #4A3F2A;
  --parchment: #F2EAD8;
}

/* ============================================================
   HIDE NEXT.JS DEV OVERLAYS (production-clean UI)
   ============================================================ */
/* Next.js build indicator bottom-left */
[data-nextjs-toast],
[data-nextjs-dialog],
[data-nextjs-dialog-overlay],
#__next-build-watcher,
nextjs-portal,
body > nextjs-portal,
[data-next-mark],
.__next-build-indicator,
.nextjs-toast-errors-parent,
.nextjs-container-errors-header {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* ============================================================
   BASE RESET & TYPOGRAPHY
   ============================================================ */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  /* Prevent horizontal overflow globally */
  overflow-x: hidden;
}

body {
  font-family: 'Cairo', 'Tajawal', sans-serif;
  background: var(--cream);
  color: var(--ink);
  direction: rtl;
  min-height: 100dvh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Better touch interaction on mobile */
  -webkit-tap-highlight-color: transparent;
  touch-action: pan-y;
}

h1, h2, h3, h4, h5 {
  font-family: 'Amiri', serif;
  line-height: 1.3;
}

/* ============================================================
   MOBILE-FIRST LAYOUT FIXES
   ============================================================ */

/* Prevent images from causing overflow */
img, video, iframe {
  max-width: 100%;
  height: auto;
}

/* Tables overflow gracefully */
table {
  width: 100%;
  overflow-x: auto;
  display: block;
}
/* Except when inside our styled containers */
.table-fixed {
  display: table;
}

/* Fix long words / URLs breaking layout on mobile */
p, span, h1, h2, h3, h4, label, td, th {
  overflow-wrap: break-word;
  word-break: break-word;
}

/* Ensure inputs never overflow their container */
input, textarea, select {
  max-width: 100%;
  box-sizing: border-box;
}

/* ============================================================
   MOBILE PORTRAIT SPECIFICS (< 640px)
   ============================================================ */
@media (max-width: 640px) {
  /* Reduce heading sizes */
  h1 { font-size: clamp(22px, 7vw, 32px); }
  h2 { font-size: clamp(18px, 5.5vw, 26px); }

  /* Sidebar offset — mobile has no fixed sidebar, reset margin */
  .md\:mr-64 {
    margin-right: 0 !important;
  }

  /* Page padding on small screens */
  main > div {
    padding-left: 14px !important;
    padding-right: 14px !important;
  }

  /* Stat cards — 2 column on mobile */
  .xl\:grid-cols-6,
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  /* Forms: stack inputs vertically */
  .flex.gap-3.flex-wrap > input,
  .flex.gap-3.flex-wrap > button {
    width: 100% !important;
    min-width: unset !important;
  }

  /* Modals — full width on small screens */
  .rounded-3xl.p-7 {
    padding: 20px !important;
    margin: 8px !important;
  }

  /* Admin table — ensure horizontal scroll */
  .overflow-x-auto {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  /* Code display in table */
  td span[style*="monospace"] {
    font-size: 12px !important;
    letter-spacing: 0.03em !important;
  }

  /* Quiz question cards */
  .space-y-6 > div {
    padding: 16px !important;
  }

  /* Video aspect ratio stays correct */
  [style*="aspectRatio"] {
    width: 100% !important;
  }

  /* Bottom nav bar area — give breathing room */
  main {
    padding-bottom: 24px !important;
  }
}

/* ============================================================
   SCROLLBAR
   ============================================================ */
::-webkit-scrollbar       { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--parchment); }
::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--gold-dark); }
/* Hide scrollbar on mobile while keeping scroll functionality */
@media (max-width: 768px) {
  ::-webkit-scrollbar { width: 0; height: 0; }
}

/* ============================================================
   ANIMATIONS
   ============================================================ */
@keyframes fadeUp     { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn     { from { opacity:0; }                             to { opacity:1; } }
@keyframes float      { 0%,100%{transform:translateY(0px) rotate(0deg);} 33%{transform:translateY(-12px) rotate(3deg);} 66%{transform:translateY(-6px) rotate(-2deg);} }
@keyframes shimmer    { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
@keyframes spin-slow  { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
@keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(201,168,76,0.3);} 50%{box-shadow:0 0 40px rgba(201,168,76,0.6);} }
@keyframes gradientShift { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }
@keyframes scaleIn    { from{opacity:0;transform:scale(0.92);} to{opacity:1;transform:scale(1);} }

.animate-fade-up    { animation: fadeUp 0.6s ease forwards; }
.animate-fade-in    { animation: fadeIn 0.4s ease forwards; }
.animate-scale-in   { animation: scaleIn 0.3s ease forwards; }
.animate-float      { animation: float 4s ease-in-out infinite; }
.animate-shimmer    { animation: shimmer 2s linear infinite; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
.animate-spin-slow  { animation: spin-slow 20s linear infinite; }

/* ============================================================
   GLASSMORPHISM
   ============================================================ */
.glass {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
}
.glass-dark {
  background: rgba(13,61,39,0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(201,168,76,0.2);
}

/* ============================================================
   ARABESQUE PATTERN
   ============================================================ */
.pattern-overlay {
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

/* ============================================================
   VIDEO PROTECTION
   ============================================================ */
.video-protected-wrapper {
  position: relative;
  user-select: none;
  -webkit-user-select: none;
}

/* ============================================================
   PRINT STYLES — code cards
   ============================================================ */
@media print {
  /* Hide everything except print content */
  body > *                            { display: none !important; }
  #print-sheet-root,
  #codes-print-grid                   { display: grid !important; }
  .no-print                           { display: none !important; }
  .code-card-print                    { break-inside: avoid; page-break-inside: avoid; }
  body  { background: white; direction: rtl; }
  @page { margin: 10mm; size: A4 portrait; }
}
.print-only { display: none; }

/* ============================================================
   RTL UTILITIES
   ============================================================ */
.rtl { direction: rtl; text-align: right; }
.ltr { direction: ltr; text-align: left; }

/* ============================================================
   FOCUS STYLES
   ============================================================ */
*:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ============================================================
   SELECTION COLOR
   ============================================================ */
::selection {
  background: rgba(201,168,76,0.25);
  color: var(--ink);
}

/* ============================================================
   LOADING SKELETON
   ============================================================ */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(201,168,76,0.06) 25%,
    rgba(201,168,76,0.14) 50%,
    rgba(201,168,76,0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

/* ============================================================
   TOUCH BUTTON IMPROVEMENTS
   ============================================================ */
button, a, [role="button"] {
  /* Minimum touch target 44×44px on mobile */
  min-height: 44px;
  /* Fast click response */
  touch-action: manipulation;
}
/* Override for intentionally small UI elements */
button.small-btn { min-height: unset; }

/* ============================================================
   MOBILE SIDEBAR OVERLAY — ensure it covers everything
   ============================================================ */
@media (max-width: 767px) {
  /* Ensure mobile drawer sits above everything */
  .fixed.z-50 { z-index: 9999 !important; }
  .fixed.z-40 { z-index: 9998 !important; }
}

/* ============================================================
   LINE CLAMP UTILITY
   ============================================================ */
.line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
.line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.line-clamp-3 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
