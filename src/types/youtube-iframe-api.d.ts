// src/types/youtube-iframe-api.d.ts
// Minimal typings for the YouTube IFrame Player API.
// The real script is loaded at runtime from https://www.youtube.com/iframe_api
// — this file only exists so TypeScript understands `window.YT`.

export {};

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }

    interface PlayerVars {
      autoplay?: 0 | 1;
      controls?: 0 | 1;
      disablekb?: 0 | 1;
      enablejsapi?: 0 | 1;
      fs?: 0 | 1;
      iv_load_policy?: 1 | 3;
      modestbranding?: 0 | 1;
      playsinline?: 0 | 1;
      rel?: 0 | 1;
      cc_load_policy?: 0 | 1;
      origin?: string;
      widget_referrer?: string;
      start?: number;
    }

    interface OnStateChangeEvent {
      data: PlayerState;
      target: Player;
    }

    interface OnErrorEvent {
      data: number;
      target: Player;
    }

    interface PlayerEvents {
      onReady?: (event: { target: Player }) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
      onPlaybackQualityChange?: (event: { data: string; target: Player }) => void;
      onPlaybackRateChange?: (event: { data: number; target: Player }) => void;
    }

    interface PlayerOptions {
      videoId?: string;
      host?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: PlayerVars;
      events?: PlayerEvents;
    }

    class Player {
      constructor(elementId: string | HTMLElement, options: PlayerOptions);
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      setVolume(volume: number): void;
      getVolume(): number;
      getPlayerState(): PlayerState;
      getCurrentTime(): number;
      getDuration(): number;
      getVideoLoadedFraction(): number;
      setPlaybackRate(rate: number): void;
      getPlaybackRate(): number;
      getAvailablePlaybackRates(): number[];
      setPlaybackQuality(quality: string): void;
      getPlaybackQuality(): string;
      getAvailableQualityLevels(): string[];
      destroy(): void;
      getIframe(): HTMLIFrameElement;
    }
  }
}
