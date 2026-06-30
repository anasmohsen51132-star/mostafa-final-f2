"use client";
// src/components/landing/FeaturesSection.tsx
import { m as motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { SiteSettings } from "@/types";

interface Props {
  settings: Partial<SiteSettings> | null;
}

const FEATURES_DEFAULT = [
  {
    icon: "📖",
    title: "محتوى شامل",
    desc: "دروس متكاملة تغطي جميع جوانب اللغة العربية من نحو وصرف وأدب وإملاء",
  },
  {
    icon: "🎯",
    title: "تعلم هادف",
    desc: "منهج مدروس يضمن التقدم المستمر ويقيس مستوى الطالب في كل مرحلة",
  },
  {
    icon: "💡",
    title: "أسلوب مبتكر",
    desc: "طرق تدريس حديثة تجمع بين الأصالة والتكنولوجيا لتجعل التعلم ممتعاً",
  },
  {
    icon: "🏆",
    title: "امتحانات تفاعلية",
    desc: "اختبارات فورية وواجبات تضمن استيعاب المادة وتُقيّم التقدم الحقيقي",
  },
  {
    icon: "📱",
    title: "متاح في أي وقت",
    desc: "ادرس من أي جهاز وفي أي وقت تشاء بدون قيود على أجهزة الجوال والكمبيوتر",
  },
  {
    icon: "🎓",
    title: "شهادات التميز",
    desc: "احصل على شهادة إتمام معتمدة عند اجتياز كل مرحلة من مراحل الدراسة",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.09, ease: "easeOut" },
  }),
};

export function FeaturesSection({ settings }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  let features = FEATURES_DEFAULT;
  try {
    if (settings?.features && Array.isArray(settings.features)) {
      features = settings.features as typeof FEATURES_DEFAULT;
    }
  } catch {
    features = FEATURES_DEFAULT;
  }

  return (
    <section
      ref={ref}
      className="py-24 px-6"
      style={{ background: "#FAF7F0" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: "rgba(201,168,76,0.12)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#8B6914",
              fontFamily: "Cairo,sans-serif",
              letterSpacing: "0.08em",
            }}
          >
            ✨ لماذا نحن؟
          </span>
          <h2
            className="mb-4"
            style={{
              fontFamily: "Amiri,serif",
              color: "#1A1208",
              fontSize: "clamp(28px,5vw,48px)",
              lineHeight: 1.3,
            }}
          >
            منصة تعليمية متكاملة
          </h2>
          <p
            style={{
              fontFamily: "Cairo,sans-serif",
              color: "#4A3F2A",
              fontSize: 16,
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            نقدم تجربة تعليمية استثنائية تجمع بين أفضل الأساليب التقليدية والحديثة
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-2xl p-7 cursor-default"
              style={{
                background: "#fff",
                border: "1px solid rgba(201,168,76,0.15)",
                boxShadow: "0 4px 20px rgba(26,18,8,0.06)",
              }}
            >
              {/* Icon bubble */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(26,107,71,0.1))" }}
              >
                {feat.icon}
              </div>
              <h3
                className="font-bold mb-3"
                style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 17 }}
              >
                {feat.title}
              </h3>
              <p
                style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14, lineHeight: 1.75 }}
              >
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
