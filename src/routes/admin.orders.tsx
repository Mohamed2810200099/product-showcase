import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatEGP } from "@/lib/format";
import { Eye, Phone, MapPin, Trash2, X, AlertTriangle, MessageCircle, CheckCircle2 } from "lucide-react";
import { useBrand } from "@/hooks/use-brand";
import { normalizePhone } from "@/lib/phone";
import { getItemQty, getItemPrice, type OrderItemLike } from "@/lib/order-items";
import { toast } from "sonner";
import { handleAdminError } from "@/lib/admin-mutate";
import { formatPhoneDisplay } from "@/lib/phone";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "الطلبات — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <OrdersPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  city: string;
  governorate: string;
  notes: string | null;
  items: unknown;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon_code: string | null;
  status: string;
  payment_method: string;
  created_at: string;
  whatsapp_sent: boolean;
};

const STATUSES = [
  { value: "pending", label: "قيد المراجعة", color: "bg-amber-100 text-amber-700" },
  { value: "confirmed", label: "مؤكد", color: "bg-blue-100 text-blue-700" },
  { value: "shipped", label: "قيد الشحن", color: "bg-indigo-100 text-indigo-700" },
  { value: "delivered", label: "تم التوصيل", color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled", label: "ملغي", color: "bg-rose-100 text-rose-700" },
];

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const previousStatus = orders.find((o) => o.id === id)?.status ?? "pending";
    if (previousStatus === status) return;

    // Block unsafe manual transitions out of terminal/financial states.
    if (previousStatus === "cancelled") {
      return toast.error("الطلب الملغي لا يمكن إعادة فتحه من هنا.");
    }
    if (previousStatus === "delivered" && status !== "delivered") {
      return toast.error("لا يمكن التراجع عن حالة 'تم التوصيل' يدوياً.");
    }

    // Confirmations for status changes that trigger financial side effects.
    if (status === "delivered") {
      if (!confirm("تأكيد التوصيل سيضيف مكافأة الإحالة إن وجدت. هل أنت متأكد؟")) return;
    }
    if (status === "cancelled") {
      if (!confirm("إلغاء الطلب قد يعكس رصيد المحفظة أو مكافأة الإحالة. هل أنت متأكد؟")) return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? null;
    if (!accessToken) {
      return toast.error("انتهت الجلسة، سجّلي دخول من جديد");
    }
    const { updateOrderStatus } = await import("@/server/orders.functions");
    let result: Awaited<ReturnType<typeof updateOrderStatus>>;
    try {
      result = await updateOrderStatus({
        data: { order_id: id, status, access_token: accessToken },
      });
    } catch {
      return toast.error("فشل تحديث الحالة");
    }
    if (!result.ok) {
      return toast.error(result.error ?? "فشل تحديث الحالة");
    }

    // Undo is only safe for transitions WITHOUT financial side effects.
    // delivered/cancelled trigger referral/wallet mutations that aren't
    // cleanly reversible by simply flipping status back.
    const hasFinancialSideEffect = status === "delivered" || status === "cancelled";

    if (result.referral.ran && !result.referral.ok) {
      toast.warning("تم تحديث الحالة، لكن فشلت عملية المكافأة/الاسترجاع. راجعي السجلات.");
    } else if (hasFinancialSideEffect) {
      toast.success("تم تحديث الحالة");
    } else {
      toast.success("تم تحديث الحالة", {
        action: { label: "تراجع", onClick: () => updateStatus(id, previousStatus) },
      });
    }
    if (selected?.id === id) setSelected({ ...selected, status });
    load();
  };

  // SECURITY: Direct deletes from the client are gone. Cancellation goes
  // through updateOrderStatus (restores stock, reverses wallet/referral, audit).
  // Permanent removal is only for already-cancelled orders, via hardDeleteOrder.
  const remove = async (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status !== "cancelled") {
      return toast.error("ألغي الطلب أولاً قبل الحذف النهائي.");
    }
    const typed = window.prompt("للحذف النهائي اكتبي DELETE");
    if (typed !== "DELETE") return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? null;
    if (!accessToken) return toast.error("انتهت الجلسة، سجّلي دخول من جديد");
    const { hardDeleteOrder } = await import("@/server/orders.functions");
    try {
      const res = await hardDeleteOrder({
        data: { order_id: id, access_token: accessToken, confirm: "DELETE" },
      });
      if (!res.ok) return toast.error(res.error ?? "فشل الحذف");
    } catch {
      return toast.error("فشل الحذف");
    }
    toast.success("تم الحذف نهائياً");
    setSelected(null);
    load();
  };

  const toggleWhatsapp = async (id: string, value: boolean) => {
    const { error } = await supabase.from("orders").update({ whatsapp_sent: value }).eq("id", id);
    if (handleAdminError(error, "فشل التحديث")) return;
    toast.success(value ? "تم وضع علامة: تم التواصل عبر واتساب" : "تم إلغاء علامة واتساب");
    if (selected?.id === id) setSelected({ ...selected, whatsapp_sent: value });
    load();
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">الطلبات</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} طلب</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setFilter("all")} className={`px-4 py-1.5 rounded-full text-sm ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>الكل ({orders.length})</button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s.value).length;
          return (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={`px-4 py-1.5 rounded-full text-sm ${filter === s.value ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div> :
          filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">مفيش طلبات</div> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr><th className="text-right p-3">رقم الطلب</th><th className="text-right p-3">العميل</th><th className="text-right p-3">المحافظة</th><th className="text-right p-3">الإجمالي</th><th className="text-right p-3">الحالة</th><th className="text-right p-3">التاريخ</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const status = STATUSES.find((s) => s.value === o.status) ?? STATUSES[0];
                const needsConfirm = o.status === "pending";
                return (
                  <tr key={o.id} className={`border-t border-border hover:bg-secondary/30 ${needsConfirm ? "bg-amber-50/60" : ""}`}>
                    <td className="p-3 font-mono text-xs" dir="ltr">{o.order_number}</td>
                    <td className="p-3">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        {o.customer_name}
                        {needsConfirm && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="h-3 w-3" /> يحتاج تأكيد
                          </span>
                        )}
                        {o.whatsapp_sent && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> واتساب
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{formatPhoneDisplay(o.customer_phone)}</div>
                      {needsConfirm && (
                        <div className="text-[11px] text-amber-700 mt-1">⚠ لا تشحني الطلب قبل التأكيد.</div>
                      )}
                    </td>
                    <td className="p-3 text-xs">{o.governorate}</td>
                    <td className="p-3 font-semibold whitespace-nowrap">{formatEGP(Number(o.total))}</td>
                    <td className="p-3">
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${status.color}`}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3">
                      <button onClick={() => setSelected(o)} className="p-1.5 hover:bg-secondary rounded text-primary">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onDelete={() => remove(selected.id)} onStatus={(s) => updateStatus(selected.id, s)} onToggleWhatsapp={(v) => toggleWhatsapp(selected.id, v)} />}
    </div>
  );
}

