"use client";
// src/components/dashboard/WelcomeAnimation.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  name: string;
  onDone?: () => void;
}

export function WelcomeAnimation({ name, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 600);
    }, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)" }}
        >
          {/* Orb */}
          <motion.div
            className="absolute w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(201,168,76,0.2),transparent 70%)" }}
            animate={{ scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
          />

          <div className="relative z-10 text-center px-8">
            {/* Basmala */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
              style={{ fontFamily: "Amiri,serif", color: "rgba(201,168,76,0.7)", fontSize: 42, marginBottom: 12 }}
            >
              ﷽
            </motion.div>

            {/* Welcome text */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: "clamp(28px,5vw,52px)", marginBottom: 8 }}
            >
              أهلاً وسهلاً
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              style={{ fontFamily: "Cairo,sans-serif", color: "#FAF7F0", fontSize: "clamp(20px,3.5vw,36px)", fontWeight: 700, marginBottom: 16 }}
            >
              {name}
            </motion.h2>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              style={{ height: 2, background: "linear-gradient(90deg,transparent,#C9A84C,transparent)", marginBottom: 16 }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.65)", fontSize: 16 }}
            >
              مرحباً بك في رحلة تعلم اللغة العربية ✨
            </motion.p>

            {/* Animated dots */}
            <motion.div
              className="flex justify-center gap-2 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#C9A84C" }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
