import React, { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { api, EGYPT_GOVERNORATES, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const AdminSettings = () => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get("/settings");
    setForm({
      ...data,
      delivery_fees: data.delivery_fees || {},
      payment_methods: data.payment_methods || {},
    });
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", {
        ...form,
        flat_delivery_fee: Number(form.flat_delivery_fee),
        free_delivery_threshold: Number(form.free_delivery_threshold),
      });
      toast.success("تم حفظ الإعدادات");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="py-20 text-center text-ink-muted">جاري التحميل...</div>;

  const setFee = (gov, val) =>
    setForm((f) => ({ ...f, delivery_fees: { ...f.delivery_fees, [gov]: Number(val) } }));

  const setPayment = (m, val) =>
    setForm((f) => ({ ...f, payment_methods: { ...f.payment_methods, [m]: val } }));

  return (
    <div className="space-y-5 max-w-4xl" data-testid="admin-settings-page">
      <div>
        <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-1">Settings</p>
        <h1 className="font-display text-3xl text-ink">إعدادات المتجر</h1>
      </div>

      <Card title="الصفحة الرئيسية والعلامة التجارية">
        <Field label="شريط الإعلان العلوي">
          <input className="input" value={form.announcement || ""} onChange={(e) => setForm({ ...form, announcement: e.target.value })} data-testid="setting-announcement" />
        </Field>
        <Field label="عنوان الهيرو (عربي)">
          <input className="input" value={form.hero_title || ""} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} />
        </Field>
        <Field label="العنوان الفرعي للهيرو">
          <textarea rows={2} className="input" value={form.hero_subtitle || ""} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} />
        </Field>
        <Field label="صورة الهيرو (URL)">
          <input className="input" value={form.hero_image || ""} onChange={(e) => setForm({ ...form, hero_image: e.target.value })} />
        </Field>
      </Card>

      <Card title="روابط التواصل">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رقم واتساب (بالصيغة الدولية بدون +)">
            <input className="input" value={form.whatsapp_number || ""} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} data-testid="setting-whatsapp" />
          </Field>
          <Field label="Instagram">
            <input className="input" value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </Field>
          <Field label="TikTok">
            <input className="input" value={form.tiktok || ""} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} />
          </Field>
          <Field label="Facebook">
            <input className="input" value={form.facebook || ""} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title="التوصيل">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رسوم التوصيل الافتراضية (ج.م)">
            <input type="number" className="input" value={form.flat_delivery_fee || 0} onChange={(e) => setForm({ ...form, flat_delivery_fee: e.target.value })} />
          </Field>
          <Field label="الحد الأدنى للشحن المجاني (ج.م)">
            <input type="number" className="input" value={form.free_delivery_threshold || 0} onChange={(e) => setForm({ ...form, free_delivery_threshold: e.target.value })} />
          </Field>
        </div>
        <div className="mt-3">
          <p className="text-sm text-ink-soft mb-2">رسوم حسب المحافظة</p>
          <div className="grid sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-blush-50/50 rounded-2xl">
            {EGYPT_GOVERNORATES.map((g) => (
              <div key={g} className="flex items-center gap-2 bg-white p-2 rounded-xl">
                <label className="text-xs flex-1">{g}</label>
                <input
                  type="number"
                  value={form.delivery_fees[g] || ""}
                  onChange={(e) => setFee(g, e.target.value)}
                  className="w-20 px-2 py-1 border border-blush-200 rounded text-xs text-center"
                  placeholder="—"
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="طرق الدفع المفعّلة">
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ["cod", "الدفع عند الاستلام"],
            ["whatsapp", "طلب عبر واتساب"],
            ["vodafone_cash", "فودافون كاش"],
            ["instapay", "إنستاباي"],
            ["stripe", "Stripe (بطاقات)"],
            ["paymob", "Paymob"],
            ["fawry", "فوري"],
          ].map(([k, l]) => (
            <label key={k} className="flex items-center justify-between p-3 bg-blush-50/50 rounded-2xl cursor-pointer">
              <span className="text-sm">{l}</span>
              <input
                type="checkbox"
                checked={!!form.payment_methods[k]}
                onChange={(e) => setPayment(k, e.target.checked)}
                className="accent-blush-600 w-4 h-4"
                data-testid={`setting-payment-${k}`}
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end pb-6">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-colors disabled:opacity-50"
          data-testid="save-settings-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الإعدادات
        </button>
      </div>

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
        .input:focus { border-color: #B76E79; }
      `}</style>
    </div>
  );
};

const Card = ({ title, children }) => (
  <div className="bg-white rounded-3xl p-6 border border-blush-100 space-y-4">
    <h3 className="font-display text-xl text-ink">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="text-sm text-ink-soft mb-1.5 block">{label}</label>
    {children}
  </div>
);

export default AdminSettings;
