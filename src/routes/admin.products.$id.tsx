import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { handleAdminError } from "@/lib/admin-mutate";

export const Route = createFileRoute("/admin/products/$id")({
  head: () => ({ meta: [{ title: "تعديل منتج — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <ProductForm />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Category = { id: string; name: string };

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\u0600-\u06FFa-z0-9-]/g, "").slice(0, 80) ||
  `product-${Date.now()}`;

function ProductForm() {
  const { id } = useParams({ from: "/admin/products/$id" });
  const navigate = useNavigate();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    name_en: "",
    arabic_title: "",
    slug: "",
    description: "",
    short_description: "",
    price: 0,
    compare_at_price: 0,
    dm_price_eur: 0,
    sku: "",
    stock: 0,
    brand: "",
    category_id: "",
    sub_category: "",
    product_type: "",
    images: [] as string[],
    tags: "",
    order_index: 0,
    key_benefits: "",
    suitable_for: "",
    how_to_use: "",
    key_ingredients: "",
    product_details: "",
    warnings: "",
    source_url: "",
    is_active: true,
    is_featured: false,
    is_limited: false,
    stock_tracking_enabled: false,
    availability_status: "available" as "available" | "out_of_stock" | "coming_soon",
  });

  useEffect(() => {
    supabase.from("categories").select("id,name").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
    if (!isNew) {
      supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setForm({
              name: data.name ?? "",
              name_en: data.name_en ?? "",
              arabic_title: (data as any).arabic_title ?? "",
              slug: data.slug ?? "",
              description: data.description ?? "",
              short_description: data.short_description ?? "",
              price: Number(data.price ?? 0),
              compare_at_price: Number(data.compare_at_price ?? 0),
              dm_price_eur: Number((data as any).dm_price_eur ?? 0),
              sku: data.sku ?? "",
              stock: Number(data.stock ?? 0),
              brand: data.brand ?? "",
              category_id: data.category_id ?? "",
              sub_category: (data as any).sub_category ?? "",
              product_type: (data as any).product_type ?? "",
              images: Array.isArray(data.images) ? (data.images as string[]) : [],
              tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
              order_index: Number((data as any).order_index ?? 0),
              key_benefits: Array.isArray((data as any).key_benefits) ? (data as any).key_benefits.join("\n") : "",
              suitable_for: (data as any).suitable_for ?? "",
              how_to_use: (data as any).how_to_use ?? "",
              key_ingredients: Array.isArray((data as any).key_ingredients) ? (data as any).key_ingredients.join("\n") : "",
              product_details: (data as any).product_details ?? "",
              warnings: (data as any).warnings ?? "",
              source_url: (data as any).source_url ?? "",
              is_active: !!data.is_active,
              is_featured: !!data.is_featured,
              is_limited: !!data.is_limited,
              stock_tracking_enabled: !!(data as any).stock_tracking_enabled,
              availability_status: ((data as any).availability_status ?? "available") as "available" | "out_of_stock" | "coming_soon",
            });
          }
          setLoading(false);
        });
    }
  }, [id, isNew]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price <= 0) return toast.error("الاسم والسعر مطلوبين");

    setSaving(true);
    const splitLines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      name_en: form.name_en || null,
      arabic_title: form.arabic_title || null,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      short_description: form.short_description || null,
      price: form.price,
      compare_at_price: form.compare_at_price > 0 ? form.compare_at_price : null,
      dm_price_eur: form.dm_price_eur > 0 ? form.dm_price_eur : null,
      sku: form.sku || null,
      stock: form.stock,
      brand: form.brand || null,
      category_id: form.category_id || null,
      sub_category: form.sub_category || null,
      product_type: form.product_type || null,
      images: form.images,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      order_index: form.order_index,
      key_benefits: form.key_benefits ? splitLines(form.key_benefits) : null,
      suitable_for: form.suitable_for || null,
      how_to_use: form.how_to_use || null,
      key_ingredients: form.key_ingredients ? splitLines(form.key_ingredients) : null,
      product_details: form.product_details || null,
      warnings: form.warnings || null,
      source_url: form.source_url || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_limited: form.is_limited,
      stock_tracking_enabled: form.stock_tracking_enabled,
      availability_status: form.availability_status,
    } as any;

    // SECURITY: write gated by RLS "Admins manage products" via has_role(auth.uid(),'admin').
    const { error } = isNew
      ? await supabase.from("products").insert(payload)
      : await supabase.from("products").update(payload).eq("id", id);

    setSaving(false);
    if (error) {
      console.error(error);
      if (error.message?.includes("duplicate")) return toast.error("الـ slug مستخدم بالفعل");
      if (handleAdminError(error, "فشل الحفظ")) return;
    }
    toast.success(isNew ? "تم إضافة المنتج" : "تم حفظ التعديلات");
    navigate({ to: "/admin/products" });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <form onSubmit={submit}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="p-2 hover:bg-secondary rounded-full"><ArrowRight className="h-5 w-5" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold">{isNew ? "منتج جديد" : "تعديل المنتج"}</h1>
          </div>
        </div>
        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-medium shadow-elegant disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Section title="المعلومات الأساسية">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="اسم المنتج (ألماني/إنجليزي) *" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: form.slug || slugify(v) })} dir="ltr" />
              <Field label="العنوان بالعربية" value={form.arabic_title} onChange={(v) => setForm({ ...form, arabic_title: v })} />
              <Field label="الاسم بالإنجليزية (اختياري)" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} dir="ltr" />
              <Field label="Slug (الرابط)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} dir="ltr" />
              <TextArea label="وصف مختصر" value={form.short_description} onChange={(v) => setForm({ ...form, short_description: v })} className="sm:col-span-2" rows={2} />
              <TextArea label="الوصف الكامل" value={form.description} onChange={(v) => setForm({ ...form, description: v })} className="sm:col-span-2" rows={4} />
            </div>
          </Section>

          <Section title="الصور (سحب وإفلات لإعادة الترتيب — أول صورة هي الرئيسية)">
            <ImageUploader
              bucket="products"
              value={form.images}
              onChange={(images) => setForm({ ...form, images })}
              max={15}
            />
          </Section>

          <Section title="تفاصيل المنتج للعميلات">
            <div className="grid sm:grid-cols-1 gap-3">
              <TextArea label="الفوائد الرئيسية (سطر لكل فائدة)" value={form.key_benefits} onChange={(v) => setForm({ ...form, key_benefits: v })} rows={5} />
              <TextArea label="مناسب لـ (اكتبي أنواع البشرة/الشعر — يستخدم في فلتر المتجر)" value={form.suitable_for} onChange={(v) => setForm({ ...form, suitable_for: v })} rows={2} />
              <div className="flex flex-wrap gap-1.5 -mt-1">
                {["دهنية","جافة","مختلطة","حساسة","عادية","شعر جاف","شعر دهني","شعر تالف","شعر مصبوغ","كل أنواع الشعر"].map((s) => {
                  const has = form.suitable_for.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => {
                        if (has) {
                          const next = form.suitable_for
                            .split(/[,،]/).map((x) => x.trim()).filter((x) => x && x !== s).join("، ");
                          setForm({ ...form, suitable_for: next });
                        } else {
                          const sep = form.suitable_for.trim() ? "، " : "";
                          setForm({ ...form, suitable_for: form.suitable_for + sep + s });
                        }
                      }}
                      className={`text-[11px] rounded-full px-2.5 py-1 border ${has ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:bg-accent"}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <TextArea label="طريقة الاستخدام" value={form.how_to_use} onChange={(v) => setForm({ ...form, how_to_use: v })} rows={4} />
              <TextArea label="المكونات الفعّالة (سطر لكل مكون)" value={form.key_ingredients} onChange={(v) => setForm({ ...form, key_ingredients: v })} rows={5} />
              <TextArea label="تفاصيل المنتج" value={form.product_details} onChange={(v) => setForm({ ...form, product_details: v })} rows={2} />
              <TextArea label="تحذيرات / ملاحظات" value={form.warnings} onChange={(v) => setForm({ ...form, warnings: v })} rows={3} />
            </div>
          </Section>

          <Section title="السعر والمخزون">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="السعر (ج.م) *" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} />
              <Field label="السعر قبل الخصم" type="number" value={String(form.compare_at_price)} onChange={(v) => setForm({ ...form, compare_at_price: Number(v) })} />
              <Field label="سعر dm الأصلي (€)" type="number" value={String(form.dm_price_eur)} onChange={(v) => setForm({ ...form, dm_price_eur: Number(v) })} />
              <Field label="المخزون" type="number" value={String(form.stock)} onChange={(v) => {
                const n = Number(v);
                setForm((f) => {
                  const next = { ...f, stock: n };
                  if (f.stock_tracking_enabled) {
                    if (n <= 0 && f.availability_status !== "out_of_stock") {
                      next.availability_status = "out_of_stock";
                      toast.message("تم ضبط الحالة على: نفذ المخزون");
                    } else if (n > 0 && f.availability_status === "out_of_stock") {
                      next.availability_status = "available";
                      toast.message("تم إعادة المنتج كمتاح");
                    }
                  }
                  return next;
                });
              }} />
              <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} dir="ltr" />
              <Field label="الماركة" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} dir="ltr" />
              <Field label="التصنيف الفرعي" value={form.sub_category} onChange={(v) => setForm({ ...form, sub_category: v })} dir="ltr" />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">نوع المنتج</label>
                <select
                  value={form.product_type}
                  onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— اختاري —</option>
                  <option value="shampoo">شامبو</option>
                  <option value="conditioner">بلسم</option>
                  <option value="mask">ماسك</option>
                  <option value="oil">زيت</option>
                  <option value="serum">سيروم</option>
                  <option value="cream">كريم</option>
                  <option value="cleanser">غسول</option>
                  <option value="toner">تونر</option>
                  <option value="sunscreen">واقي شمس</option>
                  <option value="makeup">مكياج</option>
                  <option value="treatment">علاج / تريتمنت</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <Field label="ترتيب العرض" type="number" value={String(form.order_index)} onChange={(v) => setForm({ ...form, order_index: Number(v) })} />
              <Field label="وسوم concerns (بفاصلة) — مثل: hair_repair, frizz, glow" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} className="sm:col-span-3" />
              <div className="sm:col-span-3 flex flex-wrap gap-1.5">
                {["hair_repair","hair_growth","frizz","dry_skin","oily_skin","acne","glow","hydration"].map((t) => {
                  const list = form.tags.split(",").map(s => s.trim()).filter(Boolean);
                  const has = list.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        const next = has ? list.filter(x => x !== t) : [...list, t];
                        setForm({ ...form, tags: next.join(", ") });
                      }}
                      className={`text-[11px] rounded-full px-2.5 py-1 border ${has ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:bg-accent"}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <Field label="رابط المصدر (داخلي)" value={form.source_url} onChange={(v) => setForm({ ...form, source_url: v })} className="sm:col-span-3" dir="ltr" />
            </div>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="الفئة">
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— بدون فئة —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Section>

          <Section title="الحالة">
            <Toggle label="منشور (ظاهر للعملاء)" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
            <Toggle label="منتج مميز" checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
            <Toggle label="كمية محدودة" checked={form.is_limited} onChange={(v) => setForm({ ...form, is_limited: v })} />
            <Toggle label="تتبع المخزون" checked={form.stock_tracking_enabled} onChange={(v) => setForm({ ...form, stock_tracking_enabled: v })} />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">حالة التوفر</label>
              <select
                value={form.availability_status}
                onChange={(e) => setForm({ ...form, availability_status: e.target.value as typeof form.availability_status })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="available">متاح</option>
                <option value="out_of_stock">نفذ المخزون</option>
                <option value="coming_soon">قريباً</option>
              </select>
              {form.stock_tracking_enabled && form.stock <= 0 && form.availability_status === "available" && (
                <p className="text-[11px] text-amber-600 mt-1">⚠️ المخزون صفر — يفضّل اختيار "نفذ المخزون"</p>
              )}
            </div>
          </Section>
        </aside>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5">
      <h2 className="font-display text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Field({ label, value, onChange, type = "text", className = "", dir = "rtl" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string; dir?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={dir}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
}
function TextArea({ label, value, onChange, className = "", rows = 3 }: { label: string; value: string; onChange: (v: string) => void; className?: string; rows?: number }) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary h-4 w-4" />
    </label>
  );
}
