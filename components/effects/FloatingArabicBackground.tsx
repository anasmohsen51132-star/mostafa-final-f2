"use client";
// src/components/effects/FloatingArabicBackground.tsx
//
// This replicates the "arabic-floaters" layer from the original prototype
// build exactly: the same 12 letters, the same top/left/right positions,
// the same per-letter font sizes, the same simple float animation (a gentle
// bob up with a slight rotate wobble, not the more elaborate multi-keyframe
// drift used in earlier iterations of this component), and the same fixed
// (non-pulsing) opacity. Ported from plain CSS keyframes to Framer Motion
// so it works the same way across the platform's pages.
//
// Original CSS this mirrors:
//   @keyframes float {
//     0%,100% { transform: translateY(0px) rotate(0deg); }
//     33%  { transform: translateY(-12px) rotate(3deg); }
//     66%  { transform: translateY(-6px) rotate(-2deg); }
//   }
//   .arabic-letter { color: rgba(201,168,76,0.12); animation: float 6s ease-in-out infinite; }
import { m as motion } from "framer-motion";

interface FloatingLetter {
  char: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
}

// Exact letters, positions, and sizes from the original layer.
const DEFAULT_LETTERS: FloatingLetter[] = [
  { char: "ا", top: "10%", right: "5%",  size: 60 },
  { char: "ب", top: "20%", left: "8%",   size: 48 },
  { char: "ت", top: "50%", right: "3%",  size: 72 },
  { char: "ث", top: "70%", left: "5%",   size: 52 },
  { char: "ج", top: "85%", right: "10%", size: 64 },
  { char: "ح", top: "35%", left: "2%",   size: 44 },
  { char: "خ", top: "60%", right: "15%", size: 56 },
  { char: "د", top: "15%", left: "20%",  size: 68 },
  { char: "ذ", top: "75%", right: "25%", size: 50 },
  { char: "ر", top: "40%", right: "30%", size: 58 },
  { char: "ز", top: "90%", left: "15%",  size: 46 },
  { char: "س", top: "25%", right: "40%", size: 62 },
];

interface Props {
  /** Override the default letter set/positions entirely. */
  letters?: FloatingLetter[];
  /** Use only the first N letters of the default set — handy for smaller surfaces. */
  density?: number;
  /** Color for the letters (rgba/hex). Defaults to the original's brand gold at 0.12 opacity. */
  color?: string;
}

export function FloatingArabicBackground({
  letters,
  density,
  color = "rgba(201,168,76,0.12)",
}: Props) {
  const set = letters ?? (density ? DEFAULT_LETTERS.slice(0, density) : DEFAULT_LETTERS);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {set.map((l, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{
            top: l.top,
            left: l.left,
            right: l.right,
            fontFamily: "Amiri,serif",
            fontSize: l.size,
            color,
            lineHeight: 1,
            willChange: "transform",
          }}
          animate={{
            y: [0, -12, -6, 0],
            rotate: [0, 3, -2, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        >
          {l.char}
        </motion.span>
      ))}
    </div>
  );
}
