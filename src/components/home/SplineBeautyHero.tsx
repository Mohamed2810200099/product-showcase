import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag, Sparkles } from "lucide-react";
import { SplineScene } from "@/components/ui/spline-scene";
import groupImg from "@/assets/products/group.png";

// Configurable Spline scene URL — leave empty to show static fallback.
export const SPLINE_HERO_SCENE_URL = "";

export function SplineBeautyHero() {
  return (
    <section
      dir="ltr"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #FFF8F4 0%, #FCEBF2 50%, #F7D6E4 100%)",
      }}
    >
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 py-16 sm:py-20 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center md:text-left space-y-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#3A2430] shadow-[0_4px_18px_-6px_rgba(217,108,157,0.25)]">
            <Sparkles className="h-3.5 w-3.5 text-[#D96C9D]" />
            Original German Beauty • Now in Egypt
          </span>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] text-[#3A2430]">
            Original German Beauty
            <br />
            <span className="bg-gradient-to-r from-[#D96C9D] via-[#E7A8BF] to-[#C95588] bg-clip-text text-transparent">
              for Your Everyday Glow
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#3A2430]/75 max-w-md mx-auto md:mx-0 leading-relaxed" dir="rtl">
            منتجات عناية ألمانية مختارة بعناية للشعر والبشرة — متاحة الآن في مصر.
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-1">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-7 py-3.5 font-medium shadow-[0_14px_34px_-12px_rgba(217,108,157,0.7)] transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> Shop Now
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-white text-[#3A2430] px-7 py-3.5 font-medium hover:bg-white transition shadow-[0_8px_24px_-12px_rgba(58,36,48,0.25)]"
            >
              View Products
            </Link>
          </div>
        </motion.div>

        {/* Spline 3D scene */}
        <div className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] lg:h-[600px]">
          <SplineScene
            scene={SPLINE_HERO_SCENE_URL}
            fallbackImage={groupImg}
            title="The Girl House 3D Beauty Shelf"
            className="rounded-3xl shadow-[0_30px_70px_-30px_rgba(217,108,157,0.45)]"
          />
        </div>
      </div>
    </section>
  );
}
