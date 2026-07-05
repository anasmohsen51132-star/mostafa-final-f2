"use client";
// src/components/effects/FloatingArabicBackground.tsx
//
// Floating Arabic letters drifting slowly in the background — the same
// decorative technique originally built into HeroSection, pulled out here
// so it can be reused on any dark-background surface (auth pages, CTA
// panels, dashboard splash screens, etc.) instead of being copy-pasted.
import { m as motion } from "framer-motion";

interface FloatingLetter {
  char: string;
  x: string;   // left position, e.g. "8%"
  y: string;   // top position, e.g. "18%"
  size: number;
  duration: number;
  delay: number;
  rotate: number;
}

// A generous default set spread across the canvas — good for a full-height
// hero/page background. Pass a shorter `letters` array (or use `density`)
// for smaller surfaces like a card or a narrower panel.
const DEFAULT_LETTERS: FloatingLetter[] = [
  { char: "ع", x: "8%",  y: "18%", size: 120, duration: 14, delay: 0,   rotate: -15 },
  { char: "ر", x: "82%", y: "12%", size: 90,  duration: 18, delay: 1.5, rotate: 12  },
  { char: "ب", x: "72%", y: "62%", size: 140, duration: 12, delay: 0.8, rotate: -8  },
  { char: "ي", x: "5%",  y: "65%", size: 100, duration: 16, delay: 2.2, rotate: 20  },
  { char: "ة", x: "88%", y: "40%", size: 80,  duration: 20, delay: 0.4, rotate: -20 },
  { char: "م", x: "15%", y: "80%", size: 110, duration: 15, delay: 1.8, rotate: 8   },
  { char: "ص", x: "50%", y: "8%",  size: 70,  duration: 22, delay: 3,   rotate: -5  },
  { char: "ا", x: "60%", y: "78%", size: 95,  duration: 17, delay: 1.1, rotate: 15  },
  { char: "ف", x: "35%", y: "88%", size: 65,  duration: 19, delay: 2.6, rotate: -12 },
  { char: "ن", x: "92%", y: "80%", size: 85,  duration: 13, delay: 0.6, rotate: 18  },
];

interface Props {
  /** Override the default letter set/positions entirely. */
  letters?: FloatingLetter[];
  /** Use only the first N letters of the default set — handy for smaller surfaces. */
  density?: number;
  /** Base color for the letters (rgba/hex). Defaults to the brand gold, very low opacity. */
  color?: string;
  /** Peak opacity reached mid-animation (the resting opacity is roughly half this). */
  maxOpacity?: number;
}

export function FloatingArabicBackground({
  letters,
  density,
  color = "201,168,76", // brand gold, as an RGB triplet so we can vary alpha per-frame
  maxOpacity = 0.13,
}: Props) {
  const set = letters ?? (density ? DEFAULT_LETTERS.slice(0, density) : DEFAULT_LETTERS);
  const restOpacity = maxOpacity * 0.55;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {set.map((l, i) => (
        <motion.div
          key={i}
          className="absolute select-none"
          style={{
            left: l.x,
            top: l.y,
            fontFamily: "Amiri,serif",
            fontSize: l.size,
            color: `rgba(${color},${restOpacity})`,
            fontWeight: 700,
            lineHeight: 1,
            rotate: l.rotate,
            willChange: "transform",
          }}
          animate={{
            y: [0, -38, 14, -24, 0],
            rotate: [l.rotate, l.rotate + 10, l.rotate - 8, l.rotate + 4, l.rotate],
            opacity: [restOpacity, maxOpacity, restOpacity, maxOpacity * 0.85, restOpacity],
          }}
          transition={{
            duration: l.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: l.delay,
          }}
        >
          {l.char}
        </motion.div>
      ))}
    </div>
  );
}
