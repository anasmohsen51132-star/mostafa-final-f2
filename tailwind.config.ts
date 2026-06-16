import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C97A",
          dark: "#8B6914",
          50: "#fdf8ec",
          100: "#faf0d2",
          200: "#f5dfa5",
          300: "#eec96f",
          400: "#e5ae43",
          500: "#C9A84C",
          600: "#a8822a",
          700: "#8B6914",
          800: "#6e5117",
          900: "#5a4318",
        },
        emerald: {
          DEFAULT: "#1A6B47",
          light: "#2D9E6B",
          dark: "#0D3D27",
          50: "#edf7f2",
          100: "#d2eddf",
          200: "#a8dac2",
          300: "#71c09e",
          400: "#3da37a",
          500: "#1A6B47",
          600: "#155a3c",
          700: "#0D3D27",
          800: "#0b3221",
          900: "#092a1c",
        },
        cream: {
          DEFAULT: "#FAF7F0",
          dark: "#F2EAD8",
        },
        ink: {
          DEFAULT: "#1A1208",
          muted: "#4A3F2A",
          light: "#7A6E5A",
        },
      },
      fontFamily: {
        amiri: ["Amiri", "serif"],
        cairo: ["Cairo", "Tajawal", "sans-serif"],
        tajawal: ["Tajawal", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "scale-in": "scaleIn 0.3s ease forwards",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin 20s linear infinite",
        pulse: "pulse 2s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease forwards",
        "bounce-light": "bounceLight 1s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-12px) rotate(3deg)" },
          "66%": { transform: "translateY(-6px) rotate(-2deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        slideIn: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        bounceLight: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(201,168,76,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(201,168,76,0.6)" },
        },
      },
      boxShadow: {
        gold: "0 4px 16px rgba(201,168,76,0.35)",
        "gold-lg": "0 8px 32px rgba(201,168,76,0.45)",
        emerald: "0 4px 16px rgba(26,107,71,0.3)",
        "emerald-lg": "0 8px 32px rgba(26,107,71,0.4)",
        glass: "0 8px 32px rgba(26,18,8,0.12)",
        "glass-lg": "0 20px 60px rgba(26,18,8,0.2)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9A84C, #8B6914)",
        "emerald-gradient": "linear-gradient(135deg, #2D9E6B, #0D3D27)",
        "hero-gradient": "linear-gradient(135deg, #0D3D27 0%, #1A6B47 50%, #0D3D27 100%)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)",
        "arabic-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
