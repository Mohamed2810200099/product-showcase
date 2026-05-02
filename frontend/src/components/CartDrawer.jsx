import React from "react";
import { Link } from "react-router-dom";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatEGP, resolveImg } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const CartDrawer = () => {
  const { items, drawerOpen, setDrawerOpen, updateQty, removeItem, subtotal } = useCart();

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setDrawerOpen(false)}
            data-testid="cart-drawer-overlay"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed top-0 bottom-0 left-0 w-full sm:w-[420px] bg-white z-50 flex flex-col"
            data-testid="cart-drawer"
          >
            <div className="flex items-center justify-between p-5 border-b border-blush-100">
              <div>
                <h3 className="font-display text-2xl text-ink">سلة التسوق</h3>
                <p className="text-xs text-ink-muted mt-0.5">{items.length} منتج</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-blush-50 flex items-center justify-center"
                aria-label="إغلاق"
                data-testid="close-cart-drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-blush-50 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-blush-400" />
                </div>
                <h4 className="font-display text-xl text-ink mb-2">سلتك فارغة</h4>
                <p className="text-sm text-ink-muted mb-6">
                  ابدأي تسوق منتجات العناية الألمانية المفضلة لديكِ
                </p>
                <Link
                  to="/shop"
                  onClick={() => setDrawerOpen(false)}
                  className="px-6 py-3 rounded-full bg-ink text-white text-sm font-medium hover:bg-blush-600 transition-colors"
                  data-testid="empty-cart-shop-cta"
                >
                  تسوقي الآن
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex gap-3 pb-4 border-b border-blush-50 last:border-0"
                      data-testid={`cart-item-${item.slug}`}
                    >
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-blush-50"
                      >
                        <img src={resolveImg(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-champagne-400 uppercase tracking-wider font-latin">
                          {item.brand}
                        </p>
                        <h4 className="text-sm font-medium text-ink line-clamp-2">
                          {item.name_ar || item.name}
                        </h4>
                        <p className="text-sm font-bold text-blush-600 mt-1">
                          {formatEGP(item.price)}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-blush-50 rounded-full p-0.5">
                            <button
                              onClick={() => updateQty(item.product_id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-blush-100"
                              aria-label="نقصان"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.product_id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-blush-100"
                              aria-label="زيادة"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product_id)}
                            className="text-ink-muted hover:text-rose-500 p-1"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 border-t border-blush-100 bg-blush-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-soft">الإجمالي الفرعي</span>
                    <span className="text-xl font-bold text-blush-600">
                      {formatEGP(subtotal)}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    الشحن والخصم يتم حسابهم عند إتمام الطلب
                  </p>
                  <Link
                    to="/checkout"
                    onClick={() => setDrawerOpen(false)}
                    className="block w-full py-3.5 rounded-full bg-ink hover:bg-blush-600 text-white text-center font-semibold transition-colors"
                    data-testid="cart-drawer-checkout"
                  >
                    إتمام الشراء
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setDrawerOpen(false)}
                    className="block w-full py-3 rounded-full border border-blush-200 text-center text-sm text-ink hover:bg-white transition-colors"
                  >
                    عرض السلة كاملة
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
