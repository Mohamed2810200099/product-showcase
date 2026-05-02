import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "الفئات — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <CategoriesPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Category = {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  image: string | null;
  sort_order: number;
};

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\u0600-\u06FFa-z0-9-]/g, "").slice(0, 60) || `cat-${Date.now()}`;

function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setItems((data as Category[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name) return toast.error("الاسم مطلوب");
    const payload = {
      name: editing.name,
      name_en: editing.name_en || null,
      slug: editing.slug || slugify(editing.name),
      image: editing.image || null,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الفئة؟")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error("فشل الحذف");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">الفئات</h1>
        <button onClick={() => setEditing({ name: "", name_en: "", slug: "", image: "", sort_order: items.length })}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-medium shadow-soft">
          <Plus className="h-4 w-4" /> فئة جديدة
        </button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">{editing.id ? "تعديل فئة" : "فئة جديدة"}</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <input placeholder="الاسم *" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="Name (EN)" dir="ltr" value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="slug" dir="ltr" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="ترتيب" type="number" value={String(editing.sort_order ?? 0)} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted-foreground block mb-2">صورة الفئة</label>
            <ImageUploader bucket="categories" multiple={false} max={1}
              value={editing.image ? [editing.image] : []}
              onChange={(urls) => setEditing({ ...editing, image: urls[0] ?? "" })} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-full inline-flex items-center gap-2 text-sm">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={() => setEditing(null)} className="bg-secondary px-5 py-2 rounded-full text-sm">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div> :
          items.length === 0 ? <div className="p-8 text-center text-muted-foreground">مفيش فئات</div> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr><th className="text-right p-3">الصورة</th><th className="text-right p-3">الاسم</th><th className="text-right p-3">Slug</th><th className="text-right p-3">ترتيب</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="p-3">{c.image ? <img src={c.image} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-secondary" />}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground" dir="ltr">{c.slug}</td>
                  <td className="p-3">{c.sort_order}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing(c)} className="px-3 py-1 text-xs bg-secondary rounded-full hover:bg-accent">تعديل</button>
                      <button onClick={() => remove(c.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
