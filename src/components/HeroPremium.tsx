import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Tag, ShieldCheck, Truck, Package } from "lucide-react";

import logo from "@/assets/logo.png";
import groupImg from "@/assets/products/group.png";
import langhaarImg from "@/assets/products/langhaar.png";
import keratinImg from "@/assets/products/keratin.png";
import plexMaskImg from "@/assets/products/plex-haarmaske.png";
import plexSpuelungImg from "@/assets/products/plex-spuelung.png";

type FloatProduct = {
  src: string;
  label: string;
  glow: string;
  className: string;
  delay: number;
  parallax: number;
};

const products: FloatProduct[] = [
  {
    src: langhaarImg,
    label: "عناية بفروة الرأس",
    glow: "from-[#FADCE7] via-[#F8C8D8]/60 to-transparent",
    className: "top-[6%] right-[2%] w-[28%] sm:w-[22%]",
    delay: 0.6,
    parallax: 22,
  },
  {
    src: keratinImg,
    label: "ترميم الشعر",
    glow: "from-[#F8C8D8] via-[#EFA7C3]/40 to-transparent",
    className: "top-[2%] left-[6%] w-[30%] sm:w-[24%]",
    delay: 0.9,
    parallax: -18,
  },
  {
    src: plexMaskImg,
    label: "Plex Care",
    glow: "from-[#E9DCFF] via-[#F8C8D8]/50 to-transparent",
    className: "bottom-[6%] left-[0%] w-[34%] sm:w-[26%]",
    delay: 1.2,
    parallax: -14,
  },
  {
    src: plexSpuelungImg,
    label: "شعر أقوى",
    glow: "from-[#DCEFFF] via-[#FADCE7]/60 to-transparent",
    className: "bottom-[10%] right-[4%] w-[26%] sm:w-[20%]",
    delay: 1.5,
    parallax: 16,
  },
];

export function HeroPremium() {
  const reduce = useReducedMotion();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setFocus((f) => (f + 1) % products.length), 3500);
    return () => clearInterval(id);
  }, [reduce]);

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - r.left) / r.width - 0.5,
      y: (e.clientY - r.top) / r.height - 0.5,
    });
  };

  return (
    <section
      dir="rtl"
      className="relative overflow-hidden min-h-[92vh] flex items-center"
      style={{
        background:
          "radial-gradient(120% 80% at 80% 10%, #FFF4F7 0%, #FADCE7 45%, #F8C8D8 100%)",
      }}
    >
      {/* Glass blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-[#EFA7C3]/35 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-[360px] w-[360px] rounded-full bg-[#E9DCFF]/40 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-[320px] w-[320px] rounded-full bg-[#FFF8F1]/70 blur-3xl" />
      </div>

      {/* Sparkles */}
      {!reduce && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_8px_2px_rgba(255,255,255,0.7)]"
              style={{
                top: `${(i * 53) % 100}%`,
                left: `${(i * 37) % 100}%`,
              }}
              animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -10, 0] }}
              transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      )}

      <div className="container relative z-10 mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 py-16 sm:py-20 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center md:text-right space-y-6"
        >
          <motion.img
            src={logo}
            alt="The Girl House"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover shadow-[0_10px_30px_-10px_rgba(217,108,157,0.4)] mx-auto md:mx-0"
          />

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#3A2430]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#D96C9D] animate-pulse" />
            German Beauty Picks for Your Glow 🇩🇪
          </motion.span>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-[#3A2430]">
            منتجات ألمانية أصلية
            <br />
            <span className="bg-gradient-to-l from-[#D96C9D] via-[#EFA7C3] to-[#C95687] bg-clip-text text-transparent">
              لجمالك اليومي
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#3A2430]/70 max-w-md mx-auto md:mx-0 leading-relaxed">
            اختيارات أصلية مختارة من ألمانيا للعناية بالشعر والبشرة — متوفرة الآن في مصر بأسعار تليق بكِ.
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95687] text-white px-7 py-3.5 font-medium shadow-[0_12px_30px_-10px_rgba(217,108,157,0.6)] transition-all hover:shadow-[0_16px_40px_-10px_rgba(201,86,135,0.7)] hover:-translate-y-0.5"
            >
              <ShoppingBag className="h-4 w-4" /> اطلبي الآن
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-white text-[#3A2430] px-7 py-3.5 font-medium hover:bg-white transition shadow-soft"
            >
              <Tag className="h-4 w-4" /> شوفي العروض
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center md:justify-start pt-4 text-xs sm:text-sm text-[#3A2430]/80">
            {[
              { icon: ShieldCheck, label: "منتجات أصلية" },
              { icon: Package, label: "كمية محدودة" },
              { icon: Truck, label: "توصيل داخل مصر" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span className="h-7 w-7 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-[#D96C9D]">
                  <b.icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Product showcase */}
        <div
          onMouseMove={onMove}
          onMouseLeave={() => setMouse({ x: 0, y: 0 })}
          className="relative aspect-square w-full max-w-[560px] mx-auto"
        >
          {/* Center group */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="absolute inset-[12%] flex items-center justify-center"
            style={{
              transform: reduce
                ? undefined
                : `translate3d(${mouse.x * 12}px, ${mouse.y * 12}px, 0)`,
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFF8F1] via-[#FADCE7]/70 to-[#EFA7C3]/40 blur-2xl" />
            <motion.img
              src={groupImg}
              alt="منتجات The Girl House"
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full object-contain drop-shadow-[0_25px_40px_rgba(58,36,48,0.18)]"
            />
          </motion.div>

          {/* Floating products */}
          {products.map((p, i) => {
            const isFocus = i === focus;
            return (
              <motion.div
                key={p.src}
                className={`absolute ${p.className}`}
                initial={{ opacity: 0, scale: 0.6, y: 30 }}
                animate={{ opacity: 1, scale: isFocus ? 1.12 : 1, y: 0 }}
                transition={{
                  opacity: { duration: 0.7, delay: p.delay },
                  y: { duration: 0.7, delay: p.delay },
                  scale: { duration: 1.2, ease: "easeInOut" },
                }}
                style={{
                  transform: reduce
                    ? undefined
                    : `translate3d(${mouse.x * p.parallax}px, ${mouse.y * p.parallax}px, 0)`,
                  zIndex: isFocus ? 20 : 10,
                }}
              >
                <motion.div
                  animate={
                    reduce
                      ? undefined
                      : {
                          y: [0, -10, 0],
                          rotate: [-1.5, 1.5, -1.5],
                        }
                  }
                  transition={{
                    duration: 6 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                  className="relative"
                >
                  <div
                    className={`absolute -inset-6 rounded-full bg-gradient-radial bg-gradient-to-br ${p.glow} blur-2xl opacity-80`}
                  />
                  <img
                    src={p.src}
                    alt={p.label}
                    loading="lazy"
                    className="relative w-full h-auto object-contain drop-shadow-[0_18px_30px_rgba(58,36,48,0.22)]"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 backdrop-blur px-3 py-1 text-[10px] sm:text-xs font-semibold text-[#3A2430] shadow-soft border border-white">
                    {p.label}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}

          {/* Glossy floor */}
          <div className="absolute bottom-0 inset-x-8 h-10 rounded-[100%] bg-gradient-to-b from-white/50 to-transparent blur-xl" />
        </div>
      </div>
    </section>
  );
}
