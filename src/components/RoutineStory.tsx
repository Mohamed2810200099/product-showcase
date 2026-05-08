import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence, type MotionValue } from "framer-motion";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

import intenseImg from "@/assets/products/cutout-intense-repair.png";
import scalpImg from "@/assets/products/cutout-scalp-booster.png";
import keratinImg from "@/assets/products/cutout-keratin-overnight.png";
import plexOilImg from "@/assets/products/cutout-plex-oil.png";
import plexCondImg from "@/assets/products/cutout-plex-conditioner.png";
import plexMaskImg from "@/assets/products/cutout-plex-mask.png";

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
    img: intenseImg,
    alt: "Intense Repair Hair Oil",
    eyebrow: "Step 01",
    title: "Intense Repair",
    subtitle: "عناية ولمعان للشعر المجهد",
    bullets: ["يمنح الشعر مظهرًا صحيًا", "يقلل مظهر التقصف", "بدون ثقل على الشعر"],
    glow: "from-[#FBE7C8] via-[#F8DCE5]/60 to-transparent",
  },
  {
    img: scalpImg,
    alt: "Scalp Booster Tonic",
    eyebrow: "Step 02",
    title: "Scalp Booster",
    subtitle: "دعم يومي لفروة الرأس وتحسين مظهر الكثافة",
    bullets: ["يساعد على تحسين مظهر كثافة الشعر", "مناسب للروتين اليومي", "بدون سيليكون"],
    glow: "from-[#FADCE7] via-[#F8C8D8]/60 to-transparent",
  },
  {
    img: keratinImg,
    alt: "Keratin Repair Overnight Fluid",
    eyebrow: "Step 03",
    title: "Night Repair",
    subtitle: "عناية ليلية للشعر المتضرر",
    bullets: ["يقلل مظهر التقصف", "يحمي الشعر أثناء النوم", "مناسب للشعر المجهد"],
    glow: "from-[#F8C8D8] via-[#EFA7C3]/40 to-transparent",
  },
  {
    img: plexOilImg,
    alt: "Plex Care Hair Oil",
    eyebrow: "Step 04",
    title: "Plex Care Oil",
    subtitle: "لمعان ونعومة بدون ثقل",
    bullets: ["يمنح الشعر مظهرًا صحيًا", "يقلل مظهر التلف", "مناسب للأطراف الجافة"],
    glow: "from-[#EDE7F6] via-[#F9EEF3]/70 to-transparent",
  },
  {
    img: plexCondImg,
    alt: "Plex Care Conditioner",
    eyebrow: "Step 05",
    title: "Plex Conditioner",
    subtitle: "خطوة يومية لشعر أسهل في التمشيط",
    bullets: ["يحسن سهولة التمشيط", "يقلل مظهر التلف", "ملمس أنعم وأخف"],
    glow: "from-[#F9EEF3] via-[#FADCE7]/60 to-transparent",
  },
  {
    img: plexMaskImg,
    alt: "Plex Care Hair Mask",
    eyebrow: "Step 06",
    title: "Plex Mask",
    subtitle: "إصلاح مكثف من أول استخدام",
    bullets: ["للشعر المعالج كيميائيًا", "يقوي بنية الشعر", "يقلل مظهر التقصف"],
    glow: "from-[#EDE7F6] via-[#F9EEF3]/70 to-transparent",
  },
];

function useStateFromMotion(mv: MotionValue<number>, initial: number): number {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const unsub = mv.on("change", (v) => {
      const i = Math.round(v);
      setValue((prev) => (prev === i ? prev : i));
    });
    return () => unsub();
  }, [mv]);
  return value;
}

