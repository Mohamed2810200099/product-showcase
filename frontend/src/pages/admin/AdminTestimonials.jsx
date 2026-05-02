import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Loader2, Star, X } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const empty = { name: "", city: "", rating: 5, text: "", is_active: true, order: 0 };

const AdminTestimonials = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/testimonials");
      setList(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing("new"); setForm(empty); };
  const openEdit = (t) => { setEditing(t.id); setForm({ ...t }); };
  const close = () => { setEditing(null); setForm(empty); };

  const save = async () => {
    if (!form.name || !form.text) return toast.error("الاسم والنص مطلوبان");
    setSaving(true);
    try {
      const payload = { ...form, rating: Number(form.rating), order: Number(form.order) };
      if (editing === "new") {
        await api.post("/admin/testimonials", payload);
        toast.success("تمت الإضافة");
      } else {
        await api.put(`/admin/testimonials/${editing}`, payload);
        toast.success("تم الحفظ");
      }
      close();
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("متأكدة من الحذف؟")) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      load();
      toast.success("تم الحذف");
    } catch {
      toast.error("فشل الحذف");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl" data-testid="admin-testimonials-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-1">
            Testimonials
          </p>
          <h1 className="font-display text-3xl text-ink">شهادات العميلات</h1>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-colors"
          data-testid="new-testimonial-btn"
        >
          <Plus className="w-4 h-4" /> شهادة جديدة
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-10 text-center text-ink-muted">جاري التحميل...</div>
        ) : list.length === 0 ? (
          <div className="col-span-full py-10 text-center text-ink-muted">لا توجد شهادات</div>
        ) : (
          list.map((t) => (
            <div key={t.id} className="bg-white border border-blush-100 rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-champagne-400 text-champagne-400" />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(t)}
                    className="w-8 h-8 rounded-lg bg-blush-50 hover:bg-blush-100 text-blush-600 flex items-center justify-center"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => del(t.id)}
                    className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed my-3 line-clamp-3">"{t.text}"</p>
              <div className="flex items-center justify-between text-[11px]">
                <p className="font-semibold text-ink">
                  {t.name} {t.city && <span className="text-ink-muted">— {t.city}</span>}
                </p>
                <span className={`px-2 py-0.5 rounded-full ${t.is_active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-50 text-neutral-600"}`}>
                  {t.is_active ? "ظاهر" : "مخفي"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">{editing === "new" ? "شهادة جديدة" : "تعديل شهادة"}</h2>
              <button onClick={close} className="p-2 hover:bg-blush-50 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="الاسم"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm focus:border-blush-500"
              />
              <input
                placeholder="المدينة"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm focus:border-blush-500"
              />
              <div>
                <p className="text-xs text-ink-soft mb-1">التقييم</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setForm({ ...form, rating: n })}
                    >
                      <Star className={`w-6 h-6 ${n <= form.rating ? "fill-champagne-400 text-champagne-400" : "text-blush-200"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={4}
                placeholder="نص الشهادة"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm resize-none focus:border-blush-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="ترتيب"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-blush-200 outline-none text-sm focus:border-blush-500"
                />
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blush-200 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="accent-blush-600"
                  />
                  ظاهر في الموقع
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={close} className="px-5 py-2 rounded-full border border-blush-200 text-sm">إلغاء</button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-ink text-white text-sm font-semibold hover:bg-blush-600 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
