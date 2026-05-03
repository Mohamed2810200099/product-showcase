import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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
              slug: data.slug ?? "",
              description: data.description ?? "",
              short_description: data.short_description ?? "",
              price: Number(data.price ?? 0),
              compare_at_price: Number(data.compare_at_price ?? 0),
              sku: data.sku ?? "",
              stock: Number(data.stock ?? 0),
              brand: data.brand ?? "",
              category_id: data.category_id ?? "",
              images: Array.isArray(data.images) ? (data.images as string[]) : [],
              tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
              is_active: !!data.is_active,
              is_featured: !!data.is_featured,
              is_limited: !!data.is_limited,
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
    const payload = {
      name: form.name,
      name_en: form.name_en || null,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      short_description: form.short_description || null,
      price: form.price,
      compare_at_price: form.compare_at_price > 0 ? form.compare_at_price : null,
      sku: form.sku || null,
      stock: form.stock,
      brand: form.brand || null,
      category_id: form.category_id || null,
      images: form.images,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_limited: form.is_limited,
    };

    const { error } = isNew
      ? await supabase.from("products").insert(payload)
      : await supabase.from("products").update(payload).eq("id", id);

    setSaving(false);
    if (error) {
      console.error(error);
      return toast.error(error.message.includes("duplicate") ? "الـ slug مستخدم بالفعل" : "فشل الحفظ");
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
              <Field label="اسم المنتج (عربي) *" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: form.slug || slugify(v) })} />
              <Field label="الاسم بالإنجليزية" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} />
              <Field label="Slug (الرابط)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} className="sm:col-span-2" dir="ltr" />
              <TextArea label="وصف مختصر" value={form.short_description} onChange={(v) => setForm({ ...form, short_description: v })} className="sm:col-span-2" rows={2} />
              <TextArea label="الوصف الكامل" value={form.description} onChange={(v) => setForm({ ...form, description: v })} className="sm:col-span-2" rows={5} />
            </div>
          </Section>

          <Section title="الصور">
            <ImageUploader
              bucket="products"
              value={form.images}
              onChange={(images) => setForm({ ...form, images })}
              max={10}
            />
          </Section>

          <Section title="السعر والمخزون">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="السعر (ج.م) *" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} />
              <Field label="السعر قبل الخصم" type="number" value={String(form.compare_at_price)} onChange={(v) => setForm({ ...form, compare_at_price: Number(v) })} />
              <Field label="المخزون" type="number" value={String(form.stock)} onChange={(v) => setForm({ ...form, stock: Number(v) })} />
              <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} dir="ltr" />
              <Field label="الماركة" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              <Field label="وسوم (مفصولة بفاصلة)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
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
