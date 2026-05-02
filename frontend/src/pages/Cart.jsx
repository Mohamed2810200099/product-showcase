import React from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatEGP } from "@/lib/api";

const Cart = () => {
  const { items, updateQty, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto rounded-full bg-blush-50 flex items-center justify-center mb-5">
            <ShoppingBag className="w-10 h-10 text-blush-400" />
          </div>
          <h1 className="font-display text-3xl text-ink mb-2">سلة التسوق فارغة</h1>
          <p className="text-ink-muted mb-6">
            ابدأي اختيار منتجاتك المفضلة من متجرنا
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-ink text-white font-semibold"
            data-testid="empty-cart-shop"
          >
            تسوقي الآن
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14" data-testid="cart-page">
      <div className="mb-8">
        <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-2">Cart</p>
        <h1 className="font-display text-3xl lg:text-4xl text-ink">سلة التسوق</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="flex gap-4 bg-white p-4 rounded-3xl border border-blush-100"
              data-testid={`cart-row-${item.slug}`}
            >
              <Link
                to={`/product/${item.slug}`}
                className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-blush-50"
              >
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-champagne-400 tracking-wider uppercase font-latin">
                  {item.brand}
                </p>
                <Link to={`/product/${item.slug}`} className="block">
                  <h3 className="font-display text-base text-ink line-clamp-2 hover:text-blush-600 transition-colors">
                    {item.name_ar || item.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                  <div className="flex items-center bg-blush-50 rounded-full p-0.5">
                    <button
                      onClick={() => updateQty(item.product_id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
                      aria-label="نقصان"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product_id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
                      aria-label="زيادة"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-blush-600">
                      {formatEGP(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-2 text-ink-muted hover:text-rose-500"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 mt-4 text-sm text-blush-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            متابعة التسوق
          </Link>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-28 bg-white rounded-3xl p-6 border border-blush-100 space-y-4">
            <h3 className="font-display text-xl text-ink border-b border-blush-100 pb-3">
              ملخص الطلب
            </h3>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">المجموع الفرعي</span>
              <span className="font-semibold">{formatEGP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">التوصيل</span>
              <span className="text-ink-muted">يُحسب عند الدفع</span>
            </div>
            <div className="pt-3 border-t border-blush-100 flex justify-between items-baseline">
              <span className="font-display text-lg">الإجمالي</span>
              <span className="text-2xl font-bold text-blush-600">{formatEGP(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              className="block w-full py-4 rounded-full bg-ink text-white text-center font-semibold hover:bg-blush-600 transition-colors"
              data-testid="cart-checkout-cta"
            >
              إتمام الشراء
            </Link>
            <p className="text-xs text-ink-muted text-center">
              🔒 دفع آمن + دعم عبر واتساب
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
