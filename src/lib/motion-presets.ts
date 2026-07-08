// src/lib/motion-presets.ts
// Shared, bold/lively motion presets — used across the platform for a
// consistent, energetic feel. "Bold" here means: bigger travel distances,
// visible spring overshoot (things settle with a little bounce instead of
// just easing to a stop), and hover/tap feedback that's felt, not just seen.

// Springy, slightly bouncy entrance — the default for cards/panels appearing.
export const springBouncy = { type: "spring", stiffness: 260, damping: 18 } as const;

// Snappier spring for small UI feedback (buttons, toggles, badges).
export const springSnappy = { type: "spring", stiffness: 400, damping: 22 } as const;

// Bold fade-up entrance: bigger offset than a "safe" default, spring-settled.
export const fadeUpBold = {
  hidden: { opacity: 0, y: 40 },
  show: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { ...springBouncy, delay },
  }),
};

// Bold pop-in: starts noticeably smaller, overshoots slightly past 1, settles.
export const popInBold = {
  hidden: { opacity: 0, scale: 0.75 },
  show: (delay = 0) => ({
    opacity: 1, scale: 1,
    transition: { ...springBouncy, delay },
  }),
};

// Stagger container with a longer per-child delay — makes the sequence of
// items appearing actually readable as a sequence, not a near-simultaneous blur.
export const staggerBold = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export const staggerItemBold = {
  hidden: { opacity: 0, y: 32, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springBouncy },
};

// Card hover: bigger lift + slight scale + tap feedback. Spread this onto
// any motion.div wrapping a clickable/hoverable card.
export const cardHoverBold = {
  whileHover: { y: -10, scale: 1.02, transition: { duration: 0.22, ease: "easeOut" } },
  whileTap:   { scale: 0.97 },
};

// Icon "wiggle" on hover — small bounce/rotate, good for icon bubbles and nav icons.
export const iconWiggle = {
  whileHover: { scale: 1.15, rotate: [0, -8, 8, -4, 0], transition: { duration: 0.45 } },
};

// Button press feedback — pair with whileHover scale on the button itself.
export const buttonPress = { whileTap: { scale: 0.94 } };
