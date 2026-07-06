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

// A dense default set spread across the canvas — good for a full-height
// hero/page background. Pass a shorter `letters` array (or use `density`)
// for smaller surfaces like a card or a narrower panel.
const DEFAULT_LETTERS: FloatingLetter[] = [
  { char: "ع", x: "6%",  y: "14%", size: 62, duration: 14,   delay: 0,   rotate: -15 },
  { char: "ر", x: "84%", y: "9%",  size: 48, duration: 18,   delay: 1.5, rotate: 12  },
  { char: "ب", x: "74%", y: "58%", size: 70, duration: 12,   delay: 0.8, rotate: -8  },
  { char: "ي", x: "3%",  y: "60%", size: 52, duration: 16,   delay: 2.2, rotate: 20  },
  { char: "ة", x: "90%", y: "36%", size: 44, duration: 20,   delay: 0.4, rotate: -20 },
  { char: "م", x: "14%", y: "78%", size: 58, duration: 15,   delay: 1.8, rotate: 8   },
  { char: "ص", x: "48%", y: "6%",  size: 38, duration: 22,   delay: 3,   rotate: -5  },
  { char: "ا", x: "62%", y: "74%", size: 50, duration: 17,   delay: 1.1, rotate: 15  },
  { char: "ف", x: "33%", y: "86%", size: 36, duration: 19,   delay: 2.6, rotate: -12 },
  { char: "ن", x: "93%", y: "78%", size: 46, duration: 13,   delay: 0.6, rotate: 18  },
  { char: "ك", x: "23%", y: "32%", size: 40, duration: 21,   delay: 1.3, rotate: -18 },
  { char: "ل", x: "44%", y: "50%", size: 56, duration: 14.5, delay: 2.8, rotate: 10  },
  { char: "ط", x: "79%", y: "86%", size: 34, duration: 23,   delay: 0.2, rotate: -6  },
  { char: "ق", x: "1%",  y: "40%", size: 48, duration: 16.5, delay: 1.9, rotate: 14  },
  { char: "د", x: "96%", y: "58%", size: 38, duration: 18.5, delay: 2.4, rotate: -22 },
  { char: "ه", x: "18%", y: "3%",  size: 32, duration: 20.5, delay: 0.9, rotate: 9   },
  { char: "و", x: "56%", y: "27%", size: 42, duration: 15.5, delay: 3.2, rotate: -10 },
  { char: "ث", x: "38%", y: "65%", size: 36, duration: 24,   delay: 1.6, rotate: 16  },
  { char: "ج", x: "10%", y: "48%", size: 34, duration: 19.5, delay: 0.3, rotate: -14 },
  { char: "ح", x: "68%", y: "20%", size: 44, duration: 17.5, delay: 2.1, rotate: 11  },
  { char: "خ", x: "97%", y: "16%", size: 30, duration: 21.5, delay: 1.4, rotate: -9  },
  { char: "ذ", x: "27%", y: "94%", size: 40, duration: 16,   delay: 2.9, rotate: 19  },
  { char: "ز", x: "58%", y: "92%", size: 32, duration: 22.5, delay: 0.7, rotate: -16 },
  { char: "س", x: "8%",  y: "90%", size: 46, duration: 14,   delay: 2.5, rotate: 7   },
  { char: "ش", x: "86%", y: "68%", size: 36, duration: 20,   delay: 1.7, rotate: -11 },
  { char: "ت", x: "42%", y: "12%", size: 34, duration: 18,   delay: 0.5, rotate: 13  },
  { char: "ث", x: "30%", y: "45%", size: 30, duration: 23.5, delay: 3.1, rotate: -19 },
  { char: "ض", x: "65%", y: "42%", size: 40, duration: 15,   delay: 1.2, rotate: 6   },
  { char: "ظ", x: "12%", y: "22%", size: 36, duration: 19,   delay: 2.3, rotate: -13 },
  { char: "غ", x: "50%", y: "62%", size: 32, duration: 21,   delay: 0.1, rotate: 17  },
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
  maxOpacity = 0.18,
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
            y: [0, -46, 18, -30, 0],
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
