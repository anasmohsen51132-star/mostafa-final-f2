"use client";
// src/components/video/VideoPlayer.tsx
//
// Production custom YouTube player built on the IFrame Player API.
//
// What this actually achieves vs. what it can't (read before shipping):
//  ✅ No native YouTube control bar, logo interaction, "Watch on YouTube",
//     related videos, annotations, or captions menu — controls=0 + our own
//     UI on top means the learner never touches YouTube's chrome.
//  ✅ Right-click, drag, text-select, and native keyboard shortcuts are
//     blocked at the container level; our own keyboard shortcuts run instead.
//  ✅ iframe sandbox has no allow-popups / allow-top-navigation, so nothing
//     inside the embed can open a new tab or navigate the page away.
//  ✅ The watch URL is never rendered as visible/selectable text anywhere
//     in the DOM.
//  ⚠️ "Prevent copying the video URL" / "don't expose the YouTube link
//     anywhere" — this is only true for the *rendered page*. The videoId
//     still has to reach the browser as a prop and the iframe still makes
//     a real network request to youtube-nocookie.com, both visible in
//     devtools to anyone who looks. That's a hard limitation of playing
//     YouTube content in a browser at all, not a bug in this component —
//     true concealment needs a server-side signed proxy or a real DRM
//     provider (e.g. Mux, Bunny Stream, Vimeo Pro with domain locking).
//  ⚠️ Quality selection: YouTube deprecated manual quality forcing for most
//     videos (it silently reverts to auto). The UI below is wired to the
//     real API and works for accounts/videos where it's still honored.
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { VideoControls } from "./VideoControls";
import { VideoWatermark } from "./VideoWatermark";
import { fetchWithAuth, useAuth } from "@/hooks/useAuth";

interface Props {
  youtubeId: string; // server already resolves this to the real YouTube ID
  title: string;
  lectureId?: string;
  videoId?: string; // DB video record id, used for progress + resume
}

const AUTO_HIDE_MS = 2000;
const SEEK_STEP = 10;
const VIDEO_ASPECT = 16 / 9;

