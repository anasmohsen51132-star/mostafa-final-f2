"use client";
// src/components/video/VideoControls.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { YouTubePlayerState } from "@/hooks/useYouTubePlayer";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface Props {
  visible: boolean;
  state: YouTubePlayerState;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onSetRate: (rate: number) => void;
  onSetQuality: (quality: string) => void;
  onToggleFullscreen: () => void;
  onInteract: () => void; // called on any control interaction, resets auto-hide timer
}

export function VideoControls({
  visible,
  state,
  isFullscreen,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSetRate,
  onSetQuality,
  onToggleFullscreen,
  onInteract,
}: Props) {
  const [menu, setMenu] = useState<"speed" | "quality" | null>(null);
  const isPlaying = state.status === "playing";
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-x-0 bottom-0 z-30 px-3 pb-2 pt-8"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
            pointerEvents: "auto",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Seek bar */}
          <div
            className="group relative mb-2 h-3 w-full cursor-pointer"
            onClick={(e) => {
              onInteract();
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
              onSeek(ratio * state.duration);
            }}
          >
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/25" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/40"
              style={{ width: `${state.bufferedFraction * 100}%` }}
            />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
              style={{ width: `${progress}%`, background: "#C9A84C" }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: `${progress}%`, background: "#C9A84C" }}
            />
          </div>

          <div className="flex items-center justify-between gap-2" style={{ direction: "ltr" }}>
            <div className="flex items-center gap-3">
              {/* Play / pause */}
              <button
                type="button"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={() => {
                  onInteract();
                  onTogglePlay();
                }}
                className="flex h-8 w-8 items-center justify-center text-white"
              >
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={state.muted ? "Unmute" : "Mute"}
                  onClick={() => {
                    onInteract();
                    onToggleMute();
                  }}
                  className="text-white"
                >
                  {state.muted || state.volume === 0 ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12A4.5 4.5 0 0014 8v2a2.5 2.5 0 010 4v2zM3 9v6h4l5 5V4L7 9H3z" />
                      <line x1="19" y1="8" x2="23" y2="16" stroke="currentColor" strokeWidth="1.6" />
                      <line x1="23" y1="8" x2="19" y2="16" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zM16.5 12A4.5 4.5 0 0014 8v8a4.5 4.5 0 002.5-4z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={state.muted ? 0 : state.volume}
                  onChange={(e) => {
                    onInteract();
                    onVolumeChange(Number(e.target.value));
                  }}
                  className="hidden w-16 accent-[#C9A84C] sm:block"
                  aria-label="Volume"
                />
              </div>

              <span style={{ fontFamily: "Cairo, sans-serif", color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Speed */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    onInteract();
                    setMenu(menu === "speed" ? null : "speed");
                  }}
                  className="rounded px-2 py-1 text-white"
                  style={{ fontFamily: "Cairo, sans-serif", fontSize: 12, background: "rgba(255,255,255,0.1)" }}
                >
                  {state.playbackRate}×
                </button>
                {menu === "speed" && (
                  <div className="absolute bottom-9 right-0 rounded-lg p-1" style={{ background: "rgba(20,20,20,0.95)" }}>
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onSetRate(s);
                          setMenu(null);
                        }}
                        className="block w-full whitespace-nowrap rounded px-3 py-1 text-left text-white hover:bg-white/10"
                        style={{ fontFamily: "Cairo, sans-serif", fontSize: 12 }}
                      >
                        {s}× {s === state.playbackRate ? "✓" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality */}
              {state.availableQualities.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      onInteract();
                      setMenu(menu === "quality" ? null : "quality");
                    }}
                    className="rounded px-2 py-1 text-white"
                    style={{ fontFamily: "Cairo, sans-serif", fontSize: 12, background: "rgba(255,255,255,0.1)" }}
                  >
                    {state.quality === "auto" ? "Auto" : state.quality}
                  </button>
                  {menu === "quality" && (
                    <div className="absolute bottom-9 right-0 rounded-lg p-1" style={{ background: "rgba(20,20,20,0.95)" }}>
                      {["auto", ...state.availableQualities].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            onSetQuality(q);
                            setMenu(null);
                          }}
                          className="block w-full whitespace-nowrap rounded px-3 py-1 text-left text-white hover:bg-white/10"
                          style={{ fontFamily: "Cairo, sans-serif", fontSize: 12 }}
                        >
                          {q === "auto" ? "Auto" : q} {q === state.quality ? "✓" : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen */}
              <button
                type="button"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                onClick={() => {
                  onInteract();
                  onToggleFullscreen();
                }}
                className="flex h-8 w-8 items-center justify-center text-white"
              >
                <span style={{ fontSize: 15 }}>{isFullscreen ? "⤦" : "⛶"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
