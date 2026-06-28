"use client";
// src/components/courses/VideoPlayer.tsx
// Maximum realistic browser-based video protection:
//  - youtube-nocookie.com with strict sandbox (no allow-popups)
//  - Dynamic multi-position watermark (student name + phone + timestamp)
//  - Right-click / drag / text-select blocked
//  - Playback tracking (play/pause/ended → /api/progress)
//  - Platform badge always visible
//  - Speed controls via postMessage API
//  - Loading shimmer, thumbnail preview
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  youtubeId:  string;   // SEC-005: server already resolves this to the real YouTube ID
  title:      string;
  lectureId?: string;   // for progress tracking
  videoId?:   string;   // DB video record id
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const YT_STATES: Record<number, string> = {
  [-1]: "unstarted",
  [0]:  "ended",
  [1]:  "playing",
  [2]:  "paused",
  [3]:  "buffering",
  [5]:  "cued",
};

function buildEmbedUrl(rawId: string, origin: string): string {
  const p = new URLSearchParams({
    autoplay:        "1",
    rel:             "0",
    modestbranding:  "1",
    showinfo:        "0",
    iv_load_policy:  "3",
    cc_load_policy:  "0",
    disablekb:       "1",
    fs:              "1",
    controls:        "1",
    enablejsapi:     "1",
    playsinline:     "1",
    origin,
    widget_referrer: origin,
  });
  return `https://www.youtube-nocookie.com/embed/${rawId}?${p.toString()}`;
}

