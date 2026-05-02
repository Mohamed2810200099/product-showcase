import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, MessageCircle, Eye } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { formatEGP, resolveImg } from "@/lib/api";
import { toast } from "sonner";

const Badge = ({ children, color = "blush" }) => {
  const colors = {
    blush: "bg-blush-500 text-white",
    gold: "bg-champagne-400 text-ink",
    dark: "bg-ink text-white",
    success: "bg-emerald-500 text-white",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded-full ${colors[color]} tracking-wide`}
    >
      {children}
    </span>
  );
};

const ProductCard = ({ product, idx = 0 }) => {
  const { addItem } = useCart();
  const { whatsappLink } = useSettings();

  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : 0;

  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product);
    toast.success("تمت إضافة المنتج للسلة");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (idx % 4) * 0.08 }}
      className="group relative bg-white border border-blush-100 rounded-3xl overflow-hidden hover:shadow-soft hover:-translate-y-1 transition-all duration-400"
      data-testid={`product-card-${product.slug}`}
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square bg-blush-50 overflow-hidden">
          <img
            src={resolveImg(product.images?.[0]) || "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {product.is_best_seller && <Badge color="dark">الأكثر مبيعًا</Badge>}
            {product.is_new_arrival && <Badge color="gold">جديد</Badge>}
            {product.is_limited && <Badge color="blush">كمية محدودة</Badge>}
            {discount > 0 && <Badge color="success">-{discount}%</Badge>}
          </div>

          {/* Quick actions */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
            <a
              href={whatsappLink(`استفسار عن منتج: ${product.name}`)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-card"
              data-testid={`product-whatsapp-${product.slug}`}
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex-1 h-10 rounded-full bg-ink text-white flex items-center justify-center gap-2 text-sm font-medium hover:bg-blush-600 transition-colors disabled:opacity-40"
              data-testid={`add-to-cart-${product.slug}`}
            >
              <ShoppingBag className="w-4 h-4" />
              {outOfStock ? "غير متوفر" : "أضيفي للسلة"}
            </button>
          </div>

          {outOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-ink text-white px-4 py-2 rounded-full text-sm font-bold">
                نفذت الكمية
              </span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-champagne-400 font-latin tracking-wider uppercase">
              {product.brand}
            </span>
            {lowStock && (
              <span className="text-blush-500 font-medium">
                باقي {product.stock} فقط
              </span>
            )}
          </div>
          <h3 className="font-display text-base leading-snug line-clamp-2 text-ink group-hover:text-blush-600 transition-colors">
            {product.name_ar || product.name}
          </h3>
          <p className="text-xs text-ink-muted line-clamp-2 min-h-[32px]">
            {product.short_description}
          </p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold text-blush-600 font-body">
              {formatEGP(product.price)}
            </span>
            {product.old_price && product.old_price > product.price && (
              <span className="text-xs text-ink-muted line-through">
                {formatEGP(product.old_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const ProductCardSkeleton = () => (
  <div className="bg-white border border-blush-100 rounded-3xl overflow-hidden">
    <div className="aspect-square bg-blush-50 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-blush-50 rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-blush-100 rounded w-4/5 animate-pulse" />
      <div className="h-3 bg-blush-50 rounded w-full animate-pulse" />
      <div className="h-5 bg-blush-100 rounded w-1/2 animate-pulse" />
    </div>
  </div>
);

export default ProductCard;
