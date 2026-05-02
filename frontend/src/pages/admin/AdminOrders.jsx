import React, { useEffect, useState } from "react";
import { Search, Eye, X, Loader2, Phone, MapPin, CreditCard } from "lucide-react";
import { api, formatEGP, STATUS_LABELS, STATUS_COLORS } from "@/lib/api";
import { toast } from "sonner";

const STATUS_FLOW = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(null);
  const [updating, setUpdating] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.order_status = statusFilter;
      const { data } = await api.get("/orders", { params });
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const searchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/orders/${id}/status`, { order_status: status });
      toast.success("تم تحديث الحالة");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, order_status: status } : o)));
      if (open && open.id === id) setOpen({ ...open, order_status: status });
    } catch {
      toast.error("فشل التحديث");
    } finally {
      setUpdating("");
    }
  };

  return (
    <div className="space-y-5" data-testid="admin-orders-page">
      <div>
        <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-1">Orders</p>
        <h1 className="font-display text-3xl text-ink">الطلبات</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        <form onSubmit={searchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="رقم طلب، اسم، تليفون..."
            className="w-full pr-10 pl-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none bg-white"
            data-testid="orders-search"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none bg-white text-sm"
          data-testid="orders-status-filter"
        >
          <option value="">كل الحالات</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-blush-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blush-50/60">
              <tr className="text-right text-ink-muted">
                <th className="p-4 font-medium">الرقم</th>
                <th className="p-4 font-medium">العميل</th>
                <th className="p-4 font-medium">التليفون</th>
                <th className="p-4 font-medium">الإجمالي</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-ink-muted">جاري التحميل...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-ink-muted">لا توجد طلبات</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-blush-50 hover:bg-blush-50/30">
                    <td className="p-3 font-mono text-xs text-blush-600">{o.order_number}</td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3 text-ink-muted">{o.phone}</td>
                    <td className="p-3 font-semibold text-ink">{formatEGP(o.total)}</td>
                    <td className="p-3">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.order_status]}`}>
                        {STATUS_LABELS[o.order_status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setOpen(o)}
                        className="w-8 h-8 rounded-lg bg-blush-50 hover:bg-blush-100 text-blush-600 flex items-center justify-center"
                        data-testid={`view-order-${o.order_number}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="order-detail-modal"
          >
            <div className="sticky top-0 bg-white border-b border-blush-100 p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="font-display text-2xl">طلب {open.order_number}</h2>
                <p className="text-xs text-ink-muted mt-1">
                  {new Date(open.created_at).toLocaleString("ar-EG")}
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="p-2 hover:bg-blush-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status */}
              <div>
                <p className="text-sm text-ink-soft mb-2">الحالة الحالية</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(open.id, s)}
                      disabled={updating === open.id || open.order_status === s}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        open.order_status === s
                          ? "bg-blush-500 text-white border-blush-500"
                          : "bg-white border-blush-200 text-ink-soft hover:border-blush-400"
                      }`}
                      data-testid={`status-${s}`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div className="bg-blush-50/50 rounded-2xl p-4 space-y-2 text-sm">
                <DetailRow icon={Phone} label="العميل" value={`${open.customer_name} — ${open.phone}`} />
                {open.whatsapp && <DetailRow icon={Phone} label="واتساب" value={open.whatsapp} />}
                <DetailRow icon={MapPin} label="العنوان" value={`${open.governorate} - ${open.city} - ${open.address}`} />
                <DetailRow icon={CreditCard} label="الدفع" value={open.payment_method} />
                {open.notes && <DetailRow label="ملاحظات" value={open.notes} />}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-ink mb-2">المنتجات</h3>
                <div className="space-y-2">
                  {open.items.map((i, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-blush-100 rounded-2xl">
                      <img src={i.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-blush-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink line-clamp-1">{i.name}</p>
                        <p className="text-[11px] text-ink-muted">{i.brand}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-ink-muted">x{i.quantity}</p>
                        <p className="text-sm font-semibold text-blush-600">{formatEGP(i.price * i.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white border border-blush-100 rounded-2xl p-4 space-y-2 text-sm">
                <Row label="المجموع الفرعي" value={formatEGP(open.subtotal)} />
                <Row label="التوصيل" value={open.delivery_fee === 0 ? "مجاني" : formatEGP(open.delivery_fee)} />
                {open.discount > 0 && <Row label="الخصم" value={`- ${formatEGP(open.discount)}`} />}
                <div className="flex justify-between pt-2 border-t border-blush-100">
                  <span className="font-display">الإجمالي</span>
                  <span className="text-xl font-bold text-blush-600">{formatEGP(open.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex gap-2">
    {Icon && <Icon className="w-4 h-4 text-ink-muted mt-0.5 flex-shrink-0" />}
    <div>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-ink-soft">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default AdminOrders;
