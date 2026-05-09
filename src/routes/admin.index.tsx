import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  ShoppingBag,
  Package,
  Star,
  Tag,
  TrendingUp,
  AlertTriangle,
  XCircle,
  MapPin,
  Calculator,
  Repeat,
} from "lucide-react";
import { formatEGP } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "لوحة التحكم — The Girl House" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <Dashboard />
      </AdminLayout>
    </AdminGuard>
  ),
});

type OrderRow = {
  status: string;
  total: number | string;
  created_at: string;
  city: string | null;
  governorate: string | null;
  customer_phone: string | null;
  coupon_code: string | null;
  items: Array<{ product_id?: string; name?: string; qty?: number; price?: number }> | null;
};

type ProductRow = {
  id: string;
  name: string;
  arabic_title: string | null;
  stock: number;
  stock_tracking_enabled: boolean;
  availability_status: string;
};

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfWeek = (d: Date) => { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; };
const startOfMonth = (d: Date) => { const x = startOfDay(d); x.setDate(1); return x; };

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [activeCoupons, setActiveCoupons] = useState(0);
  const [lowStock, setLowStock] = useState<ProductRow[]>([]);
  const [outStock, setOutStock] = useState<ProductRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const [ordersRes, productsCountRes, reviewsRes, couponsRes, productsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("status,total,created_at,city,governorate,customer_phone,coupon_code,items")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
        supabase.from("coupons").select("id", { count: "exact", head: true }).eq("active", true),
        supabase
          .from("products")
          .select("id,name,arabic_title,stock,stock_tracking_enabled,availability_status")
          .eq("is_active", true)
          .eq("stock_tracking_enabled", true),
      ]);

      setOrders((ordersRes.data ?? []) as OrderRow[]);
      setProductsCount(productsCountRes.count ?? 0);
      setPendingReviews(reviewsRes.count ?? 0);
      setActiveCoupons(couponsRes.count ?? 0);

      const products = (productsRes.data ?? []) as ProductRow[];
      setOutStock(products.filter((p) => p.availability_status === "out_of_stock" || p.stock <= 0));
      setLowStock(products.filter((p) => p.stock > 0 && p.stock <= 5));
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const today = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const valid = orders.filter((o) => o.status !== "cancelled");
  const sumIn = (since: Date) =>
    valid
      .filter((o) => new Date(o.created_at) >= since)
      .reduce((s, o) => s + Number(o.total), 0);

  const todaySales = sumIn(today);
  const weekSales = sumIn(weekStart);
  const monthSales = sumIn(monthStart);
  const totalRevenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const aov = valid.length > 0 ? totalRevenue / valid.length : 0;

  // Status breakdown
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  // Top governorates
  const govCounts = valid.reduce<Record<string, { count: number; revenue: number }>>((acc, o) => {
    const key = (o.governorate || "غير محدد").trim();
    acc[key] = acc[key] ?? { count: 0, revenue: 0 };
    acc[key].count += 1;
    acc[key].revenue += Number(o.total);
    return acc;
  }, {});
  const topGovs = Object.entries(govCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  // Best-selling products (by qty across order items)
  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of valid) {
    for (const it of o.items ?? []) {
      const id = it.product_id ?? it.name ?? "unknown";
      const name = it.name ?? "—";
      const qty = Number(it.qty ?? 0);
      const revenue = qty * Number(it.price ?? 0);
      const cur = productSales.get(id) ?? { name, qty: 0, revenue: 0 };
      cur.qty += qty;
      cur.revenue += revenue;
      productSales.set(id, cur);
    }
  }
  const bestSellers = Array.from(productSales.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // Coupon usage
  const couponUsage = valid.reduce<Record<string, number>>((acc, o) => {
    if (o.coupon_code) acc[o.coupon_code] = (acc[o.coupon_code] ?? 0) + 1;
    return acc;
  }, {});
  const topCoupons = Object.entries(couponUsage).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Repeat customers
  const phoneCounts = valid.reduce<Record<string, number>>((acc, o) => {
    if (o.customer_phone) acc[o.customer_phone] = (acc[o.customer_phone] ?? 0) + 1;
    return acc;
  }, {});
  const repeatCustomers = Object.values(phoneCounts).filter((n) => n > 1).length;

  const cards = [
    { label: "مبيعات اليوم", value: formatEGP(todaySales), icon: TrendingUp, color: "from-emerald-400 to-teal-500" },
    { label: "مبيعات الأسبوع", value: formatEGP(weekSales), icon: TrendingUp, color: "from-sky-400 to-indigo-500" },
    { label: "مبيعات الشهر", value: formatEGP(monthSales), icon: TrendingUp, color: "from-fuchsia-400 to-pink-500" },
    { label: "إجمالي الطلبات", value: orders.length, icon: ShoppingBag, color: "from-primary to-primary-glow" },
    { label: "متوسط قيمة الطلب", value: formatEGP(aov), icon: Calculator, color: "from-amber-400 to-orange-500" },
    { label: "عملاء متكررون", value: repeatCustomers, icon: Repeat, color: "from-violet-400 to-purple-500" },
    { label: "عدد المنتجات", value: productsCount, icon: Package, color: "from-blue-400 to-indigo-500" },
    { label: "تقييمات بانتظار الموافقة", value: pendingReviews, icon: Star, color: "from-yellow-400 to-amber-500" },
    { label: "كوبونات نشطة", value: activeCoupons, icon: Tag, color: "from-pink-400 to-rose-500" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">أهلاً بيكي 💕</h1>
      <p className="text-muted-foreground mb-8">
        نظرة سريعة على متجرك {loading ? "(جاري التحميل…)" : ""} —{" "}
        <Link to="/admin/marketing" className="text-primary hover:underline">شوفي تقرير التسويق</Link>
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${c.color} text-white mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Status + governorates */}
      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Panel title="الطلبات حسب الحالة" icon={ShoppingBag}>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد طلبات بعد.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {Object.entries(statusCounts).map(([s, n]) => (
                <li key={s} className="flex justify-between items-center">
                  <span className="capitalize">{s}</span>
                  <span className="font-bold">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="أعلى المحافظات" icon={MapPin}>
          {topGovs.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد بيانات.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topGovs.map(([gov, v]) => (
                <li key={gov} className="flex justify-between gap-3">
                  <span className="truncate">{gov}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {v.count} طلب · <span className="font-semibold text-foreground">{formatEGP(v.revenue)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Best sellers + coupons */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Panel title="الأكثر مبيعاً" icon={TrendingUp}>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد طلبات بعد.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {bestSellers.map((p, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{p.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {p.qty} قطعة · <span className="font-semibold text-foreground">{formatEGP(p.revenue)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="استخدام الكوبونات" icon={Tag}>
          {topCoupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد استخدام للكوبونات بعد.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {topCoupons.map(([code, n]) => (
                <li key={code} className="flex justify-between">
                  <span className="font-mono">{code}</span>
                  <span className="font-bold">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Stock alerts */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Panel title={`نفد المخزون (${outStock.length})`} icon={XCircle} accent="text-destructive">
          {outStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">كل المنتجات متوفرة 🎉</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {outStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="truncate">{p.arabic_title || p.name}</span>
                  <span className="text-destructive font-bold">{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={`مخزون منخفض (${lowStock.length})`} icon={AlertTriangle} accent="text-amber-600">
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد منتجات قريبة من النفاد.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="truncate">{p.arabic_title || p.name}</span>
                  <span className="text-amber-600 font-bold">{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  accent = "text-primary",
  children,
}: {
  title: string;
  icon: any;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} /> {title}
      </h3>
      {children}
    </section>
  );
}
