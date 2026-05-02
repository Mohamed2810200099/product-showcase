import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Check, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "التقييمات — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <ReviewsPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

type Review = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  created_at: string;
  products?: { name: string; slug: string } | null;
};

function ReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("reviews").select("*, products(name,slug)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("approved", filter === "approved");
    const { data } = await q;
    setItems((data as Review[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]);

  const approve = async (id: string) => {
    const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", id);
    if (error) return toast.error("فشل");
    toast.success("تم النشر");
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف التقييم؟")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">التقييمات</h1>

      <div className="flex gap-2 mb-4">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
            {f === "pending" ? "قيد المراجعة" : f === "approved" ? "منشورة" : "الكل"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-center text-muted-foreground">جاري التحميل…</p> :
          items.length === 0 ? <p className="text-center text-muted-foreground py-8">مفيش تقييمات</p> :
          items.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold">{r.customer_name}</div>
                  <div className="text-xs text-muted-foreground">على {r.products?.name ?? "—"}</div>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground mb-3">{r.comment}</p>}
              <div className="flex gap-2">
                {!r.approved && (
                  <button onClick={() => approve(r.id)} className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm inline-flex items-center gap-1">
                    <Check className="h-4 w-4" /> نشر
                  </button>
                )}
                <button onClick={() => remove(r.id)} className="bg-destructive/10 text-destructive px-4 py-1.5 rounded-full text-sm inline-flex items-center gap-1">
                  <Trash2 className="h-4 w-4" /> حذف
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
