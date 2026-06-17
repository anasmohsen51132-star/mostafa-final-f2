/* ============================================================
   src/app/luxury-enhancements.css
   ----------------------------------------------------------
   ملف تحسينات جمالية إضافية — منفصل تماماً عن globals.css
   لا يعدّل أي كلاس موجود، فقط يضيف كلاسات جديدة بأسماء فريدة
   تقدر تستخدمها في أي صفحة لإضافة لمسات بصرية فاخرة
   ============================================================ */

/* ============================================================
   1) لمعة ذهبية متحركة على الحدود (Shimmer Border)
   استخدم: <div class="lux-shine-border">...</div>
   ============================================================ */
.lux-shine-border {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}
.lux-shine-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(
    120deg,
    transparent 20%,
    rgba(201,168,76,0.9) 45%,
    rgba(232,201,122,1) 50%,
    rgba(201,168,76,0.9) 55%,
    transparent 80%
  );
  background-size: 250% 250%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: lux-border-sweep 3.5s linear infinite;
  pointer-events: none;
}
@keyframes lux-border-sweep {
  0%   { background-position: 0% 0%; }
  100% { background-position: 200% 200%; }
}

/* ============================================================
   2) بطاقة فاخرة بزاوية مقصوصة + ظل ذهبي ناعم
   استخدم: <div class="lux-card">...</div>
   ============================================================ */
.lux-card {
  position: relative;
  background: linear-gradient(160deg, #ffffff 0%, #FAF7F0 100%);
  border: 1px solid rgba(201,168,76,0.18);
  border-radius: 18px;
  box-shadow:
    0 1px 2px rgba(26,18,8,0.04),
    0 8px 24px rgba(201,168,76,0.10),
    0 2px 6px rgba(26,18,8,0.05);
  transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease;
}
.lux-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 1px 2px rgba(26,18,8,0.05),
    0 18px 40px rgba(201,168,76,0.18),
    0 4px 10px rgba(26,18,8,0.06);
}
.lux-card::after {
  content: "";
  position: absolute;
  top: 0; right: 0;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 28px 28px 0;
  border-color: transparent rgba(201,168,76,0.14) transparent transparent;
  border-radius: 0 18px 0 0;
}

/* ============================================================
   3) شارة "مميز" / "جديد" ذهبية متلألئة
   استخدم: <span class="lux-badge-gold">مميز</span>
   ============================================================ */
