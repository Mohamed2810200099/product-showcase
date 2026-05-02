import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Copy, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/media")({
  head: () => ({ meta: [{ title: "مكتبة الصور — لوحة الإدارة" }] }),
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <MediaPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

type FileObj = { name: string; updated_at: string; metadata: { size: number } | null };
const BUCKETS = ["media", "products", "categories", "testimonials"] as const;
type Bucket = typeof BUCKETS[number];
const PUBLIC_URL = (b: string, p: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${b}/${p}`;

function MediaPage() {
  const [bucket, setBucket] = useState<Bucket>("media");
  const [files, setFiles] = useState<FileObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [staged, setStaged] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.storage.from(bucket).list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    setFiles(((data as FileObj[]) ?? []).filter((f) => f.name && !f.name.startsWith(".")));
    setLoading(false);
    setStaged([]);
  };
  useEffect(() => { load(); }, [bucket]);

  const copyUrl = (path: string) => {
    const url = PUBLIC_URL(bucket, path);
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط");
  };

  const remove = async (path: string) => {
    if (!confirm(`حذف "${path}"؟`)) return;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return toast.error("فشل الحذف");
    toast.success("تم الحذف");
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">مكتبة الصور 📸</h1>
      <p className="text-sm text-muted-foreground mb-6">ارفعي وادري كل صور الموقع من هنا</p>

      <div className="flex gap-2 flex-wrap mb-5">
        {BUCKETS.map((b) => (
          <button key={b} onClick={() => setBucket(b)}
            className={`px-4 py-1.5 rounded-full text-sm ${bucket === b ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
            {b === "media" ? "عام / بانرات" : b === "products" ? "منتجات" : b === "categories" ? "فئات" : "آراء"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h2 className="font-display text-lg font-semibold mb-3">رفع صور جديدة</h2>
        <ImageUploader bucket={bucket} value={staged} onChange={(urls) => { setStaged(urls); load(); }} max={20} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">الصور الحالية ({files.length})</h2>
          <button onClick={load} className="text-xs bg-secondary px-3 py-1.5 rounded-full">تحديث</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : files.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">مفيش صور في المكتبة دي</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {files.map((f) => (
              <div key={f.name} className="group relative bg-secondary/30 border border-border rounded-lg overflow-hidden aspect-square">
                <img src={PUBLIC_URL(bucket, f.name)} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                  <button onClick={() => copyUrl(f.name)} className="bg-white text-foreground px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1">
                    <Copy className="h-3 w-3" /> نسخ الرابط
                  </button>
                  <button onClick={() => remove(f.name)} className="bg-destructive text-white px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> حذف
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] p-1.5 truncate">
                  {f.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
