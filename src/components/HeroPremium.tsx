import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Tag, ShieldCheck, Truck, Package, Gift } from "lucide-react";
import { AnimatedHeroWords } from "@/components/ui/animated-hero";
import groupImg from "@/assets/products/group.png";

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

  const onSectionMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    lx.set(((e.clientX - r.left) / r.width) * 100);
    ly.set(((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <section
      dir="rtl"
      onMouseMove={onSectionMove}
      className="relative overflow-hidden min-h-[78vh] md:min-h-[86vh] flex items-center"
    >
      {/* Animated CSS glow blobs (kept, very subtle) */}
      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block" style={{ zIndex: 1 }}>
          <motion.div
            className="absolute -top-24 -right-24 h-[520px] w-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, #D96C9D 0%, transparent 65%)", filter: "blur(70px)", opacity: 0.22 }}
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -left-24 h-[560px] w-[560px] rounded-full"
            style={{ background: "radial-gradient(circle, #F6E7D8 0%, transparent 65%)", filter: "blur(80px)", opacity: 0.3 }}
            animate={{ scale: [1, 1.12, 1], x: [0, 30, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* Studio group product image — sits behind text as a soft premium layer */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 1.04, x: -30 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-y-0 left-[-8%] sm:left-[-4%] md:left-0 md:right-auto md:w-[62%] lg:w-[58%] flex items-center justify-center"
        style={{ zIndex: 2 }}
      >
        <img
          src={groupImg}
          alt=""
          className="h-[70%] md:h-[88%] w-auto max-w-none object-contain select-none mix-blend-multiply"
          style={{
            opacity: 0.55,
            filter: "drop-shadow(0 40px 60px rgba(58,36,48,0.18))",
            background: "transparent",
          }}
        />
      </motion.div>

      {/* Cursor spotlight */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-soft-light hidden md:block"
          style={{ background: spotlight, zIndex: 3 }}
        />
      )}

      <div className="container relative z-10 mx-auto px-4 py-16 sm:py-20 md:py-24">
        {/* Centered content — backdrop product visual lives outside */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-center md:text-right space-y-5 sm:space-y-6 max-w-2xl"
        >
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#3A2430] shadow-[0_4px_18px_-6px_rgba(217,108,157,0.25)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#D96C9D] animate-pulse" />
            منتجات ألمانية أصلية • وصلت مصر
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, filter: "blur(10px)", y: 16 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1, delay: 0.25 }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] text-[#3A2430] tracking-tight"
          >
            جمالك يستحق الأصلي
            <br />
            <span className="inline-flex flex-wrap items-baseline gap-x-3 justify-center md:justify-start" dir="ltr">
              <AnimatedHeroWords
                words={["Hair Repair", "Skin Glow", "Scalp Care", "Soft Hair", "Everyday Glow"]}
                className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] min-w-[8ch]"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg text-[#3A2430]/75 max-w-md mx-auto md:mx-0 leading-relaxed"
          >
            مستحضرات شعر وبشرة ألمانية مختارة بعناية — أصلية ١٠٠٪ وبسعر مناسب، مع التوصيل لباب بيتك في مصر.
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
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#C95588] hover:from-[#C95588] hover:to-[#B8467A] text-white px-7 sm:px-8 py-3.5 text-base font-semibold shadow-[0_18px_38px_-12px_rgba(217,108,157,0.7)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8DCE5]"
              >
                <ShoppingBag className="h-5 w-5" /> تسوقي الآن
              </MagneticButton>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <MagneticButton
                to="/offers"
                className="inline-flex items-center gap-2 rounded-full bg-white/75 backdrop-blur border border-white text-[#3A2430] px-6 sm:px-7 py-3.5 font-medium hover:bg-white transition shadow-[0_8px_24px_-12px_rgba(58,36,48,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C9D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8DCE5]"
              >
                <Tag className="h-4 w-4" /> شاهدي العروض
              </MagneticButton>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-referral-modal"))}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-3.5 text-sm font-medium text-[#3A2430]/70 hover:text-[#D96C9D] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C9D]/50"
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
            className="flex flex-wrap items-center gap-x-5 gap-y-2.5 justify-center md:justify-start pt-3 sm:pt-4 text-xs sm:text-[13px] text-[#3A2430]/85"
          >
            {[
              { icon: ShieldCheck, label: "منتجات أصلية من ألمانيا" },
              { icon: Package, label: "الدفع عند الاستلام" },
              { icon: Truck, label: "توصيل داخل مصر" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span className="h-7 w-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-[#D96C9D] shadow-[0_4px_14px_-4px_rgba(217,108,157,0.3)]">
                  <b.icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">{b.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
