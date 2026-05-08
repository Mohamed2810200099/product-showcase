import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

import keratinImg from "@/assets/products/cutout-keratin-overnight.png";
import scalpImg from "@/assets/products/cutout-scalp-booster.png";
import plexOilImg from "@/assets/products/cutout-plex-oil.png";
import plexMaskImg from "@/assets/products/cutout-plex-mask.png";
import plexCondImg from "@/assets/products/cutout-plex-conditioner.png";

type Step = {
  img: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
  glow: string;
};

const STEPS: Step[] = [
  {
    img: keratinImg,
    alt: "Balea Keratin Repair Overnight Fluid",
    eyebrow: "Step 01",
    title: "Night Repair",
    subtitle: "عناية ليلية للشعر المتضرر",
    bullets: ["يقلل مظهر التقصف", "يساعد على حماية الشعر أثناء النوم", "مناسب للشعر المجهد"],
    glow: "from-[#F8C8D8] via-[#EFA7C3]/40 to-transparent",
  },
  {
    img: scalpImg,
    alt: "Langhaarmädchen Scalp Booster Tonic",
    eyebrow: "Step 02",
    title: "Scalp Booster",
    subtitle: "دعم يومي لفروة الرأس",
    bullets: ["يساعد على تحسين مظهر كثافة الشعر", "مناسب للروتين اليومي", "بدون سيليكون"],
    glow: "from-[#FADCE7] via-[#F8C8D8]/60 to-transparent",
  },
  {
    img: plexOilImg,
    alt: "Balea Plex Care Haaröl",
    eyebrow: "Step 03",
    title: "Plex Care Oil",
    subtitle: "لمعان ونعومة بدون ثقل",
    bullets: ["يمنح الشعر مظهرًا صحيًا", "يساعد على تقليل مظهر التلف", "مناسب للأطراف الجافة"],
    glow: "from-[#FBE7C8] via-[#F8DCE5]/60 to-transparent",
  },
  {
    img: plexMaskImg,
    alt: "Balea Plex Care 2in1 Haarmaske",
    eyebrow: "Step 04",
    title: "Plex Mask",
    subtitle: "إصلاح مكثف من أول استخدام",
    bullets: ["للشعر المعالج كيميائيًا", "يساعد على تقوية بنية الشعر", "يقلل مظهر التقصف والتكسر"],
    glow: "from-[#EDE7F6] via-[#F9EEF3]/70 to-transparent",
  },
  {
    img: plexCondImg,
    alt: "Balea Plex Care Spülung",
    eyebrow: "Step 05",
    title: "Plex Conditioner",
    subtitle: "خطوة يومية لشعر أسهل في التمشيط",
    bullets: ["يحسن سهولة التمشيط", "يقلل مظهر التلف", "يمنح الشعر ملمسًا أنعم"],
    glow: "from-[#F9EEF3] via-[#FADCE7]/60 to-transparent",
  },
];

