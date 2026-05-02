import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "آراء العملاء — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <TestimonialsPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

type T = {
  id: string;
  name: string;
  role: string | null;
  text: string;
  image: string | null;
  rating: number;
  active: boolean;
  sort_order: number;
};

function TestimonialsPage() {
  const [items, setItems] = useState<T[]>([]);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*").order("sort_order");
    setItems((data as T[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.text) return toast.error("الاسم والنص مطلوبين");
    const payload = {
      name: editing.name,
      role: editing.role || null,
      text: editing.text,
      image: editing.image || null,
      rating: editing.rating ?? 5,
      active: editing.active ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("testimonials").update(payload).eq("id", editing.id)
      : await supabase.from("testimonials").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف؟")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">آراء العملاء</h1>
        <button onClick={() => setEditing({ name: "", text: "", rating: 5, active: true, sort_order: items.length })}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-medium shadow-soft">
          <Plus className="h-4 w-4" /> رأي جديد
        </button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">{editing.id ? "تعديل" : "جديد"}</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input placeholder="الاسم" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="الوظيفة (اختياري)" value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <textarea placeholder="نص الرأي" rows={3} value={editing.text ?? ""} onChange={(e) => setEditing({ ...editing, text: e.target.value })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input type="number" min={1} max={5} placeholder="التقييم" value={String(editing.rating ?? 5)} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="ترتيب" value={String(editing.sort_order ?? 0)} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="mb-3">
            <label className="text-xs text-muted-foreground block mb-2">صورة العميل</label>
            <ImageUploader bucket="testimonials" multiple={false} max={1}
              value={editing.image ? [editing.image] : []}
              onChange={(urls) => setEditing({ ...editing, image: urls[0] ?? "" })} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer mb-4">
            <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="accent-primary" />
            نشط
          </label>
          <div className="flex gap-2">
            <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-full inline-flex items-center gap-2 text-sm">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={() => setEditing(null)} className="bg-secondary px-5 py-2 rounded-full text-sm">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p>جاري التحميل…</p> : items.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              {t.image ? <img src={t.image} alt="" className="w-12 h-12 rounded-full object-cover" /> :
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold">{t.name[0]}</div>}
              <div>
                <div className="font-semibold">{t.name}</div>
                {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{t.text}</p>
            <div className="flex gap-1">
              <button onClick={() => setEditing(t)} className="px-3 py-1 text-xs bg-secondary rounded-full flex-1">تعديل</button>
              <button onClick={() => remove(t.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
