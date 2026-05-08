import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Trash2, Save, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { handleAdminError } from "@/lib/admin-mutate";

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

type EditState = {
  id?: string;
  code: string;
  value: number;
  duration_hours: number; // 0 = no time limit
  max_uses: number; // 0 = no usage limit
};

const blankEdit: EditState = { code: "", value: 10, duration_hours: 0, max_uses: 0 };

function couponStatus(c: Coupon): "active" | "expired" | "inactive" {
  if (!c.active) return "inactive";
  const now = new Date();
  if (c.expires_at && new Date(c.expires_at) < now) return "expired";
  if (c.max_uses && c.used_count >= c.max_uses) return "expired";
  return "active";
}

function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setItems((data as Coupon[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.code) return toast.error("اكتبي اسم الكود");
    if (!editing.value || editing.value <= 0) return toast.error("اكتبي نسبة الخصم");
    const payload = {
      code: editing.code.trim().toUpperCase(),
      type: "percent",
      value: editing.value,
      min_order: 0,
      max_uses: editing.max_uses > 0 ? editing.max_uses : null,
      max_uses_per_customer: 1,
      starts_at: null,
      expires_at: null,
      active: false, // created inactive — admin presses Activate
      first_order_only: false,
      can_stack: false,
      source: "admin",
    };
    const { error } = editing.id
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ — اضغطي تفعيل عشان يبدأ");
    setEditing(null);
    load();
  };

  const activate = async (c: Coupon, hours: number, maxUses: number) => {
    const now = new Date();
    const expires_at = hours > 0 ? new Date(now.getTime() + hours * 3600 * 1000).toISOString() : null;
    const update: Partial<Coupon> = {
      active: true,
      starts_at: now.toISOString(),
      expires_at,
      used_count: 0,
      max_uses: maxUses > 0 ? maxUses : null,
    };
    const { error } = await supabase.from("coupons").update(update).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("تم تفعيل الكوبون 🎉");
    load();
  };

  const deactivate = async (c: Coupon) => {
    await supabase.from("coupons").update({ active: false }).eq("id", c.id);
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
        <button
          onClick={() => setEditing({ ...blankEdit })}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-medium shadow-soft"
        >
          <Plus className="h-4 w-4" /> كوبون جديد
        </button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">{editing.id ? "تعديل" : "كوبون جديد"}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">اسم الكود</label>
              <input
                placeholder="WELCOME10"
                dir="ltr"
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">نسبة الخصم %</label>
              <input
                type="number"
                value={String(editing.value)}
                onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 كل عميل يقدر يستخدم الكود مرة واحدة بس. حدود الوقت/عدد الطلبات بتتظبط لما تضغطي "تفعيل".
          </p>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-full inline-flex items-center gap-2 text-sm">
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button onClick={() => setEditing(null)} className="bg-secondary px-5 py-2 rounded-full text-sm">
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl">مفيش كوبونات</div>
        ) : (
          items.map((c) => <CouponRow key={c.id} c={c} onActivate={activate} onDeactivate={deactivate} onDelete={remove} onEdit={(c) => setEditing({ id: c.id, code: c.code, value: Number(c.value), duration_hours: 0, max_uses: 0 })} />)
        )}
      </div>
    </div>
  );
}

function CouponRow({
  c,
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
}: {
  c: Coupon;
  onActivate: (c: Coupon, hours: number, maxUses: number) => void;
  onDeactivate: (c: Coupon) => void;
  onDelete: (id: string) => void;
  onEdit: (c: Coupon) => void;
}) {
  const status = couponStatus(c);
  const [hours, setHours] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number>(0);

  const remaining = useMemo(() => {
    if (status !== "active" || !c.expires_at) return null;
    const ms = new Date(c.expires_at).getTime() - Date.now();
    if (ms <= 0) return "انتهى";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}س ${m}د`;
  }, [c.expires_at, status]);

  const badge =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "expired"
        ? "bg-rose-100 text-rose-700"
        : "bg-secondary text-muted-foreground";
  const label = status === "active" ? "نشط" : status === "expired" ? "منتهي" : "غير مفعل";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-lg" dir="ltr">{c.code}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${badge}`}>{label}</span>
            <span className="text-sm text-muted-foreground">— خصم {Number(c.value)}%</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
            <span>الاستخدام: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : " / غير محدود"}</span>
            {c.expires_at && <span>ينتهي: {new Date(c.expires_at).toLocaleString("ar-EG")}</span>}
            {remaining && <span>متبقي: {remaining}</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(c)} className="px-3 py-1.5 text-xs bg-secondary rounded-full">تعديل</button>
          <button onClick={() => onDelete(c.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {status === "active" ? (
        <div className="mt-3">
          <button
            onClick={() => onDeactivate(c)}
            className="bg-secondary px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm"
          >
            <Pause className="h-4 w-4" /> إيقاف
          </button>
        </div>
      ) : (
        <div className="mt-3 border-t border-border pt-3">
          <div className="text-xs text-muted-foreground mb-2">إعدادات التفعيل (اختياري — اتركيها 0 لو مش عاوزة حد)</div>
          <div className="grid sm:grid-cols-3 gap-2 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ساعات الصلاحية</label>
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>بدون حد زمني</option>
                <option value={1}>ساعة</option>
                <option value={2}>ساعتين</option>
                <option value={6}>6 ساعات</option>
                <option value={12}>12 ساعة</option>
                <option value={24}>24 ساعة</option>
                <option value={48}>يومين</option>
                <option value={72}>3 أيام</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">أو ساعات مخصصة</label>
              <input
                type="number"
                min={0}
                placeholder="مثال 5"
                value={hours || ""}
                onChange={(e) => setHours(Number(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">حد عدد الطلبات</label>
              <input
                type="number"
                min={0}
                placeholder="مثال 20"
                value={maxUses || ""}
                onChange={(e) => setMaxUses(Number(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => onActivate(c, hours, maxUses)}
            className="mt-3 bg-primary text-primary-foreground px-5 py-2 rounded-full inline-flex items-center gap-2 text-sm font-medium shadow-soft"
          >
            <Play className="h-4 w-4" /> تفعيل
          </button>
        </div>
      )}
    </div>
  );
}
