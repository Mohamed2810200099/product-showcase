import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "كوبونات الخصم — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <CouponsPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  starts_at: string | null;
  active: boolean;
  first_order_only: boolean;
  max_uses_per_customer: number | null;
  can_stack: boolean;
  source: string;
};

function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setItems((data as Coupon[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.code || !editing.type || !editing.value) return toast.error("الكود والنوع والقيمة مطلوبين");
    const payload = {
      code: editing.code.toUpperCase(),
      type: editing.type,
      value: editing.value,
      min_order: editing.min_order ?? 0,
      max_uses: editing.max_uses || null,
      max_uses_per_customer: editing.max_uses_per_customer || null,
      expires_at: editing.expires_at || null,
      starts_at: editing.starts_at || null,
      active: editing.active ?? true,
      first_order_only: editing.first_order_only ?? false,
      can_stack: editing.can_stack ?? false,
      source: editing.source || "admin",
    };
    const { error } = editing.id
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الكوبون؟")) return;
    await supabase.from("coupons").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">كوبونات الخصم</h1>
        <button onClick={() => setEditing({ code: "", type: "percent", value: 10, min_order: 0, active: true })}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-medium shadow-soft">
          <Plus className="h-4 w-4" /> كوبون جديد
        </button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">{editing.id ? "تعديل" : "كوبون جديد"}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="الكود (مثل WELCOME10)" dir="ltr" value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <select value={editing.type ?? "percent"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="percent">نسبة مئوية (%)</option>
              <option value="fixed">قيمة ثابتة (ج.م)</option>
            </select>
            <input type="number" placeholder="القيمة" value={String(editing.value ?? 0)} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="الحد الأدنى للطلب" value={String(editing.min_order ?? 0)} onChange={(e) => setEditing({ ...editing, min_order: Number(e.target.value) })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="حد الاستخدام (اختياري)" value={editing.max_uses ? String(editing.max_uses) : ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="استخدامات لكل عميل" value={editing.max_uses_per_customer ? String(editing.max_uses_per_customer) : ""} onChange={(e) => setEditing({ ...editing, max_uses_per_customer: e.target.value ? Number(e.target.value) : null })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="date" placeholder="تاريخ البدء" value={editing.starts_at ? editing.starts_at.slice(0, 10) : ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value || null })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="date" placeholder="تاريخ الانتهاء" value={editing.expires_at ? editing.expires_at.slice(0, 10) : ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value || null })}
              className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="accent-primary" />
              نشط
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.first_order_only ?? false} onChange={(e) => setEditing({ ...editing, first_order_only: e.target.checked })} className="accent-primary" />
              أول طلب فقط
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.can_stack ?? false} onChange={(e) => setEditing({ ...editing, can_stack: e.target.checked })} className="accent-primary" />
              يمكن دمجه مع خصومات أخرى
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-full inline-flex items-center gap-2 text-sm">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={() => setEditing(null)} className="bg-secondary px-5 py-2 rounded-full text-sm">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div> :
          items.length === 0 ? <div className="p-8 text-center text-muted-foreground">مفيش كوبونات</div> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr><th className="text-right p-3">الكود</th><th className="text-right p-3">القيمة</th><th className="text-right p-3">الاستخدام</th><th className="text-right p-3">الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-mono font-bold" dir="ltr">{c.code}</td>
                  <td className="p-3">{c.type === "percent" ? `${c.value}%` : `${c.value} ج.م`}</td>
                  <td className="p-3 text-xs text-muted-foreground">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                      {c.active ? "نشط" : "متوقف"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing(c)} className="px-3 py-1 text-xs bg-secondary rounded-full">تعديل</button>
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
