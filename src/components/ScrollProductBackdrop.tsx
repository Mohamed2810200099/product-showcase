import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

import intenseImg from "@/assets/products/cutout-intense-repair.png";
import scalpImg from "@/assets/products/cutout-scalp-booster.png";
import keratinImg from "@/assets/products/cutout-keratin-overnight.png";
import plexOilImg from "@/assets/products/cutout-plex-oil.png";
import plexCondImg from "@/assets/products/cutout-plex-conditioner.png";
import plexMaskImg from "@/assets/products/cutout-plex-mask.png";

const PRODUCTS = [
  { src: intenseImg, alt: "Intense Repair", tilt: -8, glow: "from-[#FBE7C8]/70 via-[#F8DCE5]/40 to-transparent" },
  { src: scalpImg, alt: "Scalp Booster", tilt: 6, glow: "from-[#FADCE7]/70 via-[#F8C8D8]/40 to-transparent" },
  { src: keratinImg, alt: "Night Repair", tilt: -5, glow: "from-[#F8C8D8]/70 via-[#EFA7C3]/30 to-transparent" },
  { src: plexOilImg, alt: "Plex Care Oil", tilt: 8, glow: "from-[#EDE7F6]/70 via-[#F9EEF3]/40 to-transparent" },
  { src: plexCondImg, alt: "Plex Conditioner", tilt: -7, glow: "from-[#F9EEF3]/70 via-[#FADCE7]/40 to-transparent" },
  { src: plexMaskImg, alt: "Plex Mask", tilt: 5, glow: "from-[#EDE7F6]/70 via-[#F9EEF3]/50 to-transparent" },
];

/**
 * Fixed, full-viewport, page-background product visual.
 * Renders a single oversized transparent cutout pinned to the right edge.
 * As the user scrolls, the visible product cross-fades to the next one.
 * Pointer-events disabled so it never interferes with content.
 */
export function ScrollProductBackdrop() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [active, setActive] = useState(0);

  // subtle parallax: drift down slightly while scrolling
  const yShift = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const scaleShift = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const i = Math.min(PRODUCTS.length - 1, Math.max(0, Math.floor(v * PRODUCTS.length * 0.999)));
      setActive((prev) => (prev === i ? prev : i));
    });
    return () => unsub();
  }, [scrollYProgress]);

  const current = PRODUCTS[active];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ contain: "strict" }}
    >
      {/* Soft glow pad behind the product, also pinned right */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 right-[-10%] h-[80vh] w-[80vh] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, rgba(247,196,213,0.45) 0%, rgba(247,196,213,0) 65%)`,
          y: reduce ? 0 : yShift,
        }}
      />

      <AnimatePresence mode="sync">
        <motion.img
          key={active}
          src={current.src}
          alt=""
          initial={{ opacity: 0, scale: 0.96, rotate: current.tilt }}
          animate={{ opacity: 0.85, scale: 1, rotate: current.tilt }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            y: reduce ? 0 : yShift,
            scale: reduce ? 1 : scaleShift,
            background: "transparent",
          }}
          className="
            absolute
            top-1/2 -translate-y-1/2
            right-[-22%] sm:right-[-18%] md:right-[-12%] lg:right-[-8%]
            h-[110vh] sm:h-[115vh] md:h-[120vh]
            w-auto max-w-none
            object-contain
            select-none
            drop-shadow-[0_60px_80px_rgba(58,36,48,0.25)]
            opacity-80 md:opacity-85
            mix-blend-multiply
          "
        />
      </AnimatePresence>

      {/* Soft ivory veil so foreground text always reads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,248,244,0.55) 0%, rgba(255,248,244,0.15) 45%, rgba(255,248,244,0) 70%)",
        }}
      />
    </div>
  );
}