.lux-badge-gold {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Cairo', sans-serif;
  font-weight: 700;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 999px;
  color: #5A4310;
  background: linear-gradient(100deg, #F2D98A 0%, #C9A84C 45%, #E8C97A 60%, #C9A84C 100%);
  background-size: 200% auto;
  box-shadow: 0 2px 8px rgba(201,168,76,0.35);
  animation: lux-badge-glow 2.5s ease-in-out infinite;
}
@keyframes lux-badge-glow {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

/* ============================================================
   4) زر فاخر بحركة لمعة عند المرور بالماوس
   استخدم: <button class="lux-btn-shine">سجل الآن</button>
   ============================================================ */
.lux-btn-shine {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  font-family: 'Cairo', sans-serif;
  font-weight: 700;
  border-radius: 12px;
  padding: 12px 28px;
  color: #fff;
  background: linear-gradient(135deg, #1A6B47 0%, #2D9E6B 100%);
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 14px rgba(26,107,71,0.3);
}
.lux-btn-shine:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(26,107,71,0.4);
}
.lux-btn-shine:active { transform: translateY(0); }
.lux-btn-shine::before {
  content: "";
  position: absolute;
  top: 0; left: -120%;
  width: 60%; height: 100%;
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(255,255,255,0.35) 50%,
    transparent 100%
  );
  transform: skewX(-20deg);
  transition: left 0.6s ease;
  z-index: 1;
}
.lux-btn-shine:hover::before { left: 130%; }

/* ============================================================
   5) عنوان مزخرف بخط ذهبي تحته فاصل مزدوج صغير
   استخدم: <h2 class="lux-heading">عنوان القسم</h2>
   ============================================================ */
.lux-heading {
  position: relative;
  font-family: 'Amiri', serif;
  font-weight: 700;
  color: #1A1208;
  padding-bottom: 14px;
  margin-bottom: 4px;
}
.lux-heading::after {
  content: "";
  position: absolute;
  bottom: 0; right: 0;
  width: 64px;
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, #C9A84C, #E8C97A);
}
.lux-heading::before {
  content: "";
  position: absolute;
  bottom: -7px; right: 0;
  width: 28px;
  height: 2px;
  border-radius: 2px;
  background: #2D9E6B;
}

/* ============================================================
   6) أيقونة دائرية بهالة ذهبية نابضة (للإحصائيات أو التنبيهات)
   استخدم: <div class="lux-icon-halo">🎓</div>
   ============================================================ */
.lux-icon-halo {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #FAF7F0 0%, #F2EAD8 100%);
  box-shadow: inset 0 0 0 1px rgba(201,168,76,0.25);
}
.lux-icon-halo::before {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1.5px solid rgba(201,168,76,0.35);
  animation: lux-halo-pulse 2.4s ease-in-out infinite;
}
@keyframes lux-halo-pulse {
  0%   { transform: scale(0.92); opacity: 0.7; }
  50%  { transform: scale(1.08); opacity: 0.15; }
  100% { transform: scale(0.92); opacity: 0.7; }
}

/* ============================================================
   7) شريط تقدّم فاخر متدرّج (لتقدم الطالب في الكورس)
   استخدم:
   <div class="lux-progress-track">
     <div class="lux-progress-fill" style="width:65%"></div>
   </div>
   ============================================================ */
.lux-progress-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: rgba(201,168,76,0.12);
  overflow: hidden;
}
.lux-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1A6B47, #2D9E6B, #C9A84C);
  background-size: 200% 100%;
  animation: lux-progress-shimmer 2.5s linear infinite;
  transition: width 0.6s cubic-bezier(0.22,1,0.36,1);
}
@keyframes lux-progress-shimmer {
  0%   { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

/* ============================================================
   8) تأثير "ورقة مرفوعة" خفيف عند المرور — لأي عنصر قابل للنقر
   استخدم: class="lux-lift"
   ============================================================ */
.lux-lift {
  transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease;
}
.lux-lift:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 12px 28px rgba(26,18,8,0.10);
}

/* ============================================================
   9) فاصل مزخرف بنقطة ذهبية في النص (بدل <hr> العادي)
   استخدم: <div class="lux-divider"></div>
   ============================================================ */
.lux-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 24px 0;
}
.lux-divider::before,
.lux-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent);
}
.lux-divider::after { background: linear-gradient(90deg, rgba(201,168,76,0.4), transparent, transparent); }

/* ============================================================
   10) خلفية متلألئة هادئة لقسم Hero / الترويسة
   استخدم: <section class="lux-hero-glow">...</section>
   ============================================================ */
.lux-hero-glow {
  position: relative;
  overflow: hidden;
}
.lux-hero-glow::before {
  content: "";
  position: absolute;
  top: -40%; right: -10%;
  width: 60%; height: 140%;
  background: radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 70%);
  pointer-events: none;
  animation: lux-glow-drift 8s ease-in-out infinite;
}
@keyframes lux-glow-drift {
  0%, 100% { transform: translate(0,0); }
  50%      { transform: translate(-20px, 20px); }
}

/* ============================================================
   استخدام متجاوب — تقليل الحركة لمن يفضّل ذلك (accessibility)
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .lux-shine-border::before,
  .lux-badge-gold,
  .lux-btn-shine::before,
  .lux-icon-halo::before,
  .lux-progress-fill,
  .lux-hero-glow::before {
    animation: none !important;
  }
}