export function RoutineStory() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // map progress 0..1 to step index 0..N-1
  const stepIndex = useTransform(scrollYProgress, (v) => {
    const n = STEPS.length;
    const i = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
    return i;
  });

  const [active, setActive] = useStateFromMotion(stepIndex, 0);

  return (
    <section dir="rtl" className="relative bg-gradient-to-b from-white via-[#FFF7F2] to-[#FCE9F1]">
      {/* Heading */}
      <div className="container mx-auto px-4 pt-16 pb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#D96C9D] border border-[#F8C8D8]">
          <Sparkles className="h-3.5 w-3.5" /> Hair Routine
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 text-[#3A2430]">
          اختاري روتينك حسب احتياج شعرك
        </h2>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm sm:text-base">
          خطوات مختارة بعناية من أصلي ألمانيا — كل منتج له دور واضح في روتينك.
        </p>
      </div>

      {/* Desktop: sticky scroll story */}
      {!reduce ? (
        <div ref={containerRef} className="hidden md:block relative" style={{ height: `${STEPS.length * 80}vh` }}>
          <div className="sticky top-0 h-screen flex items-center">
            <div className="container mx-auto px-4 grid grid-cols-2 gap-10 items-center">
              {/* Visual */}
              <div className="relative aspect-square max-w-[520px] w-full mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 30, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div
                      aria-hidden
                      className={`absolute inset-[10%] rounded-full blur-3xl bg-gradient-to-br ${STEPS[active].glow}`}
                    />
                    <motion.img
                      src={STEPS[active].img}
                      alt={STEPS[active].alt}
                      loading="lazy"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="relative max-h-[80%] w-auto object-contain drop-shadow-[0_30px_45px_rgba(58,36,48,0.22)]"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Text */}
              <div className="text-right">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <span className="text-xs font-semibold tracking-[0.25em] text-[#D96C9D] uppercase">
                      {STEPS[active].eyebrow}
                    </span>
                    <h3 className="font-display text-3xl lg:text-5xl font-bold mt-2 text-[#3A2430]" dir="ltr">
                      {STEPS[active].title}
                    </h3>
                    <p className="mt-2 text-lg text-[#3A2430]/80">{STEPS[active].subtitle}</p>
                    <ul className="mt-6 space-y-3">
                      {STEPS[active].bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-[#3A2430]/85">
                          <span className="mt-0.5 h-5 w-5 rounded-full bg-[#D96C9D]/10 text-[#D96C9D] inline-flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3" />
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/shop"
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#3A2430] hover:bg-[#D96C9D] text-white px-6 py-3 text-sm font-semibold transition-colors"
                    >
                      اكتشفي المنتجات <ArrowLeft className="h-4 w-4" />
                    </Link>

                    {/* progress dots */}
                    <div className="mt-8 flex gap-2">
                      {STEPS.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === active ? "w-10 bg-[#D96C9D]" : "w-4 bg-[#3A2430]/15"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile (and reduced motion): stacked cards */}
      <div className={`${reduce ? "block" : "md:hidden"} container mx-auto px-4 pb-16 space-y-6`}>
        {STEPS.map((s) => (
          <article
            key={s.title}
            className="relative rounded-3xl bg-white border border-[#F8C8D8]/50 shadow-[0_20px_50px_-25px_rgba(217,108,157,0.35)] overflow-hidden p-5 grid grid-cols-[120px_1fr] gap-4 items-center"
          >
            <div className="relative aspect-square">
              <div aria-hidden className={`absolute inset-1 rounded-full blur-2xl bg-gradient-to-br ${s.glow}`} />
              <img
                src={s.img}
                alt={s.alt}
                loading="lazy"
                className="relative h-full w-full object-contain drop-shadow-[0_15px_25px_rgba(58,36,48,0.2)]"
              />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-[#D96C9D] uppercase">
                {s.eyebrow}
              </span>
              <h3 className="font-display text-xl font-bold text-[#3A2430]" dir="ltr">{s.title}</h3>
              <p className="text-sm text-[#3A2430]/75 mt-0.5">{s.subtitle}</p>
              <ul className="mt-2 space-y-1">
                {s.bullets.map((b) => (
                  <li key={b} className="text-xs text-[#3A2430]/80 flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-[#D96C9D] mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
        <div className="text-center pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-[#3A2430] text-white px-6 py-3 text-sm font-semibold"
          >
            اكتشفي المنتجات <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Helper: subscribe to a MotionValue<number> and re-render on integer change
import { useEffect, useState } from "react";
import type { MotionValue } from "framer-motion";

function useStateFromMotion(mv: MotionValue<number>, initial: number): [number, (n: number) => void] {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const unsub = mv.on("change", (v) => {
      const i = Math.round(v);
      setValue((prev) => (prev === i ? prev : i));
    });
    return () => unsub();
  }, [mv]);
  return [value, setValue];
}
