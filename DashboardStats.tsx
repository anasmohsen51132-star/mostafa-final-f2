"use client";
// src/components/landing/CTASection.tsx
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="py-24 px-6"
      style={{ background: "#FAF7F0" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-3xl px-8 py-16 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#0D3D27 0%,#1A6B47 100%)",
            boxShadow: "0 20px 60px rgba(13,61,39,0.35)",
          }}
        >
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Gold accent top */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full"
            style={{ background: "linear-gradient(90deg,transparent,#C9A84C,transparent)" }}
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          />

          {/* Content */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{ fontFamily: "Amiri,serif", color: "rgba(201,168,76,0.7)", fontSize: 32, marginBottom: 8 }}
            >
              ﷽
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontFamily: "Amiri,serif",
                color: "#E8C97A",
                fontSize: "clamp(26px,5vw,46px)",
                lineHeight: 1.3,
                marginBottom: 16,
              }}
            >
              ابدأ رحلة التعلم اليوم
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.32 }}
              style={{
                fontFamily: "Cairo,sans-serif",
                color: "rgba(250,247,240,0.7)",
                fontSize: 16,
                lineHeight: 1.8,
                maxWidth: 440,
                margin: "0 auto 40px",
              }}
            >
              انضم إلى آلاف الطلاب وابدأ في إتقان اللغة العربية مع أفضل الأساتذة على منصة واحدة
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link
                href="/register"
                className="transition-transform hover:-translate-y-1 active:translate-y-0"
                style={{
                  padding: "16px 44px",
                  borderRadius: 16,
                  background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                  boxShadow: "0 6px 24px rgba(201,168,76,0.45)",
                  color: "#1A1208",
                  fontFamily: "Cairo,sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                سجّل الآن مجاناً ✨
              </Link>
              <Link
                href="/login"
                className="transition-transform hover:-translate-y-1 active:translate-y-0"
                style={{
                  padding: "16px 36px",
                  borderRadius: 16,
                  border: "1.5px solid rgba(201,168,76,0.4)",
                  background: "rgba(201,168,76,0.08)",
                  color: "#E8C97A",
                  fontFamily: "Cairo,sans-serif",
                  fontWeight: 600,
                  fontSize: 17,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                لديّ حساب
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.55 }}
              style={{
                fontFamily: "Cairo,sans-serif",
                color: "rgba(250,247,240,0.35)",
                fontSize: 12,
                marginTop: 20,
              }}
            >
              🔒 لا يلزم بطاقة ائتمانية — التسجيل مجاني تماماً
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
