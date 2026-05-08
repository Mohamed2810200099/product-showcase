import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, Sparkles, Tag, UserPlus } from "lucide-react";
import { SplineScene } from "@/components/ui/spline-scene";
import langhaarImg from "@/assets/products/langhaar.png";
import keratinImg from "@/assets/products/keratin.png";
import plexMaskImg from "@/assets/products/plex-haarmaske.png";
import plexSpuelungImg from "@/assets/products/plex-spuelung.png";

/**
 * Paste your Spline "Beauty Muse" scene URL here.
 * Format: https://prod.spline.design/<id>/scene.splinecode
 * Leave empty to show the soft branded fallback (NOT the robot demo).
 */
export const SPLINE_BEAUTY_MUSE_SCENE_URL = "";

type FloatProduct = {
  label: string;
  image: string;
  href: string;
  // position on the right column, in % of container
  top: string;
  left?: string;
  right?: string;
  delay: number;
  depth: number; // parallax strength
  ariaLabel: string;
};

const floatingProducts: FloatProduct[] = [
  {
    label: "Scalp Care",
    image: langhaarImg,
    href: "/shop?category=hair",
    top: "6%",
    left: "-2%",
    delay: 0.1,
    depth: 18,
    ariaLabel: "Langhaar Mädchen Scalp Booster Tonic",
  },
  {
    label: "Hair Repair",
    image: keratinImg,
    href: "/shop?category=hair",
    top: "20%",
    right: "-2%",
    delay: 0.25,
    depth: 26,
    ariaLabel: "Balea Keratin Repair Over Night Fluid",
  },
  {
    label: "Plex Care",
    image: plexMaskImg,
    href: "/shop?category=hair",
    top: "62%",
    left: "-4%",
    delay: 0.4,
    depth: 22,
    ariaLabel: "Balea Plex Care 2in1 Haarmaske",
  },
  {
    label: "Stronger Hair",
    image: plexSpuelungImg,
    href: "/shop?category=hair",
    top: "72%",
    right: "0%",
    delay: 0.55,
    depth: 14,
    ariaLabel: "Balea Plex Care Spülung",
  },
];

export function SplineBeautyHero() {
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (reduce) return;
    const el = sceneRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMouse({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
        if (glowRef.current) {
          glowRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(217,108,157,0.28), transparent 45%)`;
        }
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <section
      dir="ltr"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #FFF8F4 0%, #FCEBF2 45%, #F7D6E4 100%)",
      }}
      aria-label="The Girl House 3D Beauty Muse"
    >
      {/* Soft decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #F6E7D8, transparent)" }} />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #E7A8BF, transparent)" }} />

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 py-16 sm:py-20 items-center relative">
        {/* LEFT — Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center md:text-left space-y-6 relative z-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#3B2332] shadow-[0_4px_18px_-6px_rgba(217,108,157,0.25)]">
            <Sparkles className="h-3.5 w-3.5 text-[#D96C9D]" />
            Curated German Beauty • Now in Egypt
          </span>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] text-[#3B2332]">
            Original German Beauty
            <br />
            <span className="bg-gradient-to-r from-[#D96C9D] via-[#E7A8BF] to-[#C95588] bg-clip-text text-transparent">
              for Your Everyday Glow
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#3B2332]/75 max-w-md mx-auto md:mx-0 leading-relaxed">
            Carefully selected German haircare and skincare — now available in Egypt at prices you'll love.
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-1 relative z-20">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-7 py-3.5 font-medium shadow-[0_14px_34px_-12px_rgba(217,108,157,0.7)] transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> Shop Now
            </Link>
            <Link
              to="/offers"
              className="inline-flex items-center gap-2 rounded-full bg-white/85 backdrop-blur border border-white text-[#3B2332] px-7 py-3.5 font-medium hover:bg-white transition shadow-[0_8px_24px_-12px_rgba(58,36,48,0.25)]"
            >
              <Tag className="h-4 w-4" /> View Offers
            </Link>
            <a
              href="#referral"
              className="inline-flex items-center gap-2 rounded-full border border-[#D96C9D]/40 text-[#3B2332] px-7 py-3.5 font-medium hover:bg-white/60 transition"
            >
              <UserPlus className="h-4 w-4" /> ادعي صديقتك
            </a>
          </div>
        </motion.div>

        {/* RIGHT — Spline scene + floating products */}
        <div
          ref={sceneRef}
          className="relative w-full h-[340px] sm:h-[430px] md:h-[560px] lg:h-[640px]"
        >
          {/* Cursor glow (pointer-events none) */}
          <div
            ref={glowRef}
            className="pointer-events-none absolute inset-0 rounded-3xl transition-[background] duration-200"
            aria-hidden="true"
          />

          {/* Spline canvas / fallback */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(217,108,157,0.45)]"
            style={
              reduce
                ? undefined
                : {
                    transform: `translate3d(${(mouse.x - 0.5) * -16}px, ${(mouse.y - 0.5) * -16}px, 0)`,
                    transition: "transform 220ms ease-out",
                  }
            }
          >
            <SplineScene
              scene={SPLINE_BEAUTY_MUSE_SCENE_URL}
              title="The Girl House 3D Beauty Muse"
            />
            {!SPLINE_BEAUTY_MUSE_SCENE_URL && (
              <div className="absolute inset-0 flex items-end justify-center p-6 pointer-events-none">
                <div className="text-center bg-white/70 backdrop-blur rounded-2xl px-4 py-3 shadow-[0_8px_24px_-12px_rgba(58,36,48,0.25)]">
                  <p className="text-sm font-medium text-[#3B2332]">3D Beauty Muse — coming soon ✨</p>
                  <p className="text-xs text-[#3B2332]/70">Soft, feminine, premium scene loading shortly.</p>
                </div>
              </div>
            )}
          </div>

          {/* Floating product cards */}
          {floatingProducts.map((p) => {
            const tx = reduce ? 0 : (mouse.x - 0.5) * p.depth;
            const ty = reduce ? 0 : (mouse.y - 0.5) * p.depth;
            return (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
                className="absolute z-10"
                style={{ top: p.top, left: p.left, right: p.right }}
              >
                <Link
                  to="/shop"
                  aria-label={p.ariaLabel}
                  className="group block"
                  style={{
                    transform: `translate3d(${tx}px, ${ty}px, 0)`,
                    transition: "transform 220ms ease-out",
                  }}
                >
                  <div className="flex items-center gap-2 rounded-2xl bg-white/85 backdrop-blur border border-white pr-3 pl-2 py-2 shadow-[0_12px_28px_-14px_rgba(217,108,157,0.45)] hover:scale-[1.05] hover:shadow-[0_20px_40px_-16px_rgba(217,108,157,0.6)] transition">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-gradient-to-br from-[#FFF8F4] to-[#F7D6E4] flex items-center justify-center">
                      <img
                        src={p.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] uppercase tracking-wider text-[#D96C9D] font-semibold">
                        {p.label}
                      </div>
                      <div className="text-[11px] text-[#3B2332]/70 max-w-[8rem] truncate">
                        {p.ariaLabel}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Decorative pearls */}
          <div className="pointer-events-none absolute top-[40%] left-[45%] h-3 w-3 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
          <div className="pointer-events-none absolute top-[55%] right-[30%] h-2 w-2 rounded-full bg-[#F6E7D8] shadow-[0_0_14px_rgba(246,231,216,0.9)]" />
        </div>
      </div>
    </section>
  );
}
