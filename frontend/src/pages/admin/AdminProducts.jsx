import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Search, X, Loader2, Image as ImageIcon } from "lucide-react";
import { api, formatEGP, formatApiErrorDetail } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";

const emptyForm = {
  name: "", name_ar: "", slug: "", brand: "", category_slug: "",
  concerns: [], short_description: "", description: "",
  benefits: "", how_to_use: "", ingredients: "", suitable_for: "",
  warnings: "", price: 0, old_price: 0, stock: 0, images_text: "",
  is_active: true, is_featured: false, is_best_seller: false,
  is_new_arrival: false, is_offer: false, is_limited: false,
};

const AdminProducts = () => {
  const { categories } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const shopCats = categories.filter((c) => !c.concern);
  const concernsList = categories.filter((c) => c.concern);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: { include_inactive: true, limit: 500 } });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.name_ar || "").includes(search) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing("new");
    setForm(emptyForm);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      ...emptyForm,
      ...p,
      old_price: p.old_price || 0,
      benefits: (p.benefits || []).join("\n"),
      suitable_for: (p.suitable_for || []).join("، "),
      images_text: (p.images || []).join("\n"),
    });
  };

  const close = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const toggleConcern = (slug) => {
    setForm((f) => ({
      ...f,
      concerns: f.concerns.includes(slug)
        ? f.concerns.filter((c) => c !== slug)
        : [...f.concerns, slug],
    }));
  };

  const save = async () => {
    if (!form.name || !form.brand || !form.category_slug || !form.price) {
      return toast.error("الرجاء تعبئة الحقول المطلوبة");
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        old_price: Number(form.old_price) || null,
        stock: Number(form.stock),
        benefits: form.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
        suitable_for: form.suitable_for.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
        images: form.images_text.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      delete payload.images_text;

      if (editing === "new") {
        await api.post("/products", payload);
        toast.success("تم إضافة المنتج");
      } else {
        await api.put(`/products/${editing}`, payload);
        toast.success("تم تحديث المنتج");
      }
      close();
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("هل أنتِ متأكدة من حذف المنتج؟")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("تم الحذف");
      load();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  return (
    <div className="space-y-5" data-testid="admin-products-page">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-1">Products</p>
          <h1 className="font-display text-3xl text-ink">إدارة المنتجات</h1>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-colors"
          data-testid="admin-new-product"
        >
          <Plus className="w-4 h-4" /> منتج جديد
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-ink-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحثي عن منتج..."
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none bg-white"
        />
      </div>

      <div className="bg-white rounded-3xl border border-blush-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blush-50/60">
              <tr className="text-right text-ink-muted">
                <th className="p-4 font-medium">المنتج</th>
                <th className="p-4 font-medium">القسم</th>
                <th className="p-4 font-medium">السعر</th>
                <th className="p-4 font-medium">المخزون</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-ink-muted">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-ink-muted">لا توجد منتجات</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-blush-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || ""}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover bg-blush-50 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-ink line-clamp-1">{p.name_ar || p.name}</p>
                          <p className="text-[11px] text-ink-muted">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-ink-soft">{shopCats.find((c) => c.slug === p.category_slug)?.name_ar || p.category_slug}</td>
                    <td className="p-3 font-semibold text-blush-600">{formatEGP(p.price)}</td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold ${p.stock <= 5 ? "text-rose-600" : "text-emerald-600"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.is_active ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ظاهر</span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-50 text-neutral-700 border">مخفي</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="w-8 h-8 rounded-lg bg-blush-50 hover:bg-blush-100 text-blush-600 flex items-center justify-center"
                          data-testid={`edit-product-${p.slug}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => del(p.id)}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center"
                          data-testid={`delete-product-${p.slug}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={close}>
          <div
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="product-edit-modal"
          >
            <div className="sticky top-0 bg-white border-b border-blush-100 p-5 flex items-center justify-between z-10">
              <h2 className="font-display text-2xl">
                {editing === "new" ? "إضافة منتج جديد" : "تعديل المنتج"}
              </h2>
              <button onClick={close} className="p-2 hover:bg-blush-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="اسم المنتج (إنجليزي)" required>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="prod-name" />
                </Field>
                <Field label="اسم المنتج (عربي)">
                  <input className="input" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
                </Field>
                <Field label="الماركة" required>
                  <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </Field>
                <Field label="القسم" required>
                  <select className="input" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
                    <option value="">اختاري</option>
                    {shopCats.map((c) => <option key={c.slug} value={c.slug}>{c.name_ar}</option>)}
                  </select>
                </Field>
                <Field label="السعر (ج.م)" required>
                  <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="prod-price" />
                </Field>
                <Field label="السعر القديم (اختياري)">
                  <input type="number" className="input" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} />
                </Field>
                <Field label="الكمية المتاحة">
                  <input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </Field>
                <Field label="Slug (تلقائي إذا فارغ)">
                  <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </Field>
              </div>

              <Field label="وصف قصير">
                <input className="input" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              </Field>
              <Field label="الوصف الكامل">
                <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="الفوائد (كل فائدة في سطر)">
                <textarea rows={3} className="input" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
              </Field>
              <Field label="طريقة الاستخدام">
                <textarea rows={2} className="input" value={form.how_to_use} onChange={(e) => setForm({ ...form, how_to_use: e.target.value })} />
              </Field>
              <Field label="المكونات">
                <textarea rows={2} className="input" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
              </Field>
              <Field label="مناسب لـ (فواصل: ،)">
                <input className="input" value={form.suitable_for} onChange={(e) => setForm({ ...form, suitable_for: e.target.value })} />
              </Field>
              <Field label="تحذيرات">
                <input className="input" value={form.warnings} onChange={(e) => setForm({ ...form, warnings: e.target.value })} />
              </Field>

              <Field label="روابط الصور (كل رابط في سطر)">
                <textarea rows={3} className="input" value={form.images_text} onChange={(e) => setForm({ ...form, images_text: e.target.value })} placeholder="https://images.unsplash.com/..." data-testid="prod-images" />
              </Field>

              <div>
                <label className="text-sm text-ink-soft mb-2 block">مشاكل الشعر/البشرة</label>
                <div className="flex flex-wrap gap-2">
                  {concernsList.map((c) => (
                    <button
                      type="button"
                      key={c.slug}
                      onClick={() => toggleConcern(c.slug)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        form.concerns.includes(c.slug)
                          ? "bg-blush-500 text-white border-blush-500"
                          : "bg-white border-blush-200 text-ink-soft"
                      }`}
                    >
                      {c.name_ar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-blush-100">
                {[
                  ["is_active", "ظاهر"],
                  ["is_featured", "مميز"],
                  ["is_best_seller", "الأكثر مبيعًا"],
                  ["is_new_arrival", "وصل حديثًا"],
                  ["is_offer", "عرض"],
                  ["is_limited", "كمية محدودة"],
                ].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[k]}
                      onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
                      className="accent-blush-600"
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-blush-100 p-5 flex gap-3 justify-end">
              <button onClick={close} className="px-6 py-2.5 rounded-full border border-blush-200 text-sm">إلغاء</button>
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-blush-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                data-testid="save-product-btn"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                حفظ المنتج
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 1rem;
          border: 1px solid #F2D3D5;
          border-radius: 0.75rem;
          outline: none;
          background: white;
          font-size: 0.875rem;
        }
        .input:focus {
          border-color: #B76E79;
        }
      `}</style>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="text-sm text-ink-soft mb-1.5 block">
      {label} {required && <span className="text-blush-500">*</span>}
    </label>
    {children}
  </div>
);

export default AdminProducts;
