import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

import groupImg from "@/assets/products/group.png";
import keratinImg from "@/assets/products/keratin.png";
import langhaarImg from "@/assets/products/langhaar.png";
import plexMaskImg from "@/assets/products/plex-haarmaske.png";
import plexSpuelungImg from "@/assets/products/plex-spuelung.png";

const tiles = [
  { src: keratinImg, label: "Hair Repair", to: "/shop", search: { search: "keratin" }, pos: "top-4 left-4" },
  { src: langhaarImg, label: "Scalp Care", to: "/shop", search: { category: "hair-care" }, pos: "top-4 right-4" },
  { src: plexMaskImg, label: "Plex Care", to: "/shop", search: { search: "plex" }, pos: "bottom-4 left-4" },
  { src: plexSpuelungImg, label: "Skin Glow", to: "/shop", search: { category: "skincare" }, pos: "bottom-4 right-4" },
];

export function GermanBeautyScrollShowcase() {
  return (
    <section className="relative">
      <ContainerScroll
        heightVariant="section"
        theme="rose"
        titleComponent={
          <div className="space-y-3 px-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#D96C9D] border border-[#E7A8BF]/30">
              <Sparkles className="h-3.5 w-3.5" /> German Beauty Experience
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#3A2430] leading-tight">
              تجربة عناية ألمانية بطابع فاخر
            </h2>
            <p className="text-[#3A2430]/70 max-w-xl mx-auto text-sm sm:text-base">
              منتجات مختارة بعناية من ألمانيا، بتجربة تسوق ناعمة وسهلة في مصر.
            </p>
          </div>
        }
      >
        <div className="relative h-full w-full">
          {/* soft mist */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(217,108,157,0.18), transparent 55%), radial-gradient(circle at 75% 70%, rgba(246,231,216,0.4), transparent 55%)",
            }}
          />

          {/* central group */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={groupImg}
              alt="The Girl House products"
              className="max-h-[70%] w-auto object-contain drop-shadow-[0_25px_40px_rgba(58,36,48,0.2)]"
              loading="lazy"
            />
          </div>

          {/* floating tiles */}
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              to={tile.to}
              search={tile.search as any}
              className={`absolute ${tile.pos} group w-[28%] sm:w-[20%] rounded-2xl bg-white/75 backdrop-blur border border-white shadow-[0_18px_40px_-18px_rgba(217,108,157,0.45)] p-3 hover:-translate-y-1 transition-transform`}
            >
              <img src={tile.src} alt={tile.label} className="w-full h-auto object-contain" loading="lazy" />
              <div className="mt-1 text-center text-[10px] sm:text-xs font-semibold text-[#3A2430]">
                {tile.label}
              </div>
            </Link>
          ))}
        </div>
      </ContainerScroll>
    </section>
  );
}
