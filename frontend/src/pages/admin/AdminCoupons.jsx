import React, { useEffect, useState } from "react";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { api, formatEGP, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const empty = {
  code: "", discount_type: "percent", value: 10,
  min_order: 0, max_uses: 0, is_active: true,
};

const AdminCoupons = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/coupons");
      setList(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code || !form.value) return toast.error("البيانات ناقصة");
    setCreating(true);
    try {
      await api.post("/coupons", {
        ...form,
        value: Number(form.value),
        min_order: Number(form.min_order),
        max_uses: Number(form.max_uses),
      });
      toast.success("تمت الإضافة");
      setForm(empty);
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setCreating(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("هل أنتِ متأكدة؟")) return;
    try {
      await api.delete(`/coupons/${id}`);
      load();
      toast.success("تم الحذف");
    } catch {
      toast.error("فشل الحذف");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl" data-testid="admin-coupons-page">
      <div>
        <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-1">Coupons</p>
        <h1 className="font-display text-3xl text-ink">أكواد الخصم</h1>
      </div>

      {/* New coupon form */}
      <div className="bg-white rounded-3xl p-6 border border-blush-100">
        <h3 className="font-display text-lg mb-4">إضافة كود جديد</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            placeholder="الكود (WELCOME10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm"
            data-testid="new-coupon-code"
          />
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm"
          >
            <option value="percent">نسبة مئوية %</option>
            <option value="fixed">مبلغ ثابت (ج.م)</option>
          </select>
          <input
            type="number"
            placeholder="القيمة"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm"
          />
          <input
            type="number"
            placeholder="أقل طلب (ج.م)"
            value={form.min_order}
            onChange={(e) => setForm({ ...form, min_order: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm"
          />
          <input
            type="number"
            placeholder="الحد الأقصى للاستخدام (0 = لا نهاية)"
            value={form.max_uses}
            onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm"
          />
          <button
            onClick={create}
            disabled={creating}
            className="px-4 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-blush-600 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            data-testid="add-coupon-btn"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-blush-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blush-50/60">
              <tr className="text-right text-ink-muted">
                <th className="p-4 font-medium">الكود</th>
                <th className="p-4 font-medium">الخصم</th>
                <th className="p-4 font-medium">أقل طلب</th>
                <th className="p-4 font-medium">الاستخدام</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-ink-muted">جاري التحميل...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-ink-muted">لا توجد أكواد</td></tr>
              ) : (
                list.map((c) => (
                  <tr key={c.id} className="border-t border-blush-50">
                    <td className="p-3">
                      <span className="inline-flex items-center gap-2 font-mono text-blush-600 font-bold">
                        <Tag className="w-3.5 h-3.5" />
                        {c.code}
                      </span>
                    </td>
                    <td className="p-3">
                      {c.discount_type === "percent" ? `${c.value}%` : formatEGP(c.value)}
                    </td>
                    <td className="p-3">{c.min_order ? formatEGP(c.min_order) : "—"}</td>
                    <td className="p-3 text-xs text-ink-muted">
                      {c.uses || 0} / {c.max_uses || "∞"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => del(c.id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;
