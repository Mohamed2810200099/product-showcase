import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Tag, ShieldCheck, Truck, Package, Gift, Sparkles } from "lucide-react";
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";
import { AnimatedHeroWords } from "@/components/ui/animated-hero";

import groupImg from "@/assets/products/group.png";
import langhaarImg from "@/assets/products/langhaar.png";
import keratinImg from "@/assets/products/keratin.png";
import plexMaskImg from "@/assets/products/plex-haarmaske.png";
import plexSpuelungImg from "@/assets/products/plex-spuelung.png";
import placeholderImg from "@/assets/product-placeholder.jpg";

function SmartImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && !errored && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F9EEF3] via-[#FFF8F4] to-[#F8DCE5] animate-pulse"
        />
      )}
      <img
        src={errored ? placeholderImg : src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(true); }}
        className={`${className ?? ""} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}


type FloatProduct = {
  src: string;
  label: string;
  glow: string;
  className: string;
  delay: number;
  parallax: number;
  accent?: boolean;
  to: string;
  search?: Record<string, string>;
};

const products: FloatProduct[] = [
  {
    src: keratinImg,
    label: "Hair Repair",
    glow: "from-[#F8C8D8] via-[#EFA7C3]/40 to-transparent",
    className: "top-[2%] left-[4%] w-[28%] sm:w-[22%]",
    delay: 0.7,
    parallax: -20,
    to: "/shop",
    search: { search: "keratin" },
  },
  {
    src: langhaarImg,
    label: "Scalp Care",
    glow: "from-[#FADCE7] via-[#F8C8D8]/60 to-transparent",
    className: "top-[6%] right-[3%] w-[26%] sm:w-[20%]",
    delay: 0.9,
    parallax: 22,
    to: "/shop",
    search: { category: "hair-care" },
  },
  {
    src: plexMaskImg,
    label: "Plex Care",
    glow: "from-[#EDE7F6] via-[#F9EEF3]/70 to-transparent",
    className: "bottom-[8%] left-[1%] w-[32%] sm:w-[24%]",
    delay: 1.1,
    parallax: -16,
    accent: true,
    to: "/shop",
    search: { search: "plex" },
  },
  {
    src: plexSpuelungImg,
    label: "Stronger Hair",
    glow: "from-[#F9EEF3] via-[#FADCE7]/60 to-transparent",
    className: "bottom-[12%] right-[2%] w-[26%] sm:w-[20%]",
    delay: 1.3,
    parallax: 18,
    to: "/shop",
    search: { search: "plex" },
  },
];

function MagneticButton({
  children,
  className,
  to,
}: {
  children: React.ReactNode;
  className: string;
  to: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 18 });
  const y = useSpring(0, { stiffness: 200, damping: 18 });
  const reduce = useReducedMotion();

  return (
    <motion.div style={{ x, y }} className="inline-block">
      <Link
        ref={ref}
        to={to}
        onMouseMove={(e) => {
          if (reduce || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          x.set(((e.clientX - r.left) / r.width - 0.5) * 18);
          y.set(((e.clientY - r.top) / r.height - 0.5) * 14);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
        className={className}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function HeroPremium() {
  const reduce = useReducedMotion();
  const [focus, setFocus] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Smooth mouse tracking
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 });

  // Spotlight
  const lx = useMotionValue(50);
  const ly = useMotionValue(50);
  const slx = useSpring(lx, { stiffness: 50, damping: 20 });
  const sly = useSpring(ly, { stiffness: 50, damping: 20 });
  const spotlight = useTransform(
    [slx, sly],
    ([x, y]) =>
      `radial-gradient(600px circle at ${x}% ${y}%, rgba(255,255,255,0.55), rgba(248,220,229,0.25) 35%, transparent 65%)`
  );

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setFocus((f) => (f + 1) % products.length), 3500);
    return () => clearInterval(id);
  }, [reduce]);

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onSectionMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    lx.set(((e.clientX - r.left) / r.width) * 100);
    ly.set(((e.clientY - r.top) / r.height) * 100);
  };

  const groupX = useTransform(sx, (v) => v * 14);
  const groupY = useTransform(sy, (v) => v * 14);

  return (
    <section
      dir="ltr"
      onMouseMove={onSectionMove}
      className="relative overflow-hidden min-h-[94vh] flex items-center"
      style={{
        background:
          "radial-gradient(120% 80% at 20% 10%, #FFF8F4 0%, #FDF4EF 28%, #F8DCE5 70%, #F9EEF3 100%)",
      }}
    >
      {/* Hero-local WebGL smoke (stronger) */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <SmokeBackground variant="hero" className="absolute inset-0 h-full w-full" />
      </div>

      {/* Animated CSS glow blobs */}
      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
          <motion.div
            className="absolute -top-24 -left-24 h-[520px] w-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, #D96C9D 0%, transparent 65%)", filter: "blur(70px)", opacity: 0.45 }}
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -right-24 h-[560px] w-[560px] rounded-full"
            style={{ background: "radial-gradient(circle, #F6E7D8 0%, transparent 65%)", filter: "blur(80px)", opacity: 0.55 }}
            animate={{ scale: [1, 1.15, 1], x: [0, -30, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 left-1/3 h-[420px] w-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, #E7A8BF 0%, transparent 65%)", filter: "blur(60px)", opacity: 0.4 }}
            animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* Cursor spotlight */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ background: spotlight }}
        />
      )}

      {/* Glass blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-20 h-[460px] w-[460px] rounded-full bg-[#E7A8BF]/30 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-[380px] w-[380px] rounded-full bg-[#EDE7F6]/55 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-[340px] w-[340px] rounded-full bg-[#FFF8F4]/80 blur-3xl" />
        {/* Satin grain veil */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(58,36,48,0.5) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
      </div>

      {/* Sparkles */}
      {!reduce && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/90 shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]"
              style={{ top: `${(i * 53) % 100}%`, left: `${(i * 37) % 100}%` }}
              animate={{ opacity: [0.15, 0.85, 0.15], y: [0, -8, 0] }}
              transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </div>
      )}

      <div className="container relative z-10 mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 py-16 sm:py-20 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-center md:text-left space-y-6 order-2 md:order-1"
        >
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#3A2430] shadow-[0_4px_18px_-6px_rgba(217,108,157,0.25)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#D96C9D] animate-pulse" />
            Curated German Beauty • Now in Egypt
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, filter: "blur(10px)", y: 16 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1, delay: 0.25 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-[#3A2430] tracking-tight"
          >
            Original German Beauty
            <br />
            <span className="inline-flex flex-wrap items-baseline gap-x-3 justify-center md:justify-start">
              <span className="text-[#3A2430]">for Your</span>
              <AnimatedHeroWords
                words={["Everyday Glow", "Hair Repair", "Skin Glow", "Scalp Care", "Soft Hair"]}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] min-w-[8ch]"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg text-[#3A2430]/75 max-w-md mx-auto md:mx-0 leading-relaxed"
          >
            Carefully selected German haircare and skincare — now available in Egypt at prices you'll love.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } },
            }}
            className="flex flex-wrap gap-3 justify-center md:justify-start pt-1"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <MagneticButton
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-7 py-3.5 font-medium shadow-[0_14px_34px_-12px_rgba(217,108,157,0.7)] transition-colors"
              >
                <ShoppingBag className="h-4 w-4" /> Shop Now
              </MagneticButton>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <MagneticButton
                to="/offers"
                className="inline-flex items-center gap-2 rounded-full bg-white/75 backdrop-blur border border-white text-[#3A2430] px-7 py-3.5 font-medium hover:bg-white transition shadow-[0_8px_24px_-12px_rgba(58,36,48,0.25)]"
              >
                <Tag className="h-4 w-4" /> View Offers
              </MagneticButton>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-referral-modal"))}
                className="inline-flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-medium text-[#3A2430]/80 hover:text-[#D96C9D] transition"
              >
                <Gift className="h-4 w-4" /> ادعي صديقتك
              </button>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 justify-center md:justify-start pt-4 text-xs sm:text-sm text-[#3A2430]/80"
          >
            {[
              { icon: ShieldCheck, label: "Original Products" },
              { icon: Package, label: "Limited Stock" },
              { icon: Truck, label: "Delivery in Egypt" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span className="h-7 w-7 rounded-full bg-white/75 backdrop-blur flex items-center justify-center text-[#D96C9D] shadow-[0_4px_14px_-4px_rgba(217,108,157,0.3)]">
                  <b.icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">{b.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Product showcase */}
        <div
          ref={stageRef}
          onMouseMove={onMove}
          onMouseLeave={() => {
            mx.set(0);
            my.set(0);
          }}
          className="relative aspect-square w-full max-w-[580px] mx-auto order-1 md:order-2"
          style={{ perspective: 1200 }}
        >
          {/* Center group */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
            className="absolute inset-[10%] flex items-center justify-center"
            style={{ x: groupX, y: groupY }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFF8F4] via-[#F9EEF3]/70 to-[#E7A8BF]/30 blur-2xl" />
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full"
            >
              <SmartImage
                src={groupImg}
                alt="The Girl House products"
                eager
                className="relative w-full h-full object-contain drop-shadow-[0_30px_45px_rgba(58,36,48,0.2)]"
              />
            </motion.div>
          </motion.div>

          {/* Floating products */}
          {products.map((p, i) => (
            <FloatingProduct
              key={p.src}
              p={p}
              index={i}
              sx={sx}
              sy={sy}
              active={hover === i || focus === i}
              onEnter={() => setHover(i)}
              onLeave={() => setHover((h) => (h === i ? null : h))}
              reduce={!!reduce}
            />
          ))}

          {/* Glossy floor reflection */}
          <div className="absolute bottom-0 inset-x-10 h-12 rounded-[100%] bg-gradient-to-b from-white/60 to-transparent blur-xl" />
          <div className="absolute -bottom-2 inset-x-16 h-3 rounded-full bg-[#3A2430]/10 blur-md" />
        </div>
      </div>
    </section>
  );
}

function FloatingProduct({
  p,
  index,
  sx,
  sy,
  active,
  onEnter,
  onLeave,
  reduce,
}: {
  p: FloatProduct;
  index: number;
  sx: any;
  sy: any;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  reduce: boolean;
}) {
  const px = useTransform(sx, (v: number) => v * p.parallax);
  const py = useTransform(sy, (v: number) => v * p.parallax);
  const rx = useTransform(sy, (v: number) => v * -6);
  const ry = useTransform(sx, (v: number) => v * 6);

  return (
    <motion.div
      className={`absolute ${p.className}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, scale: 0.6, y: 30 }}
      animate={{ opacity: active ? 1 : 0.92, scale: active ? 1.1 : 1, y: 0 }}
      transition={{
        opacity: { duration: 0.7, delay: p.delay },
        scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.7, delay: p.delay },
      }}
      style={{
        x: px,
        y: py,
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        zIndex: active ? 30 : 10,
      }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
        className="relative"
      >
        <motion.div
          aria-hidden
          className={`absolute -inset-8 rounded-full bg-gradient-to-br ${p.glow} blur-2xl`}
          animate={{ opacity: active ? 0.95 : 0.55 }}
          transition={{ duration: 0.6 }}
        />
        <Link
          to={p.to}
          search={p.search as any}
          aria-label={p.label}
          className="block relative rounded-3xl bg-white/35 backdrop-blur-md border border-white/60 shadow-[0_20px_50px_-20px_rgba(58,36,48,0.35)] p-3 cursor-pointer hover:shadow-[0_30px_60px_-20px_rgba(217,108,157,0.55)] transition-shadow"
        >
          <img
            src={p.src}
            alt={p.label}
            loading="lazy"
            className="relative w-full h-auto object-contain drop-shadow-[0_18px_30px_rgba(58,36,48,0.25)]"
          />
        </Link>
        <motion.span
          animate={{ opacity: active ? 1 : 0.85, y: active ? 0 : 2 }}
          className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 backdrop-blur px-3 py-1 text-[10px] sm:text-xs font-semibold text-[#3A2430] shadow-[0_6px_18px_-6px_rgba(58,36,48,0.3)] border border-white"
        >
          {p.accent && <Sparkles className="inline h-3 w-3 mr-1 text-[#D96C9D]" />}
          {p.label}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