export function RoutineStory() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const stepIndex = useTransform(scrollYProgress, (v) => {
    const n = STEPS.length;
    return Math.min(n - 1, Math.max(0, Math.floor(v * n * 0.999)));
  });

  const active = useStateFromMotion(stepIndex, 0);

  return (
    <section
      dir="rtl"
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 80% 0%, #FFF8F4 0%, #FCEFE9 35%, #F8DCE5 70%, #F9EEF3 100%)",
      }}
    >
      {/* Soft ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full bg-[#E7A8BF]/25 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-[420px] w-[420px] rounded-full bg-[#FBE7C8]/40 blur-3xl" />
      </div>

      {/* Heading */}
      <div className="container relative z-10 mx-auto px-4 pt-16 pb-6 text-center">
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
        <div
          ref={containerRef}
          className="hidden md:block relative"
          style={{ height: `${STEPS.length * 90}vh` }}
        >
          <div className="sticky top-0 h-screen flex items-center">
            <div className="container mx-auto px-4 grid grid-cols-12 gap-8 items-center w-full">
              {/* Text — left in LTR view, but RTL means right side visually */}
              <div className="col-span-5 text-right">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="text-xs font-semibold tracking-[0.3em] text-[#D96C9D] uppercase">
                      {STEPS[active].eyebrow}
                    </span>
                    <h3
                      className="font-display text-4xl lg:text-6xl font-bold mt-3 text-[#3A2430] leading-[1.05]"
                      dir="ltr"
                    >
                      {STEPS[active].title}
                    </h3>
                    <p className="mt-3 text-lg lg:text-xl text-[#3A2430]/80">
                      {STEPS[active].subtitle}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {STEPS[active].bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-[#3A2430]/85 text-base"
                        >
                          <span className="mt-0.5 h-5 w-5 rounded-full bg-[#D96C9D]/10 text-[#D96C9D] inline-flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3" />
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/shop"
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#3A2430] hover:bg-[#D96C9D] text-white px-7 py-3.5 text-sm font-semibold transition-colors shadow-[0_18px_38px_-12px_rgba(58,36,48,0.5)]"
                    >
                      اكتشفي المنتجات <ArrowLeft className="h-4 w-4" />
                    </Link>

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

              {/* Large transparent product visual — dominant, no frame */}
              <div className="col-span-7 relative h-[80vh] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, scale: 0.94, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -16 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {/* Glow only — no frame, no card */}
                    <div
                      aria-hidden
                      className={`absolute inset-[8%] rounded-full blur-3xl bg-gradient-to-br ${STEPS[active].glow} opacity-90`}
                    />
                    <motion.img
                      src={STEPS[active].img}
                      alt={STEPS[active].alt}
                      loading="lazy"
                      animate={{ y: [0, -14, 0] }}
                      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                      className="relative max-h-full w-auto h-full object-contain drop-shadow-[0_45px_55px_rgba(58,36,48,0.28)]"
                      style={{ background: "transparent" }}
                    />
                    {/* Soft ground shadow */}
                    <div
                      aria-hidden
                      className="absolute bottom-[6%] left-1/2 -translate-x-1/2 h-6 w-[55%] rounded-[100%] bg-[#3A2430]/15 blur-2xl"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile (and reduced motion): stacked */}
      <div className={`${reduce ? "block" : "md:hidden"} container relative z-10 mx-auto px-4 pb-16 space-y-10`}>
        {STEPS.map((s) => (
          <article key={s.title} className="relative">
            {/* Large product visual — no frame */}
            <div className="relative mx-auto h-[300px] w-full max-w-[340px]">
              <div
                aria-hidden
                className={`absolute inset-[8%] rounded-full blur-3xl bg-gradient-to-br ${s.glow}`}
              />
              <img
                src={s.img}
                alt={s.alt}
                loading="lazy"
                className="relative h-full w-full object-contain drop-shadow-[0_30px_35px_rgba(58,36,48,0.25)]"
                style={{ background: "transparent" }}
              />
              <div
                aria-hidden
                className="absolute bottom-2 left-1/2 -translate-x-1/2 h-4 w-[55%] rounded-[100%] bg-[#3A2430]/15 blur-xl"
              />
            </div>

            <div className="text-center mt-2">
              <span className="text-[10px] font-semibold tracking-[0.3em] text-[#D96C9D] uppercase">
                {s.eyebrow}
              </span>
              <h3 className="font-display text-2xl font-bold text-[#3A2430] mt-1" dir="ltr">
                {s.title}
              </h3>
              <p className="text-sm text-[#3A2430]/75 mt-1">{s.subtitle}</p>
              <ul className="mt-3 inline-flex flex-col gap-1.5 text-right">
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
