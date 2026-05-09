import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TrendingUp, Tag, ShoppingBag, Award, MessageCircle } from "lucide-react";
import { formatEGP } from "@/lib/format";

export const Route = createFileRoute("/admin/marketing")({
  head: () => ({ meta: [{ title: "تقرير التسويق — The Girl House" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <Marketing />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Order = {
  status: string;
  total: number | string;
  subtotal: number | string;
  discount: number | string;
  coupon_code: string | null;
  referral_code_used: string | null;
  items: Array<{ product_id?: string; name?: string; qty?: number; price?: number }> | null;
  created_at: string;
};

type Coupon = { code: string; type: string; value: number; used_count: number; max_uses: number | null; active: boolean };

function Marketing() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    (async () => {
      const [o, c] = await Promise.all([
        supabase
          .from("orders")
          .select("status,total,subtotal,discount,coupon_code,referral_code_used,items,created_at")
          .order("created_at", { ascending: false })
          .limit(2000),
        supabase.from("coupons").select("code,type,value,used_count,max_uses,active").order("used_count", { ascending: false }),
      ]);
      setOrders((o.data ?? []) as Order[]);
      setCoupons((c.data ?? []) as Coupon[]);
      setLoading(false);
    })();
  }, []);

  const valid = orders.filter((o) => o.status !== "cancelled");
  const purchases = valid.length;
  const totalRevenue = valid.reduce((s, o) => s + Number(o.total), 0);

  // Coupon performance — orders that used a coupon
  const couponOrders = valid.filter((o) => !!o.coupon_code);
  const couponRevenue = couponOrders.reduce((s, o) => s + Number(o.total), 0);
  const couponDiscountTotal = couponOrders.reduce((s, o) => s + Number(o.discount), 0);

  // Referral performance
  const referralOrders = valid.filter((o) => !!o.referral_code_used);

  // Best products
  const sales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of valid) {
    for (const it of o.items ?? []) {
      const id = it.product_id ?? it.name ?? "—";
      const cur = sales.get(id) ?? { name: it.name ?? "—", qty: 0, revenue: 0 };
      cur.qty += Number(it.qty ?? 0);
      cur.revenue += Number(it.qty ?? 0) * Number(it.price ?? 0);
      sales.set(id, cur);
    }
  }
  const arr = Array.from(sales.values());
  const bestByRevenue = [...arr].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const bestByQty = [...arr].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const cards = [
    { label: "إجمالي عمليات الشراء", value: purchases, icon: ShoppingBag },
    { label: "إجمالي الإيرادات", value: formatEGP(totalRevenue), icon: TrendingUp },
    { label: "طلبات بكوبون", value: couponOrders.length, icon: Tag },
    { label: "إيرادات الكوبون", value: formatEGP(couponRevenue), icon: TrendingUp },
    { label: "إجمالي الخصومات", value: formatEGP(couponDiscountTotal), icon: Tag },
    { label: "طلبات بالإحالة", value: referralOrders.length, icon: Award },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">تقرير التسويق</h1>
      <p className="text-muted-foreground mb-6">
        نظرة على أداء الكوبونات والمنتجات {loading ? "(جاري التحميل…)" : ""}
      </p>

      <p className="text-xs text-muted-foreground mb-6 bg-secondary/40 border border-border rounded-xl px-3 py-2">
        ملاحظة: أحداث قمع التسويق (add_to_cart, begin_checkout, whatsapp_clicked) تُسجَّل في GA4 / Meta Pixel.
        تقدري تشوفي معدل التحويل التفصيلي من هناك. هنا بنعرض الأرقام النهائية المحفوظة في قاعدة البيانات فقط.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <Icon className="h-5 w-5 text-primary mb-2" />
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="أعلى المنتجات بالإيراد">
          {bestByRevenue.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2 text-sm">
              {bestByRevenue.map((p, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{p.name}</span>
                  <span className="font-semibold">{formatEGP(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="أعلى المنتجات بالكمية">
          {bestByQty.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2 text-sm">
              {bestByQty.map((p, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{p.name}</span>
                  <span className="font-semibold">{p.qty} قطعة</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="أداء الكوبونات">
          {coupons.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2 text-sm">
              {coupons.slice(0, 10).map((c) => (
                <li key={c.code} className="flex justify-between gap-3">
                  <span className="font-mono">{c.code}</span>
                  <span className="text-muted-foreground">
                    {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""} استخدام
                    {c.active ? "" : " · موقوف"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="ملاحظات للنمو">
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li className="flex gap-2"><MessageCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> فعّلي Meta Pixel & GA4 من إعدادات الموقع لمتابعة قمع التحويل لحظياً.</li>
            <li className="flex gap-2"><Tag className="h-4 w-4 text-primary shrink-0 mt-0.5" /> الكوبونات الأعلى أداءً ممكن تكرّريها كحملة موسمية.</li>
            <li className="flex gap-2"><Award className="h-4 w-4 text-primary shrink-0 mt-0.5" /> طلبات الإحالة بتكلفة اكتساب أقل — شجّعي العميلات على المشاركة.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <h3 className="font-display font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">لا يوجد بيانات بعد.</p>;
}
