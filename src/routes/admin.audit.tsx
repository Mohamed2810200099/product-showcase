import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, ShieldCheck } from "lucide-react";

type AuditRow = {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
};

export const Route = createFileRoute("/admin/audit")({
  component: () => (
    <AdminGuard>
      <AdminLayout>
        <AuditPage />
      </AdminLayout>
    </AdminGuard>
  ),
});

function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("id, created_at, actor_email, action, target_type, target_id, details")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data ?? []) as AuditRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold">سجل الأمان والإجراءات الإدارية</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        آخر 200 إجراء حساس: إلغاء طلبات، استرجاع مخزون، عكس مكافآت الإحالة، حذف نهائي.
      </p>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">لا توجد إجراءات بعد.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-right">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المسؤول</th>
                <th className="p-3">الإجراء</th>
                <th className="p-3">الهدف</th>
                <th className="p-3">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-3 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString("ar-EG")}</td>
                  <td className="p-3 text-xs">{r.actor_email ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{r.action}</td>
                  <td className="p-3 font-mono text-xs">
                    {r.target_type}/{r.target_id?.slice(0, 8)}
                  </td>
                  <td className="p-3 text-xs">
                    <pre className="whitespace-pre-wrap break-all max-w-md">{JSON.stringify(r.details ?? {}, null, 0)}</pre>
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
