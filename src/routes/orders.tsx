import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lookupOrderByPhoneAndNumber } from "@/server/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Package, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getItemQty, type OrderItemLike } from "@/lib/order-items";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "طلباتي — The Girl House" },
      { name: "description", content: "تتبعي طلباتك من The Girl House." },
    ],
  }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  items: OrderItemLike[] | null;
};

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };
  return map[s] ?? s;
}

function OrdersPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch for logged-in users
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    setLoading(true);
    setSearched(true);
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("orders")
          .select("id, order_number, status, created_at, total, items")
          .eq("customer_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        if (err) throw err;
        if (!cancelled) setOrders((data as OrderRow[]) ?? []);
      } catch {
        if (!cancelled) setError("حصل خطأ، حاولي تاني.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, authLoading, user]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    const trimmedOrder = orderNumber.trim();
    if (trimmedPhone.length < 6) {
      setError("ادخلي رقم موبايل صحيح");
      return;
    }
    if (trimmedOrder.length < 4) {
      setError("ادخلي رقم الطلب");
      return;
    }
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const row = await lookupOrderByPhoneAndNumber({
        data: { phone: trimmedPhone, order_number: trimmedOrder },
      });
      setOrders(row ? [row as OrderRow] : []);
    } catch {
      setError("حصل خطأ، حاولي تاني.");
      setOrders([]);
    }
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div dir="rtl" className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-center mb-2 text-[#3A2430]">طلباتي</h1>
        <p className="text-center text-[#3A2430]/60 mb-8 text-sm">
          {isAuthenticated ? "كل طلباتك في مكان واحد." : "اكتبي رقم الطلب ورقم الموبايل المستخدم في الطلب."}
        </p>

        {!isAuthenticated && !authLoading && (
          <>
            <form onSubmit={search} className="space-y-2 mb-4">
              <Input
                type="text"
                dir="ltr"
                placeholder="رقم الطلب (TGH-...)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading} className="bg-[#D96C9D] hover:bg-[#C95588]">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="mr-2">بحث</span>
                </Button>
              </div>
            </form>
            <div className="text-center mb-8">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-[#D96C9D] hover:underline">
                <User className="h-4 w-4" /> أو سجلي دخولك لعرض كل طلباتك تلقائيًا
              </Link>
            </div>
          </>
        )}

        {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}

        {loading && (
          <div className="text-center py-12 text-[#3A2430]/60">
            <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
            <p className="text-sm">جاري التحميل…</p>
          </div>
        )}

        {searched && !loading && orders.length === 0 && !error && (
          <div className="text-center py-12 text-[#3A2430]/60">
            <Package className="mx-auto h-10 w-10 mb-3 opacity-40" />
            مفيش طلبات لسه.
          </div>
        )}

        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-[#F0CCD9] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="font-mono text-sm font-semibold" dir="ltr">{o.order_number}</div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#D96C9D]/10 text-[#D96C9D] font-medium">
                  {statusLabel(o.status)}
                </span>
              </div>
              <div className="text-xs text-[#3A2430]/55 mb-3">
                {new Date(o.created_at).toLocaleString("ar-EG")}
              </div>
              <ul className="text-sm space-y-1 mb-3 text-[#3A2430]/80">
                {(o.items ?? []).map((it, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{it.name ?? "منتج"} × {getItemQty(it)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-dashed border-[#F0CCD9] pt-2 flex justify-between text-sm font-semibold text-[#3A2430]">
                <span>الإجمالي</span>
                <span>{Number(o.total).toLocaleString("ar-EG")} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
