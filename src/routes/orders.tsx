import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { lookupOrdersByPhone } from "@/server/orders.functions";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Package } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "طلباتي — The Girl House" },
      { name: "description", content: "تتبعي طلباتك من The Girl House عن طريق رقم الموبايل." },
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
  items: Array<{ name?: string; quantity?: number; price?: number }> | null;
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
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (trimmed.length < 6) {
      setError("ادخلي رقم موبايل صحيح");
      return;
    }
    setError(null);
    setLoading(true);
    setSearched(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, created_at, total, items")
      .eq("customer_phone", trimmed)
      .order("created_at", { ascending: false });
    if (error) setError("حصل خطأ، حاولي تاني.");
    setOrders((data as OrderRow[] | null) ?? []);
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-center mb-2">طلباتي</h1>
        <p className="text-center text-muted-foreground mb-8 text-sm">
          ادخلي رقم الموبايل اللي طلبتي بيه عشان تشوفي طلباتك.
        </p>

        <form onSubmit={search} className="flex gap-2 mb-8">
          <Input
            type="tel"
            inputMode="tel"
            dir="ltr"
            placeholder="01xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="mr-2">بحث</span>
          </Button>
        </form>

        {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}

        {searched && !loading && orders.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="mx-auto h-10 w-10 mb-3 opacity-40" />
            مفيش طلبات على الرقم ده.
          </div>
        )}

        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="font-mono text-sm font-semibold" dir="ltr">{o.order_number}</div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {statusLabel(o.status)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                {new Date(o.created_at).toLocaleString("ar-EG")}
              </div>
              <ul className="text-sm space-y-1 mb-3">
                {(o.items ?? []).map((it, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{it.name ?? "منتج"} × {it.quantity ?? 1}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                <span>الإجمالي</span>
                <span>{Number(o.total).toFixed(2)} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
