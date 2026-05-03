import { Link } from "@tanstack/react-router";
import { ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import placeholderImg from "@/assets/product-placeholder.jpg";

export type Product = {
  id: string;
  name: string;
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
  const img = (product.images && product.images.length > 0 ? product.images[0] : null) ?? placeholderImg;
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null;

  const status = product.availability_status ?? "available";
  const isOut = status === "out_of_stock" || (product.stock_tracking_enabled === true && product.stock === 0);

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block aspect-square overflow-hidden bg-muted relative">
        <img src={img} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {discount && (
          <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-soft">
            -{discount}%
          </span>
        )}
        {product.is_limited && (
          <span className="absolute top-3 left-3 bg-gold text-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-soft">
            كمية محدودة
          </span>
        )}
        {isOut && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="font-display text-lg">نفد المخزون</span>
          </div>
        )}
      </Link>
      <div className="p-4">
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="font-display text-base sm:text-lg font-semibold line-clamp-2 hover:text-primary transition min-h-[3rem]">
            {product.name}
          </h3>
        </Link>
        {product.reviews_count > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span>{product.rating}</span>
            <span>({product.reviews_count})</span>
          </div>
        )}
        {!isOut && (
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">متاح للطلب</div>
        )}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-primary font-bold text-lg">{formatEGP(product.price)}</div>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <div className="text-xs text-muted-foreground line-through">{formatEGP(product.compare_at_price)}</div>
            )}
          </div>
          <button
            onClick={() => {
              if (isOut) return;
              add({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: img });
              toast.success("تمت الإضافة للسلة 🛍️");
            }}
            disabled={isOut}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-soft"
            aria-label="أضيفي للسلة"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
