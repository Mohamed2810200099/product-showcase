import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useCart } from "@/context/CartContext";
import { formatEGP } from "@/lib/format";
import { useBrand } from "@/hooks/use-brand";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "سلة التسوق — The Girl House" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const brand = useBrand();
  const shipping = subtotal >= brand.free_shipping_threshold ? 0 : brand.shipping_fee;
  const total = subtotal + shipping;

  useEffect(() => {
    trackEvent("cart_view", {
      cart_total: subtotal,
      items_count: items.reduce((s, i) => s + i.qty, 0),
      product_ids: items.map((i) => i.id),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-3xl font-bold mb-2">سلتك فاضية</h1>
          <p className="text-muted-foreground mb-6">ابدئي تسوقك واكتشفي تشكيلتنا الفاخرة</p>
          <Link to="/shop" className="bg-primary text-primary-foreground px-7 py-3 rounded-full inline-block font-medium shadow-soft hover:opacity-90">
            تسوقي الآن
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">سلة التسوق</h1>
        {shipping > 0 ? (
          <div className="bg-primary/5 border border-primary/20 text-primary text-sm rounded-xl px-4 py-2.5 mb-6 inline-flex items-center gap-2">
            🚚 <span>أضيفي منتجات بقيمة {formatEGP(brand.free_shipping_threshold - subtotal)} للحصول على شحن مجاني</span>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2.5 mb-6 inline-flex items-center gap-2">
            🎉 <span>مبروك! أهلتي للشحن المجاني</span>
          </div>
        )}

        <div className="grid md:grid-cols-[1fr_360px] gap-8">
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4">
                <Link to="/product/$slug" params={{ slug: it.slug }} className="h-24 w-24 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                  <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 flex flex-col">
                  <Link to="/product/$slug" params={{ slug: it.slug }} className="font-display font-semibold hover:text-primary line-clamp-2">{it.name}</Link>
                  <div className="text-primary font-bold text-sm mt-1">{formatEGP(it.price)}</div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center border border-border rounded-full">
                      <button onClick={() => setQty(it.id, it.qty - 1)} className="p-1.5 hover:bg-accent rounded-r-full"><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-sm font-semibold">{it.qty}</span>
                      <button onClick={() => setQty(it.id, it.qty + 1)} className="p-1.5 hover:bg-accent rounded-l-full"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive p-2" aria-label="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="font-bold text-sm self-center">{formatEGP(it.price * it.qty)}</div>
              </li>
            ))}
          </ul>

          <aside className="bg-card border border-border rounded-2xl p-5 h-fit md:sticky md:top-28">
            <h2 className="font-display text-xl font-bold mb-4">ملخص الطلب</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>المجموع</dt><dd>{formatEGP(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>الشحن</dt><dd>{shipping === 0 ? "مجاناً" : formatEGP(shipping)}</dd></div>
              {shipping > 0 && (
                <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                  أضيفي {formatEGP(brand.free_shipping_threshold - subtotal)} للحصول على شحن مجاني!
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <dt>الإجمالي</dt><dd className="text-primary">{formatEGP(total)}</dd>
              </div>
            </dl>
            <Link to="/checkout" className="mt-5 bg-primary text-primary-foreground py-3 rounded-full block text-center font-medium shadow-elegant hover:opacity-90 transition">
              إتمام الطلب
            </Link>
            <Link to="/shop" className="block text-center mt-3 text-sm text-muted-foreground hover:text-primary">متابعة التسوق</Link>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
