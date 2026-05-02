import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products/")({
  head: () => ({ meta: [{ title: "المنتجات — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <ProductsList />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  images: unknown;
};

function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id,name,slug,price,stock,is_active,is_featured,images")
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string, name: string) => {
    if (!confirm(`حذف "${name}" نهائياً؟`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error("فشل الحذف");
    toast.success("تم الحذف");
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !current }).eq("id", id);
    if (error) return toast.error("فشل التحديث");
    load();
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">المنتجات</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} منتج</p>
        </div>
        <Link
          to="/admin/products/new"
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-medium shadow-soft hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> منتج جديد
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="ابحثي عن منتج…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-card border border-border rounded-full pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">مفيش منتجات</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-right p-3">الصورة</th>
                <th className="text-right p-3">الاسم</th>
                <th className="text-right p-3">السعر</th>
                <th className="text-right p-3">المخزون</th>
                <th className="text-right p-3">الحالة</th>
                <th className="text-right p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3">
                      {imgs[0] ? (
                        <img src={imgs[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-secondary" />
                      )}
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 whitespace-nowrap">{formatEGP(Number(p.price))}</td>
                    <td className="p-3">
                      <span className={p.stock <= 5 ? "text-destructive font-semibold" : ""}>{p.stock}</span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleActive(p.id, p.is_active)}
                        className={`text-xs px-2 py-1 rounded-full ${
                          p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "نشط" : "مخفي"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Link
                          to="/admin/products/$id"
                          params={{ id: p.id }}
                          className="p-1.5 hover:bg-secondary rounded text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => remove(p.id, p.name)}
                          className="p-1.5 hover:bg-destructive/10 rounded text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
