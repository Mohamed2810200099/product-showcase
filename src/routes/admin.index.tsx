import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ShoppingBag, Package, Star, Tag, TrendingUp } from "lucide-react";
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

function Dashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    pending: 0,
    revenue: 0,
    products: 0,
    pendingReviews: 0,
    activeCoupons: 0,
  });

  useEffect(() => {
    const load = async () => {
      const [orders, products, reviews, coupons] = await Promise.all([
        supabase.from("orders").select("status,total"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
        supabase.from("coupons").select("id", { count: "exact", head: true }).eq("active", true),
      ]);
      const ordersData = orders.data ?? [];
      setStats({
        orders: ordersData.length,
        pending: ordersData.filter((o) => o.status === "pending").length,
        revenue: ordersData.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0),
        products: products.count ?? 0,
        pendingReviews: reviews.count ?? 0,
        activeCoupons: coupons.count ?? 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "إجمالي الطلبات", value: stats.orders, icon: ShoppingBag, color: "from-primary to-primary-glow" },
    { label: "طلبات قيد التنفيذ", value: stats.pending, icon: TrendingUp, color: "from-amber-400 to-orange-500" },
    { label: "إجمالي الإيرادات", value: formatEGP(stats.revenue), icon: TrendingUp, color: "from-emerald-400 to-teal-500" },
    { label: "عدد المنتجات", value: stats.products, icon: Package, color: "from-blue-400 to-indigo-500" },
    { label: "تقييمات بانتظار الموافقة", value: stats.pendingReviews, icon: Star, color: "from-yellow-400 to-amber-500" },
    { label: "كوبونات نشطة", value: stats.activeCoupons, icon: Tag, color: "from-pink-400 to-rose-500" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">أهلاً بيكي 💕</h1>
      <p className="text-muted-foreground mb-8">نظرة سريعة على متجرك</p>

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
    </div>
  );
}
