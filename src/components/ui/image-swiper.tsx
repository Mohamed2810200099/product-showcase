import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export type SwiperProduct = {
  id: string;
  slug?: string;
  name: string;
  arabicName?: string;
  image: string;
  priceEgp?: number;
  comparePriceEgp?: number;
  category?: string;
  label?: string;
};

type Props = {
  products?: SwiperProduct[];
  images?: string[];
  cardWidth?: number;
  cardHeight?: number;
  className?: string;
  onProductClick?: (p: SwiperProduct) => void;
  onAddToCart?: (p: SwiperProduct) => void;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function ImageSwiper({
  products,
  images,
  cardWidth = 320,
  cardHeight = 440,
  className,
  onProductClick,
  onAddToCart,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 4000,
}: Props) {
  const items: SwiperProduct[] = useMemo(() => {
    if (products && products.length > 0) return products.slice(0, 8);
    if (images && images.length > 0)
      return images.slice(0, 8).map((src, i) => ({
        id: String(i),
        name: `Slide ${i + 1}`,
        image: src,
      }));
    return [];
  }, [products, images]);

  const [order, setOrder] = useState<number[]>(() => items.map((_, i) => i));
  const [drag, setDrag] = useState<{ x: number; active: boolean }>({ x: 0, active: false });
  const startX = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  useEffect(() => {
    setOrder(items.map((_, i) => i));
  }, [items.length]);

  const next = useCallback(() => {
    setOrder((o) => (o.length < 2 ? o : [...o.slice(1), o[0]]));
  }, []);
  const prev = useCallback(() => {
    setOrder((o) => (o.length < 2 ? o : [o[o.length - 1], ...o.slice(0, -1)]));
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || items.length < 2) return;
    let paused = false;
    const onVis = () => (paused = document.hidden);
    document.addEventListener("visibilitychange", onVis);
    const id = setInterval(() => {
      if (!paused && !drag.active) next();
    }, autoPlayInterval);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [autoPlay, autoPlayInterval, next, drag.active, items.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startX.current = e.clientX;
    setDrag({ x: 0, active: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag({ x: e.clientX - startX.current, active: true });
  };
  const onPointerUp = () => {
    if (!drag.active) return;
    const threshold = 50;
    if (drag.x > threshold) prev();
    else if (drag.x < -threshold) next();
    setDrag({ x: 0, active: false });
  };

  if (items.length === 0) return null;

  const top = order[0];
  const activeProduct = items[top];

  return (
    <div className={cn("relative select-none", className)}>
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        {showArrows && (
          <button
            type="button"
            aria-label="المنتج السابق"
            onClick={prev}
            className="hidden sm:flex h-11 w-11 rounded-full items-center justify-center bg-[#E7A8BF]/80 hover:bg-[#D96C9D] text-[#3B2332] hover:text-white shadow-[0_8px_24px_-8px_rgba(217,108,157,0.55)] transition-all hover:scale-110 active:scale-95 backdrop-blur"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          className="relative"
          style={{ width: cardWidth, height: cardHeight }}
          role="region"
          aria-roledescription="carousel"
          aria-label="منتجات مميزة"
        >
          {order.map((idx, stackPos) => {
            const p = items[idx];
            const isTop = stackPos === 0;
            const depth = Math.min(stackPos, 3);
            const baseTranslate = depth * 10;
            const baseScale = 1 - depth * 0.04;
            const baseRotate = depth * -2;
            const dragRotate = isTop ? (reduced.current ? drag.x * 0.02 : drag.x * 0.06) : 0;
            const dragX = isTop ? drag.x : 0;
            const opacity = stackPos > 3 ? 0 : 1;

            return (
              <div
                key={p.id}
                className={cn(
                  "absolute inset-0 rounded-[28px] overflow-hidden",
                  isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
                )}
                style={{
                  transform: `translate(${dragX + baseTranslate}px, ${baseTranslate}px) rotate(${baseRotate + dragRotate}deg) scale(${baseScale})`,
                  transition: drag.active && isTop ? "none" : "transform 420ms cubic-bezier(.2,.8,.2,1), opacity 300ms",
                  zIndex: 100 - stackPos,
                  opacity,
                  background: "rgba(255,248,244,0.92)",
                  border: "1px solid rgba(217,108,157,0.18)",
                  boxShadow:
                    "0 30px 60px -25px rgba(217,108,157,0.45), 0 8px 20px -8px rgba(199,156,120,0.25)",
                }}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
                onClick={() => {
                  if (!isTop) return;
                  if (Math.abs(drag.x) > 6) return;
                  onProductClick?.(p);
                }}
              >
                <img
                  src={p.image}
                  alt={p.arabicName || p.name}
                  draggable={false}
                  className="w-full h-full object-contain p-6 pointer-events-none"
                />
                {p.label && (
                  <span className="absolute top-4 right-4 bg-[#D96C9D] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {p.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {showArrows && (
          <button
            type="button"
            aria-label="المنتج التالي"
            onClick={next}
            className="hidden sm:flex h-11 w-11 rounded-full items-center justify-center bg-[#E7A8BF]/80 hover:bg-[#D96C9D] text-[#3B2332] hover:text-white shadow-[0_8px_24px_-8px_rgba(217,108,157,0.55)] transition-all hover:scale-110 active:scale-95 backdrop-blur"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mobile arrows */}
      {showArrows && (
        <div className="sm:hidden flex items-center justify-center gap-4 mt-4">
          <button
            type="button"
            aria-label="المنتج السابق"
            onClick={prev}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-[#E7A8BF]/80 text-[#3B2332] shadow-soft active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="المنتج التالي"
            onClick={next}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-[#E7A8BF]/80 text-[#3B2332] shadow-soft active:scale-95"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Active product info + actions */}
      {activeProduct && (
        <div className="mt-6 text-center">
          {activeProduct.category && (
            <div className="text-xs uppercase tracking-[0.2em] text-[#D96C9D] mb-1.5">
              {activeProduct.category}
            </div>
          )}
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#3B2332] line-clamp-2">
            {activeProduct.arabicName || activeProduct.name}
          </h3>
          {typeof activeProduct.priceEgp === "number" && (
            <div className="mt-2 text-lg font-bold text-[#D96C9D]">
              {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(activeProduct.priceEgp)}
            </div>
          )}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onProductClick?.(activeProduct)}
              className="px-5 h-11 rounded-full bg-[#3B2332] text-white text-sm font-medium hover:bg-[#D96C9D] transition shadow-soft"
            >
              عرض المنتج
            </button>
            {onAddToCart && (
              <button
                type="button"
                onClick={() => onAddToCart(activeProduct)}
                className="px-5 h-11 rounded-full bg-[#D96C9D] text-white text-sm font-medium hover:bg-[#C95588] transition shadow-soft inline-flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                أضيفي للسلة
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageSwiper;
