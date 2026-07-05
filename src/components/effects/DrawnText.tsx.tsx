"use client";
// src/components/effects/DrawnText.tsx
//
// Renders text as an SVG outline that appears to be "drawn" (like a pen
// tracing the letters), then fades into solid, normally-readable filled
// text once the drawing finishes. Works with Arabic (RTL) text since it's
// just rendering the browser's own text shaping inside an <svg>, not
// converting fonts to custom paths.
//
// NOTE on precision: SVG <text> elements don't expose getTotalLength() the
// way <path> does, so the stroke-dasharray/dashoffset values here are a
// generously large fixed number rather than a mathematically exact glyph
// perimeter. This is the standard technique for this effect — the visual
// result reads convincingly as "being drawn" without needing exact path
// data, and it works for any text/length within reason.
import { m as motion } from "framer-motion";
import { useId } from "react";

interface Props {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  /** Final fill color once the drawing settles (e.g. "#E8C97A"). */
  color?: string;
  /** Stroke color while drawing — defaults to `color` if omitted. */
  strokeColor?: string;
  strokeWidth?: number;
  /** How long the drawing stroke takes, in seconds. */
  duration?: number;
  /** Delay before the drawing starts, in seconds. */
  delay?: number;
  className?: string;
  /** Extra vertical padding so tall glyphs / diacritics aren't clipped. */
  viewBoxHeightRatio?: number;
}

export function DrawnText({
  text,
  fontSize = 56,
  fontFamily = "Amiri,serif",
  color = "#E8C97A",
  strokeColor,
  strokeWidth = 1.5,
  duration = 2.2,
  delay = 0,
  className,
  viewBoxHeightRatio = 1.6,
}: Props) {
  // Unique id per instance so multiple DrawnText components on one page
  // don't collide if we ever add defs (gradients/filters) keyed by id.
  const uid = useId();
  const height = fontSize * viewBoxHeightRatio;
  const baselineY = fontSize * 1.05;
  const stroke = strokeColor ?? color;

  // Large enough to fully cover any reasonably-sized heading's rendered
  // stroke length — see the NOTE above on why this isn't computed exactly.
  const DASH_LENGTH = 4000;

  return (
    <svg
      viewBox={`0 0 1000 ${height}`}
      className={className}
      style={{ width: "100%", height, overflow: "visible", direction: "rtl" }}
      aria-label={text}
    >
      {/* Stroke pass: draws the outline of the letters like a pen. */}
      <motion.text
        key={`${uid}-stroke`}
        x="50%"
        y={baselineY}
        textAnchor="middle"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ fontFamily, fontSize, fontWeight: 700 }}
        strokeDasharray={DASH_LENGTH}
        initial={{ strokeDashoffset: DASH_LENGTH }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration, delay, ease: "easeInOut" }}
      >
        {text}
      </motion.text>

      {/* Fill pass: fades in on top once the stroke has mostly finished,
          so the text settles into normal, solidly-readable type. */}
      <motion.text
        key={`${uid}-fill`}
        x="50%"
        y={baselineY}
        textAnchor="middle"
        fill={color}
        style={{ fontFamily, fontSize, fontWeight: 700 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + duration * 0.75, ease: "easeOut" }}
      >
        {text}
      </motion.text>
    </svg>
  );
}