function OrderModal({ order, onClose, onDelete, onStatus, onToggleWhatsapp }: { order: Order; onClose: () => void; onDelete: () => void; onStatus: (s: string) => void; onToggleWhatsapp: (v: boolean) => void }) {
  const items: OrderItemLike[] = Array.isArray(order.items) ? (order.items as OrderItemLike[]) : [];
  const brand = useBrand();
  const needsConfirm = order.status === "pending";
  const waNumber = normalizePhone(order.customer_phone).replace(/^0/, "20");
  const waMessage = `مرحباً ${order.customer_name} 👋\nبخصوص طلبك رقم ${order.order_number} من The Girl House.\nالإجمالي: ${formatEGP(Number(order.total))}\nنرجو تأكيد الطلب والعنوان: ${order.governorate} - ${order.city}.\nشكراً لكِ 💕`;
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}` : null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card max-w-2xl w-full rounded-2xl shadow-elegant max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-muted-foreground" dir="ltr">{order.order_number}</div>
            <h2 className="font-display text-xl font-bold">{order.customer_name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          {needsConfirm && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold">يحتاج تأكيد</div>
                <div>لا تشحني الطلب قبل التأكيد.</div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-xs text-muted-foreground">رقم الطلب</div>
                <div className="font-mono" dir="ltr">{order.order_number}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">هاتف العميل</div>
                <div dir="ltr">{formatPhoneDisplay(order.customer_phone)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-full hover:bg-emerald-700">
                  <MessageCircle className="h-4 w-4" /> تواصل عبر واتساب
                </a>
              )}
              <button onClick={() => onToggleWhatsapp(!order.whatsapp_sent)}
                className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border ${order.whatsapp_sent ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-card border-border"}`}>
                <CheckCircle2 className="h-4 w-4" />
                {order.whatsapp_sent ? "تم التواصل عبر واتساب" : "ضع علامة: تم التواصل"}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2"><Phone className="h-4 w-4 text-primary mt-0.5" /><div><div className="text-xs text-muted-foreground">الهاتف</div><div dir="ltr">{formatPhoneDisplay(order.customer_phone)}</div></div></div>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5" /><div><div className="text-xs text-muted-foreground">العنوان</div><div>{order.governorate} - {order.city}</div><div className="text-xs text-muted-foreground">{order.address}</div></div></div>
          </div>
          {order.notes && <div className="bg-secondary/40 rounded-lg p-3 text-sm"><strong>ملاحظات: </strong>{order.notes}</div>}

          <div>
            <h3 className="font-semibold mb-2">المنتجات</h3>
            <ul className="space-y-2">
              {items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 text-sm bg-secondary/30 rounded-lg p-2">
                  {it.image && <img src={it.image} alt="" className="w-10 h-10 rounded object-cover" />}
                  <div className="flex-1">{it.name}</div>
                  <div className="text-muted-foreground">× {getItemQty(it)}</div>
                  <div className="font-semibold">{formatEGP(getItemPrice(it) * getItemQty(it))}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>المجموع</span><span>{formatEGP(Number(order.subtotal))}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-primary"><span>خصم ({order.coupon_code})</span><span>-{formatEGP(Number(order.discount))}</span></div>}
            <div className="flex justify-between"><span>الشحن</span><span>{Number(order.shipping) === 0 ? "مجاناً" : formatEGP(Number(order.shipping))}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>الإجمالي</span><span className="text-primary">{formatEGP(Number(order.total))}</span></div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button key={s.value} onClick={() => onStatus(s.value)}
                className={`text-xs px-3 py-1.5 rounded-full ${order.status === s.value ? "bg-primary text-primary-foreground" : s.color}`}>
                {s.label}
              </button>
            ))}
          </div>

          <button onClick={onDelete} className="w-full bg-destructive/10 text-destructive py-2 rounded-full text-sm inline-flex items-center justify-center gap-2 hover:bg-destructive/20">
            <Trash2 className="h-4 w-4" /> حذف الطلب
          </button>
        </div>
      </div>
    </div>
  );
}
