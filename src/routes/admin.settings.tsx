import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <SettingsPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Brand = {
  whatsapp: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  announcement: string;
  shipping_fee: number;
  free_shipping_threshold: number;
  contact_email: string;
  show_referral_section: boolean;
};

const DEFAULTS: Brand = {
  whatsapp: "",
  instagram: "",
  tiktok: "",
  facebook: "",
  announcement: "",
  shipping_fee: 60,
  free_shipping_threshold: 1500,
  contact_email: "thegirlhouseeg@yahoo.com",
  show_referral_section: false,
};

function SettingsPage() {
  const [brand, setBrand] = useState<Brand>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: brandRow }, { data: refRow }] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "brand").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "show_referral_section").maybeSingle(),
      ]);
      const merged: Brand = { ...DEFAULTS, ...((brandRow?.value as Partial<Brand>) ?? {}) };
      const refVal = refRow?.value as { show_referral_section?: boolean } | boolean | null;
      if (typeof refVal === "boolean") merged.show_referral_section = refVal;
      else if (refVal && typeof refVal === "object") merged.show_referral_section = Boolean(refVal.show_referral_section);
      setBrand(merged);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("settings").upsert({ key: "brand", value: brand }),
      supabase.from("settings").upsert({
        key: "show_referral_section",
        value: { show_referral_section: brand.show_referral_section },
      }),
    ]);
    setSaving(false);
    const error = e1 ?? e2;
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ — حدّثي الصفحة لرؤية التغييرات");
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold mb-6">إعدادات الموقع</h1>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <Field label="بريد التواصل (Support email)" value={brand.contact_email} onChange={(v) => setBrand({ ...brand, contact_email: v })} dir="ltr" />
        <Field label="رقم الواتساب (مع كود الدولة، بدون +). اتركيه فاضي لإخفاء أزرار واتساب" value={brand.whatsapp} onChange={(v) => setBrand({ ...brand, whatsapp: v.replace(/[^0-9]/g, "") })} dir="ltr" />
        <Field label="رابط Instagram (اتركيه فاضي للإخفاء)" value={brand.instagram} onChange={(v) => setBrand({ ...brand, instagram: v })} dir="ltr" />
        <Field label="رابط TikTok (اتركيه فاضي للإخفاء)" value={brand.tiktok} onChange={(v) => setBrand({ ...brand, tiktok: v })} dir="ltr" />
        <Field label="رابط Facebook (اتركيه فاضي للإخفاء)" value={brand.facebook} onChange={(v) => setBrand({ ...brand, facebook: v })} dir="ltr" />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">شريط الإعلانات أعلى الموقع</label>
          <textarea rows={2} value={brand.announcement} onChange={(e) => setBrand({ ...brand, announcement: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="رسوم الشحن (ج.م)" type="number" value={String(brand.shipping_fee)} onChange={(v) => setBrand({ ...brand, shipping_fee: Number(v) })} />
          <Field label="حد الشحن المجاني (ج.م)" type="number" value={String(brand.free_shipping_threshold)} onChange={(v) => setBrand({ ...brand, free_shipping_threshold: Number(v) })} />
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">تفعيل قسم "Share the Glow" في الصفحة الرئيسية</div>
              <div className="text-xs text-muted-foreground mt-0.5">قسم دعوة الصديقات للحصول على خصم</div>
            </div>
            <Switch
              checked={brand.show_referral_section}
              onCheckedChange={(v) => setBrand({ ...brand, show_referral_section: v })}
            />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-medium shadow-elegant disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", dir = "rtl" }: { label: string; value: string; onChange: (v: string) => void; type?: string; dir?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={dir}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
}