export function VideoPlayer({ youtubeId, title, lectureId, videoId }: Props) {
  const { user } = useAuth();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const containerRef = useRef<HTMLDivElement>(null);
  const playerBoxRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const tapRef = useRef<{ time: number; x: number } | null>(null);
  const resumeAppliedRef = useRef(false);
  const trackedCompleteRef = useRef(false);
  const lastEventRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  const [started, setStarted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ripple, setRipple] = useState<{ side: "left" | "right"; key: number } | null>(null);

  // ── Progress tracking (server) ────────────────────────────
  const trackEvent = useCallback(
    async (event: string) => {
      if (!lectureId || !videoId) return;
      if (lastEventRef.current === event) return;
      lastEventRef.current = event;
      try {
        await fetchWithAuth("/api/progress", {
          method: "POST",
          body: JSON.stringify({ lectureId, videoId, event, completed: event === "ended" || event === "completed" }),
        });
      } catch {
        /* non-critical */
      }
    },
    [lectureId, videoId]
  );

  const onProgressTick = useCallback(
    (currentTime: number, duration: number) => {
      if (!videoId) return;
      // Save resume position locally immediately (cheap)...
      try {
        localStorage.setItem(`resume:${videoId}`, String(Math.floor(currentTime)));
      } catch {
        /* storage unavailable (private mode, etc.) — non-critical */
      }
      // ...and to the server at most once every 5s.
      if (saveTimerRef.current == null) {
        saveTimerRef.current = window.setTimeout(() => {
          saveTimerRef.current = null;
        }, 5000);
        fetchWithAuth("/api/progress", {
          method: "POST",
          body: JSON.stringify({ lectureId, videoId, event: "heartbeat" }),
        }).catch(() => {});
      }
      if (duration > 0 && duration - currentTime < 0.75 && !trackedCompleteRef.current) {
        trackedCompleteRef.current = true;
        trackEvent("completed");
      }
    },
    [videoId, lectureId, trackEvent]
  );

  const onStateChange = useCallback(
    (status: string) => {
      if (status === "playing") trackEvent("play");
      if (status === "paused") trackEvent("pause");
    },
    [trackEvent]
  );

  const { mountRef, state, controls } = useYouTubePlayer({
    videoId: youtubeId,
    origin,
    onProgressTick,
    onStateChange,
    autoPlayOnReady: started,
  });

  // ── Resume watching: seek once, right after the player is cued ──
  useEffect(() => {
    if (!videoId || resumeAppliedRef.current) return;
    if (state.status !== "cued" && state.status !== "paused") return;
    if (state.duration <= 0) return;
    resumeAppliedRef.current = true;
    try {
      const saved = Number(localStorage.getItem(`resume:${videoId}`));
      if (saved > 5 && saved < state.duration - 15) {
        controls.seekTo(saved);
      }
    } catch {
      /* ignore */
    }
  }, [state.status, state.duration, videoId, controls]);

  // ── Block right-click / drag / select at the container level ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("contextmenu", block);
    el.addEventListener("dragstart", block);
    el.addEventListener("selectstart", block);
    return () => {
      el.removeEventListener("contextmenu", block);
      el.removeEventListener("dragstart", block);
      el.removeEventListener("selectstart", block);
    };
  }, []);

  // ── Auto-hide controls after 2s of inactivity while playing ──
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (state.status === "playing") setShowControls(false);
    }, AUTO_HIDE_MS);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "playing") {
      setShowControls(true);
      return;
    }
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // ── Fullscreen + orientation lock + black-bar cropping ──────
  useEffect(() => {
    const handleChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      setIsFullscreen(fsEl === playerBoxRef.current);
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  // BUGFIX: this used to measure window.innerWidth/innerHeight in JS and
  // compute a pixel width/height to "cover" the screen. The problem: right
  // after entering fullscreen (especially combined with the orientation
  // lock), the browser hasn't finished resizing the viewport yet when this
  // ran, so it read stale (pre-fullscreen) dimensions — the video ended up
  // too small, leaving a big black area around it.
  // Fix: a pure-CSS "cover" trick. Setting both a width/height pair AND a
  // min-width/min-height pair (in the opposite unit) makes the browser pick
  // whichever pair produces the LARGER box — that's exactly cover behaviour,
  // and it's recalculated by the browser itself on every resize/rotation,
  // so there's no JS measurement to go stale. No state, no listeners needed.
  //
  // REMAINING BARS: this math is exact *if the source video is really
  // 16:9*. It sizes our <iframe> box to fully cover the screen, but YouTube
  // still letterboxes/pillarboxes *inside* that box to match the video's
  // own native resolution — and lecture recordings (whiteboard apps, screen
  // captures) are very often NOT exactly 16:9 (e.g. 4:3, 16:10, or an odd
  // capture resolution). The IFrame API has no way to ask YouTube for the
  // real source aspect ratio, so we can't compute an exact crop. The
  // practical fix is to deliberately oversize the cover box by a safety
  // margin (COVER_OVERSCAN) so YouTube's internal letterbox bars get pushed
  // outside the visible viewport and cropped away instead of showing —
  // trading a bit of extra edge-cropping for guaranteed no black bars.
  const COVER_OVERSCAN = 1.28; // ~28% extra zoom; raise this if bars still show on very off-ratio videos
  const coverStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: `${100 * COVER_OVERSCAN}vw`,
    height: `${(100 / VIDEO_ASPECT) * COVER_OVERSCAN}vw`, // 100vw * 9/16, scaled up
    minWidth: `${100 * VIDEO_ASPECT * COVER_OVERSCAN}dvh`, // 100dvh * 16/9, scaled up
    minHeight: `${100 * COVER_OVERSCAN}dvh`,
    transform: "translate(-50%, -50%)",
  };

  const toggleFullscreen = useCallback(async () => {
    const el = playerBoxRef.current;
    if (!el) return;
    const fsEl =
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;

    if (fsEl) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else (document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
      try {
        (screen.orientation as unknown as { unlock?: () => void })?.unlock?.();
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else (el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();

      // Only meaningful on phone/tablet-portrait; desktop doesn't need it.
      // Not supported on iOS Safari — that's fine, iOS handles rotation via
      // its own native fullscreen video UI regardless.
      const orientation = screen.orientation as unknown as { lock?: (o: string) => Promise<void> };
      if (window.innerWidth < 900 && orientation?.lock) {
        orientation.lock("landscape").catch(() => {
          /* rejected outside a user gesture, or unsupported — safe to ignore */
        });
      }
    } catch {
      /* fullscreen denied by the browser — inline player keeps working */
    }
  }, []);

  // ── Keyboard shortcuts (desktop) — active while the player is hovered/focused ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !started) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          controls.togglePlay();
          resetHideTimer();
          break;
        case "ArrowRight":
          e.preventDefault();
          controls.seekBy(5);
          resetHideTimer();
          break;
        case "ArrowLeft":
          e.preventDefault();
          controls.seekBy(-5);
          resetHideTimer();
          break;
        case "ArrowUp":
          e.preventDefault();
          controls.setVolume(Math.min(100, state.volume + 5));
          resetHideTimer();
          break;
        case "ArrowDown":
          e.preventDefault();
          controls.setVolume(Math.max(0, state.volume - 5));
          resetHideTimer();
          break;
        case "m":
          controls.toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        default:
          if (e.key >= "0" && e.key <= "9") {
            const pct = Number(e.key) / 10;
            controls.seekTo(state.duration * pct);
          }
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [started, controls, state.volume, state.duration, resetHideTimer, toggleFullscreen]);

  // ── Touch gestures: single tap = toggle controls, double tap L/R = seek ──
  const lastHandledRef = useRef(0);
  const handleTap = useCallback(
    (clientX: number) => {
      const el = playerBoxRef.current;
      if (!el) return;
      const now = Date.now();

      // Extra defense on top of using a single onPointerUp handler: ignore
      // anything that looks like the same physical tap firing twice
      // (e.g. a stray duplicate event on some browser/device combos).
      // Legitimate double-taps are always well above this gap.
      if (now - lastHandledRef.current < 80) return;
      lastHandledRef.current = now;

      const rect = el.getBoundingClientRect();
      const isLeftHalf = clientX - rect.left < rect.width / 2;

      if (tapRef.current && now - tapRef.current.time < 300) {
        // Double tap
        const delta = isLeftHalf ? -SEEK_STEP : SEEK_STEP;
        controls.seekBy(delta);
        setRipple({ side: isLeftHalf ? "left" : "right", key: now });
        tapRef.current = null;
        resetHideTimer();
      } else {
        tapRef.current = { time: now, x: clientX };
        window.setTimeout(() => {
          // If no second tap arrived, treat as a single tap → toggle controls
          if (tapRef.current?.time === now) {
            setShowControls((v) => !v);
            resetHideTimer();
            tapRef.current = null;
          }
        }, 300);
      }
    },
    [controls, resetHideTimer]
  );

  if (!youtubeId) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#DC2626", fontSize: 14 }}>⚠️ رابط الفيديو غير صالح</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} tabIndex={0} style={{ userSelect: "none", WebkitUserSelect: "none", outline: "none" }}>
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div
            key="thumb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative cursor-pointer overflow-hidden rounded-2xl"
            style={{ aspectRatio: "16/9", background: "#0a1f14" }}
            onClick={() => setStarted(true)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt={title}
              className="h-full w-full object-cover"
              style={{ opacity: 0.6 }}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top,rgba(13,61,39,0.92) 0%,rgba(13,61,39,0.25) 60%,rgba(13,61,39,0.08) 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, background: "linear-gradient(135deg,#C9A84C,#8B6914)", boxShadow: "0 8px 32px rgba(201,168,76,0.55)" }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="#1A1208">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </motion.div>
            </div>
            <div
              className="absolute inset-x-0 bottom-0 px-4 py-4"
              style={{ background: "linear-gradient(to top,rgba(13,61,39,0.98),transparent)" }}
            >
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontSize: 14, fontWeight: 600 }}>{title}</p>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 11, marginTop: 2 }}>
                اضغط للتشغيل
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            ref={playerBoxRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={isFullscreen ? "relative overflow-hidden" : "relative overflow-hidden rounded-2xl"}
            style={isFullscreen ? { width: "100vw", height: "100dvh", background: "#000" } : { aspectRatio: "16/9", background: "#000" }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseMove={resetHideTimer}
          >
            {/* Loading spinner */}
            <AnimatePresence>
              {(state.status === "idle" || state.status === "loading") && (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3"
                  style={{ background: "#0a1f14" }}
                >
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full"
                        style={{ background: "#C9A84C" }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.7)", fontSize: 12 }}>جارٍ تحميل الفيديو...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error state — watchdog fired, or YT reported a playback error */}
            {state.status === "error" && (
              <div
                className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 px-4 text-center"
                style={{ background: "#0a1f14" }}
              >
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#E8967A", fontSize: 13, fontWeight: 600 }}>
                  ⚠️ تعذّر تحميل الفيديو
                </p>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 11 }}>
                  تأكد من اتصال الإنترنت، أو أن أي أداة حجب إعلانات لا تمنع youtube.com
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStarted(false);
                    resumeAppliedRef.current = false;
                    window.setTimeout(() => setStarted(true), 50);
                  }}
                  className="mt-2 rounded-lg px-3 py-1.5"
                  style={{ fontFamily: "Cairo,sans-serif", fontSize: 12, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* The actual YT iframe is created inside this mount div by the IFrame API */}
            <div
              ref={mountRef}
              className="absolute"
              style={isFullscreen ? coverStyle : { inset: 0, width: "100%", height: "100%" }}
            />

            {/* Gesture / interaction capture layer — sits ABOVE the iframe so
                the native embed never receives clicks, drags, or right-clicks
                directly; every interaction is routed through our own state.
                BUGFIX: this used to have BOTH onClick and onTouchEnd. On a
                touch device, a single tap fires touchend AND a synthetic
                compatibility click a moment later — both landed inside the
                300ms double-tap window, so handleTap() ran twice per real
                tap and every single tap was misread as a double-tap (10s
                seek). Pointer Events fire exactly once per interaction
                across mouse/touch/pen, so a single handler here is correct. */}
            <div
              className="absolute inset-0 z-10"
              style={{ touchAction: "manipulation" }}
              onContextMenu={(e) => e.preventDefault()}
              onPointerUp={(e) => {
                e.preventDefault();
                handleTap(e.clientX);
              }}
            />

            {/* Double-tap seek ripple feedback */}
            <AnimatePresence>
              {ripple && (
                <motion.div
                  key={ripple.key}
                  initial={{ opacity: 0.9, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 1.4 }}
                  transition={{ duration: 0.5 }}
                  onAnimationComplete={() => setRipple(null)}
                  className="pointer-events-none absolute top-1/2 z-20 flex -translate-y-1/2 items-center justify-center rounded-full"
                  style={{
                    [ripple.side]: "8%",
                    width: 84,
                    height: 84,
                    background: "rgba(255,255,255,0.15)",
                  }}
                >
                  <span style={{ color: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 13 }}>
                    {ripple.side === "left" ? `⏪ ${SEEK_STEP}` : `${SEEK_STEP} ⏩`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {user && <VideoWatermark name={user.name} phone={user.phone} />}

            <div
              className="absolute left-3 top-3 z-25 rounded-lg px-2 py-1"
              style={{ background: "rgba(13,61,39,0.82)", border: "1px solid rgba(201,168,76,0.25)", pointerEvents: "none" }}
            >
              <span style={{ fontFamily: "Cairo,sans-serif", color: "rgba(201,168,76,0.8)", fontSize: 10, fontWeight: 700 }}>
                🔒 أكاديمية مستر مصطفى
              </span>
            </div>

            <VideoControls
              visible={showControls}
              state={state}
              isFullscreen={isFullscreen}
              onTogglePlay={controls.togglePlay}
              onSeek={controls.seekTo}
              onVolumeChange={controls.setVolume}
              onToggleMute={controls.toggleMute}
              onSetRate={controls.setPlaybackRate}
              onSetQuality={controls.setQuality}
              onToggleFullscreen={toggleFullscreen}
              onInteract={resetHideTimer}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-2" style={{ fontFamily: "Cairo,sans-serif", color: "rgba(122,110,90,0.4)", fontSize: 11, direction: "rtl" }}>
        🔒 هذا المحتوى مسجَّل باسم المستخدم — أي تسجيل غير مصرح به يُعدّ انتهاكاً
      </p>
    </div>
  );
}
