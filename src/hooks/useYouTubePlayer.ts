"use client";
// src/hooks/useYouTubePlayer.ts
//
// Loads the YouTube IFrame Player API exactly once per page (even if several
// players mount at the same time), then wraps one YT.Player instance with a
// small, typed React state + controls surface so the UI layer never has to
// touch `window.YT` directly.
//
// NOTE ON SCOPE / HONESTY:
// This hook (and the rest of this player) hides the native YouTube chrome,
// blocks the obvious escape hatches (context menu, "watch on YouTube",
// keyboard shortcuts, drag/select), and never renders the raw watch URL as
// visible text. That deters casual copying and keeps the UI fully custom.
// It is NOT real DRM: the videoId is still present in this component's
// props/DOM and in the iframe's network requests, so a technical user
// inspecting devtools/network traffic can still find it. If you need to
// stop that too, the fix has to happen server-side (signed/rotating tokens,
// a proxy, or a DRM-backed provider) — no client-side trick closes that gap
// completely, so it's honest not to claim it here.
import { useCallback, useEffect, useRef, useState } from "react";

let apiPromise: Promise<void> | null = null;

/** Loads https://www.youtube.com/iframe_api once, shared across all players on the page. */
function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
}

export type PlayerStatus =
  | "idle"
  | "loading"
  | "cued"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface YouTubePlayerState {
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  bufferedFraction: number; // 0..1
  volume: number; // 0..100
  muted: boolean;
  playbackRate: number;
  availableQualities: string[];
  quality: string;
}

export interface UseYouTubePlayerOptions {
  videoId: string;
  origin: string;
  onProgressTick?: (currentTime: number, duration: number) => void;
  onStateChange?: (status: PlayerStatus) => void;
  /** Call playVideo() as soon as the player is ready — used when the player
   *  is only mounted in response to a real click (our thumbnail), so this
   *  still runs close enough to the user gesture for autoplay to be allowed. */
  autoPlayOnReady?: boolean;
}

const DEFAULT_STATE: YouTubePlayerState = {
  status: "idle",
  currentTime: 0,
  duration: 0,
  bufferedFraction: 0,
  volume: 100,
  muted: false,
  playbackRate: 1,
  availableQualities: [],
  quality: "auto",
};

