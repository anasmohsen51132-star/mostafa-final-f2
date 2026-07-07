"use client";
// src/components/effects/TwinklingStars.tsx
//
// Small gold ✦ stars scattered across a dark surface, gently twinkling
// (scale + opacity pulse, with a slow rotate). This reuses the star motif
// already used elsewhere in the design (section dividers, the login page's
// rotating star) as a second decorative layer alongside
// FloatingArabicBackground, for surfaces that want extra richness.
import { m as motion } from "framer-motion";

interface Star {
  x: string;
  y: string;
  size: number;
  duration: number;
  delay: number;
}

const DEFAULT_STARS: Star[] = [
  { x: "12%", y: "10%", size: 14, duration: 3.2, delay: 0    },
  { x: "88%", y: "22%", size: 10, duration: 2.6, delay: 0.6  },
  { x: "64%", y: "8%",  size: 12, duration: 3.6, delay: 1.2  },
  { x: "4%",  y: "34%", size: 9,  duration: 2.9, delay: 1.8  },
  { x: "95%", y: "48%", size: 13, duration: 3.1, delay: 0.4  },
  { x: "22%", y: "52%", size: 8,  duration: 2.4, delay: 2.4  },
  { x: "78%", y: "70%", size: 11, duration: 3.4, delay: 0.9  },
  { x: "36%", y: "76%", size: 10, duration: 2.7, delay: 1.6  },
  { x: "6%",  y: "82%", size: 13, duration: 3.0, delay: 2.1  },
  { x: "52%", y: "90%", size: 9,  duration: 2.5, delay: 0.2  },
  { x: "70%", y: "38%", size: 8,  duration: 2.8, delay: 1.4  },
  { x: "42%", y: "30%", size: 11, duration: 3.3, delay: 2.7  },
  { x: "92%", y: "88%", size: 10, duration: 2.6, delay: 1.0  },
  { x: "16%", y: "66%", size: 8,  duration: 3.5, delay: 0.7  },
];

interface Props {
  stars?: Star[];
  density?: number;
  color?: string; // rgb triplet, defaults to brand gold
  maxOpacity?: number;
}

export function TwinklingStars({
  stars,
  density,
  color = "232,201,122", // lighter gold, matches the ✦ used in dividers
  maxOpacity = 0.55,
}: Props) {
  const set = stars ?? (density ? DEFAULT_STARS.slice(0, density) : DEFAULT_STARS);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {set.map((s, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{
            left: s.x,
            top: s.y,
            fontSize: s.size,
            color: `rgba(${color},${maxOpacity * 0.35})`,
            lineHeight: 1,
            willChange: "transform, opacity",
          }}
          animate={{
            opacity: [maxOpacity * 0.25, maxOpacity, maxOpacity * 0.25],
            scale: [0.8, 1.25, 0.8],
            rotate: [0, 25, 0],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}