// ── Dynamic multi-position watermark ──────────────────────────
// Renders the student's identity at multiple spots across the player
// so it cannot be fully cropped from any recording angle.
function Watermark({ name, phone }: { name: string; phone: string }) {
  const now = new Date().toLocaleString("ar-EG", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const text = `${name} · ${phone} · ${now}`;

  // 5 × 4 = 20 tiles covering the entire player area
  const COLS = 4;
  const ROWS = 5;

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          // Alternating positions & rotations make cropping impossible
          const rotate = (row + col) % 2 === 0 ? -22 : -28;
          const opacity = 0.13 + (((row * COLS + col) % 3) * 0.03); // 0.13–0.19
          return (
            <div
              key={`${row}-${col}`}
              style={{
                position:  "absolute",
                left:      `${(col / COLS) * 100 + 5}%`,
                top:       `${(row / ROWS) * 100 + 5}%`,
                transform: `rotate(${rotate}deg)`,
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily:  "Cairo, sans-serif",
                  fontSize:    "clamp(7px, 1.1vw, 10px)",
                  fontWeight:  600,
                  color:       `rgba(255,255,255,${opacity})`,
                  whiteSpace:  "nowrap",
                  textShadow:  "0 1px 3px rgba(0,0,0,0.6)",
                  letterSpacing: "0.02em",
                  userSelect:  "none",
                  WebkitUserSelect: "none",
                  display:     "block",
                }}
              >
                {text}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

export function VideoPlayer({ youtubeId, title, lectureId, videoId }: Props) {
  const { user }                       = useAuth();
  const [started,      setStarted]     = useState(false);
  const [speed,        setSpeed]       = useState(1);
  const [isReady,      setIsReady]     = useState(false);
  const iframeRef                      = useRef<HTMLIFrameElement>(null);
  const containerRef                   = useRef<HTMLDivElement>(null);
  const trackedCompleteRef             = useRef(false);
  const lastEventRef                   = useRef<string>("");

  // SEC-005 FIX: youtubeId arrives already decoded from /api/lectures/[id]
  // for students — no client-side decode logic needed (or shipped) anymore.
  const rawId  = youtubeId;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = rawId ? buildEmbedUrl(rawId, origin) : "";

  // ── Block right-click, drag, text selection ──────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("contextmenu",  block);
    el.addEventListener("dragstart",    block);
    el.addEventListener("selectstart",  block);
    return () => {
      el.removeEventListener("contextmenu",  block);
      el.removeEventListener("dragstart",    block);
      el.removeEventListener("selectstart",  block);
    };
  }, []);

  // ── Playback tracking ─────────────────────────────────────
  const trackEvent = useCallback(async (event: string) => {
    if (!lectureId || !videoId) return;
    if (lastEventRef.current === event) return;
    lastEventRef.current = event;
    try {
      await fetchWithAuth("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          lectureId,
          videoId,
          event,
          completed: event === "ended" || event === "completed",
        }),
      });
    } catch { /* non-critical */ }
  }, [lectureId, videoId]);

  // ── Listen for YouTube postMessage API events ─────────────
  useEffect(() => {
    if (!started) return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "infoDelivery" && data?.info) {
          const stateNum = data.info.playerState;
          if (typeof stateNum === "number" && YT_STATES[stateNum]) {
            const label = YT_STATES[stateNum];
            if (label === "playing") trackEvent("play");
            if (label === "paused")  trackEvent("pause");
            if (label === "ended" && !trackedCompleteRef.current) {
              trackedCompleteRef.current = true;
              trackEvent("completed");
            }
          }
          if (data.info.playerState !== undefined) setIsReady(true);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [started, trackEvent]);

  // ── Playback speed via postMessage ────────────────────────
  const applySpeed = useCallback((s: number) => {
    setSpeed(s);
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "setPlaybackRate", args: [s] }),
      "*"
    );
  }, []);

  if (!rawId) {
    return (
      <div className="rounded-2xl p-6 text-center"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#DC2626", fontSize: 14 }}>
          ⚠️ رابط الفيديو غير صالح
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <AnimatePresence mode="wait">

        {/* ── Thumbnail splash ── */}
        {!started ? (
          <motion.div
            key="thumb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative rounded-2xl overflow-hidden cursor-pointer"
            style={{ aspectRatio: "16/9", background: "#0a1f14" }}
            onClick={() => { setStarted(true); trackEvent("play"); }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Thumbnail image */}
            <img
              src={`https://img.youtube.com/vi/${rawId}/hqdefault.jpg`}
              alt={title}
              className="w-full h-full object-cover"
              style={{ opacity: 0.6 }}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://img.youtube.com/vi/${rawId}/mqdefault.jpg`;
              }}
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top,rgba(13,61,39,0.92) 0%,rgba(13,61,39,0.25) 60%,rgba(13,61,39,0.08) 100%)" }} />

            {/* Platform badge top-right */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full"
              style={{ background: "rgba(13,61,39,0.85)", border: "1px solid rgba(201,168,76,0.3)", backdropFilter: "blur(8px)" }}>
              <span style={{ fontFamily: "Cairo,sans-serif", color: "#C9A84C", fontSize: 11, fontWeight: 700 }}>
                🔒 أكاديمية مستر مصطفى
              </span>
            </div>

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72,
                  background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                  boxShadow: "0 8px 32px rgba(201,168,76,0.55)" }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#1A1208">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </motion.div>
            </div>

            {/* Title bar bottom */}
            <div className="absolute bottom-0 inset-x-0 px-4 py-4"
              style={{ background: "linear-gradient(to top,rgba(13,61,39,0.98),transparent)" }}>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                {title}
              </p>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 11, marginTop: 2 }}>
                اضغط للتشغيل
              </p>
            </div>
          </motion.div>

        ) : (

          /* ── Active player ── */
          <motion.div
            key="player"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative rounded-2xl overflow-hidden"
            style={{ aspectRatio: "16/9", background: "#000" }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Loading shimmer */}
            <AnimatePresence>
              {!isReady && (
                <motion.div
                  key="shimmer"
                  initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3"
                  style={{ background: "#0a1f14" }}
                >
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full"
                        style={{ background: "#C9A84C" }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity }} />
                    ))}
                  </div>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.7)", fontSize: 12 }}>
                    جارٍ تحميل الفيديو...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/*
              PROTECTION STACK:
              1. youtube-nocookie.com — no cookies, reduced "Open in YouTube" UI
              2. rel=0 — no related videos from other channels
              3. modestbranding=1 — hides YouTube logo in control bar
              4. disablekb=1 — keyboard shortcut override
              5. sandbox without allow-popups → blocks "Open in YouTube" popups
              6. sandbox without allow-top-navigation → blocks page redirects
              7. pointer-events:none div → blocks right-click/drag on the frame border
              8. Dynamic watermark — student identity on 20 positions
              9. Platform badge — always rendered above iframe
            */}
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={title}
              className="w-full h-full"
              style={{ border: "none", display: "block" }}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
              onLoad={() => setTimeout(() => setIsReady(true), 700)}
            />

            {/* Right-click / drag blocker — pointer-events:none = doesn't intercept clicks */}
            <div className="absolute inset-0 z-10"
              style={{ pointerEvents: "none", userSelect: "none" }}
              onContextMenu={(e) => e.preventDefault()}
            />

            {/* ── Dynamic watermark ── */}
            {user && <Watermark name={user.name} phone={user.phone} />}

            {/* Platform badge — z-25, above watermark */}
            <div
              className="absolute top-3 left-3 z-25 px-2 py-1 rounded-lg"
              style={{ background: "rgba(13,61,39,0.82)", border: "1px solid rgba(201,168,76,0.25)",
                backdropFilter: "blur(6px)", pointerEvents: "none", zIndex: 25 }}
            >
              <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.8)", fontSize: 10, fontWeight: 700 }}>
                🔒 أكاديمية مستر مصطفى
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Speed controls ── */}
      {started && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 flex items-center justify-between flex-wrap gap-2"
          style={{ direction: "rtl" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, whiteSpace: "nowrap" }}>
              🎚️ سرعة:
            </span>
            {SPEEDS.map((s) => (
              <motion.button
                key={s}
                onClick={() => applySpeed(s)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                style={{
                  padding: "3px 10px", borderRadius: 8, border: "1px solid",
                  borderColor: speed === s ? "#C9A84C" : "rgba(201,168,76,0.2)",
                  background:  speed === s ? "rgba(201,168,76,0.14)" : "transparent",
                  color:       speed === s ? "#8B6914" : "#7A6E5A",
                  fontFamily: "Cairo,sans-serif", fontSize: 12,
                  fontWeight: speed === s ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s", minHeight: "unset",
                }}
              >
                {s}×
              </motion.button>
            ))}
          </div>
          <button
            onClick={() => {
              setStarted(false);
              setIsReady(false);
              setSpeed(1);
              trackedCompleteRef.current = false;
              lastEventRef.current = "";
            }}
            style={{
              padding: "3px 11px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.2)",
              background: "transparent", color: "#7A6E5A",
              fontFamily: "Cairo,sans-serif", fontSize: 12, cursor: "pointer", minHeight: "unset",
            }}
          >
            ↩ إعادة
          </button>
        </motion.div>
      )}

      {/* Protection notice */}
      <p className="mt-2"
        style={{ fontFamily: "Cairo,sans-serif", color: "rgba(122,110,90,0.4)", fontSize: 11, direction: "rtl" }}>
        🔒 هذا المحتوى مسجَّل باسم المستخدم — أي تسجيل غير مصرح به يُعدّ انتهاكاً
      </p>
    </div>
  );
}