export function useYouTubePlayer({ videoId, origin, onProgressTick, onStateChange, autoPlayOnReady }: UseYouTubePlayerOptions) {
  // BUGFIX: this used to be a plain `useRef<HTMLDivElement>(null)`. The
  // problem: the mount <div> only enters the DOM after the user clicks the
  // thumbnail (VideoPlayer only renders it once `started` is true). A plain
  // ref's `.current` changing does NOT re-run effects — React only reacts to
  // state/prop changes. So the "create the player" effect below would fire
  // once (when the YT API script finished loading), see `mountRef.current
  // === null` because the div didn't exist yet, bail out, and then never
  // fire again even after the div mounted — permanent loading spinner, no
  // player ever created. A callback ref backed by state fixes this: mounting
  // the div now updates state, which is a valid effect dependency.
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);
  const mountRef = useCallback((node: HTMLDivElement | null) => {
    setMountNode(node);
  }, []);
  const playerRef = useRef<YT.Player | null>(null);
  const pollRef = useRef<number | null>(null);
  const [state, setState] = useState<YouTubePlayerState>(DEFAULT_STATE);
  const [isApiReady, setIsApiReady] = useState(false);

  const patch = useCallback((partial: Partial<YouTubePlayerState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Boot the API + create the player ──────────────────────
  useEffect(() => {
    let cancelled = false;
    loadYouTubeIframeApi().then(() => {
      if (cancelled) return;
      setIsApiReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Watchdog: if the API script never loads (blocked by an ad-blocker,
  // corporate network, or a CSP that's stricter than expected), don't sit on
  // an infinite spinner — surface it as an actual error state after 10s so
  // it's visibly distinguishable from "still buffering" during testing.
  useEffect(() => {
    if (isApiReady || !videoId) return;
    const timer = window.setTimeout(() => {
      if (!isApiReady) patch({ status: "error" });
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [isApiReady, videoId, patch]);

  useEffect(() => {
    if (!isApiReady || !mountNode || !videoId) return;

    patch({ status: "loading" });

    const player = new window.YT.Player(mountNode, {
      videoId,
      host: "https://www.youtube-nocookie.com",
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 0,
        controls: 0, // fully custom UI — no native YouTube control bar at all
        disablekb: 1, // native keyboard shortcuts off; we implement our own
        enablejsapi: 1,
        fs: 0, // native fullscreen button off; we implement our own
        iv_load_policy: 3, // no annotations
        modestbranding: 1, // reduces (cannot fully remove) YouTube logo
        playsinline: 1,
        rel: 0, // no related videos from other channels at the end
        cc_load_policy: 0,
        origin,
        widget_referrer: origin,
      },
      events: {
        onReady: (e) => {
          playerRef.current = e.target;
          patch({
            status: "cued",
            duration: e.target.getDuration(),
            volume: e.target.getVolume(),
            muted: e.target.isMuted(),
            availableQualities: e.target.getAvailableQualityLevels(),
          });
          if (autoPlayOnReady) e.target.playVideo();
        },
        onStateChange: (e) => {
          const map: Partial<Record<YT.PlayerState, PlayerStatus>> = {
            [window.YT.PlayerState.PLAYING]: "playing",
            [window.YT.PlayerState.PAUSED]: "paused",
            [window.YT.PlayerState.BUFFERING]: "buffering",
            [window.YT.PlayerState.ENDED]: "ended",
            [window.YT.PlayerState.CUED]: "cued",
          };
          const next = map[e.data];
          if (next) {
            patch({ status: next });
            onStateChange?.(next);
          }
        },
        onPlaybackRateChange: (e) => patch({ playbackRate: e.data }),
        onError: () => patch({ status: "error" }),
      },
    });

    return () => {
      player.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiReady, mountNode, videoId, origin]);

  // ── Poll time/buffer while mounted (YT API has no timeupdate event) ──
  useEffect(() => {
    pollRef.current = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const currentTime = p.getCurrentTime() || 0;
      const duration = p.getDuration() || 0;
      const bufferedFraction = p.getVideoLoadedFraction?.() ?? 0;
      patch({ currentTime, duration, bufferedFraction });
      if (duration > 0) onProgressTick?.(currentTime, duration);
    }, 400);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Controls ───────────────────────────────────────────────
  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const playing = p.getPlayerState() === window.YT.PlayerState.PLAYING;
    playing ? p.pauseVideo() : p.playVideo();
  }, []);
  const seekTo = useCallback((seconds: number) => {
    const p = playerRef.current;
    if (!p) return;
    const clamped = Math.max(0, Math.min(seconds, p.getDuration() || seconds));
    p.seekTo(clamped, true);
    patch({ currentTime: clamped });
  }, [patch]);
  const seekBy = useCallback((delta: number) => {
    const p = playerRef.current;
    if (!p) return;
    seekTo((p.getCurrentTime() || 0) + delta);
  }, [seekTo]);
  const setVolume = useCallback((volume: number) => {
    const p = playerRef.current;
    if (!p) return;
    const clamped = Math.max(0, Math.min(100, volume));
    p.setVolume(clamped);
    if (clamped === 0) p.mute();
    else if (p.isMuted()) p.unMute();
    patch({ volume: clamped, muted: clamped === 0 });
  }, [patch]);
  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      patch({ muted: false });
    } else {
      p.mute();
      patch({ muted: true });
    }
  }, [patch]);
  const setPlaybackRate = useCallback((rate: number) => {
    playerRef.current?.setPlaybackRate(rate);
    patch({ playbackRate: rate });
  }, [patch]);
  const setQuality = useCallback((quality: string) => {
    playerRef.current?.setPlaybackQuality(quality);
    patch({ quality });
  }, [patch]);

  return {
    mountRef,
    state,
    controls: { play, pause, togglePlay, seekTo, seekBy, setVolume, toggleMute, setPlaybackRate, setQuality },
  };
}
