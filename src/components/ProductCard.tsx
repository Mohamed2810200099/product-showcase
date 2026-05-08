import { Link } from "@tanstack/react-router";
import { ShoppingBag, Star, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import placeholderImg from "@/assets/product-placeholder.jpg";
import { Product3DCard } from "@/components/three-d/Product3DCard";
import { trackEvent } from "@/lib/analytics";

export type Product = {
  id: string;
  name: string;
  arabic_title?: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  rating: number;
  reviews_count: number;
  stock: number;
  is_limited?: boolean;
  short_description?: string | null;
  availability_status?: string | null;
  stock_tracking_enabled?: boolean | null;
};

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const reduce = useReducedMotion();
  const img = (product.images && product.images.length > 0 ? product.images[0] : null) ?? placeholderImg;
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null;

  const status = product.availability_status ?? "available";
  const isComingSoon = status === "coming_soon";
  const isOut = status === "out_of_stock" || (product.stock_tracking_enabled === true && product.stock === 0);
  const unavailable = isOut || isComingSoon;

  const handleAdd = () => {
    if (unavailable) return;
    add({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: img });
    trackEvent("add_to_cart", { product_id: product.id, product_name: product.name, price: product.price, qty: 1, source: "product_card" });
    toast.success("تمت الإضافة للسلة 🛍️");
  };

  return (
    <Product3DCard className="group relative rounded-[1.75rem] bg-gradient-to-b from-card to-card/80 border border-border/60 overflow-hidden shadow-[0_2px_18px_-8px_rgba(217,108,157,0.18)] hover:shadow-[0_30px_70px_-25px_rgba(217,108,157,0.45)] hover:border-primary/30 transition-[box-shadow,border-color] duration-500">
      {/* Image hero */}
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-t-[1.75rem]"
        style={{ transform: "translateZ(30px)" }}
        aria-label={product.arabic_title || product.name}
      >
        {/* soft radial glow */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 60%, rgba(217,108,157,0.16), rgba(255,228,238,0.08) 55%, transparent 75%)",
          }}
        />
        {/* subtle noise/sheen on hover */}
        <div
          aria-hidden
          className="absolute -inset-x-10 -top-1/3 h-[60%] rotate-12 bg-gradient-to-b from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-60 translate-x-[-30%] group-hover:translate-x-[30%] transition-all duration-1000 ease-out pointer-events-none"
        />

        <motion.img
          src={img}
          alt={product.name}
          loading="lazy"
          className="relative z-[1] w-full h-full object-contain object-center p-5 sm:p-6 will-change-transform drop-shadow-[0_18px_25px_rgba(180,90,130,0.22)]"
          animate={reduce ? undefined : { y: [0, -4, 0] }}
          transition={reduce ? undefined : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          whileHover={reduce ? undefined : { scale: 1.07, rotate: -1.5, y: -8 }}
          style={{ transform: "translateZ(50px)" }}
        />

        {/* Badges */}
        {discount && (
          <span className="absolute top-3 right-3 z-[2] inline-flex items-center gap-1 bg-primary/95 backdrop-blur text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-soft ring-1 ring-white/30">
            -{discount}%
          </span>
        )}
        {product.is_limited && (
          <span className="absolute top-3 left-3 z-[2] inline-flex items-center gap-1 bg-gradient-to-br from-gold to-amber-300 text-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-soft ring-1 ring-white/40">
            <Sparkles className="h-3 w-3" /> كمية محدودة
          </span>
        )}

        {/* Unavailable overlay */}
        {unavailable && (
          <div className="absolute inset-0 z-[3] bg-background/75 backdrop-blur-[2px] flex items-center justify-center">
            <span
              className={`font-display text-lg px-4 py-1.5 rounded-full border ${
                isComingSoon
                  ? "text-amber-700 border-amber-300 bg-amber-50/90"
                  : "text-destructive border-destructive/40 bg-background/90"
              }`}
            >
              {isComingSoon ? "قريباً" : "نفد المخزون"}
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 sm:p-5 pt-3 relative" style={{ transform: "translateZ(15px)" }}>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md"
        >
          <h3 className="font-display text-base sm:text-lg font-semibold leading-snug line-clamp-2 min-h-[2.75rem] text-foreground/90 group-hover:text-primary transition-colors duration-300">
            {product.arabic_title || product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {product.reviews_count > 0 ? (
            <div className="inline-flex items-center gap-1 text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span className="font-medium text-foreground/80">{product.rating}</span>
              <span>({product.reviews_count})</span>
            </div>
          ) : (
            <span className="text-muted-foreground/70">جديد</span>
          )}
          <span className="mx-1 text-border">•</span>
          {isComingSoon ? (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              قريباً
            </span>
          ) : isOut ? (
            <span className="inline-flex items-center gap-1 text-destructive font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              نفد المخزون
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              متاح
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-primary font-bold text-xl tracking-tight leading-none">
              {formatEGP(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="mt-1 text-xs text-muted-foreground line-through">
                {formatEGP(product.compare_at_price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={unavailable}
            aria-label="أضيفي للسلة"
            className={`group/btn relative inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full font-medium text-sm
              bg-gradient-to-br from-primary to-primary/85 text-primary-foreground
              shadow-[0_8px_20px_-8px_rgba(217,108,157,0.6)]
              transition-all duration-300 ease-out
              hover:shadow-[0_14px_28px_-10px_rgba(217,108,157,0.7)] hover:-translate-y-0.5
              active:translate-y-0 active:scale-[0.97]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_20px_-8px_rgba(217,108,157,0.6)]
              disabled:bg-muted disabled:text-muted-foreground disabled:bg-none`}
          >
            <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover/btn:-rotate-12" />
            <span className="hidden sm:inline">أضيفي</span>
          </button>
        </div>
      </div>
    </Product3DCard>
  );
}
