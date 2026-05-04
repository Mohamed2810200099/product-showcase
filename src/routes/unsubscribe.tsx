import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Loader2 } from "lucide-react";

type Search = { token?: string };

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({ meta: [{ title: "إلغاء الاشتراك — The Girl House" }] }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"loading" | "valid" | "invalid" | "already" | "done" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return setState("invalid");
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setState("invalid");
        else if (d.valid === false && d.reason === "already_unsubscribed") setState("already");
        else if (d.valid) setState("valid");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.success) setState("done");
      else if (d.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-md px-4 py-20 text-center" dir="rtl">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-elegant">
          {state === "loading" && <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />}
          {state === "valid" && (
            <>
              <h1 className="font-display text-2xl font-bold text-primary mb-3">إلغاء الاشتراك من الإيميلات</h1>
              <p className="text-sm text-muted-foreground mb-6">
                هتبطلي تستقبلي إيميلات منا. أكيد عايزة كده؟
              </p>
              <button onClick={confirm} disabled={submitting}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:opacity-90 disabled:opacity-50">
                {submitting ? "جاري التأكيد..." : "تأكيد الإلغاء"}
              </button>
            </>
          )}
          {state === "done" && (
            <>
              <h1 className="font-display text-2xl font-bold text-primary mb-2">تم بنجاح 💌</h1>
              <p className="text-sm text-muted-foreground">مش هتوصلك إيميلات منا تاني. وحشتينا 🌷</p>
            </>
          )}
          {state === "already" && (
            <>
              <h1 className="font-display text-2xl font-bold text-primary mb-2">إنتي ملغية الاشتراك بالفعل</h1>
              <p className="text-sm text-muted-foreground">مش هتوصلك إيميلات منا.</p>
            </>
          )}
          {state === "invalid" && (
            <>
              <h1 className="font-display text-xl font-bold text-destructive mb-2">رابط غير صالح</h1>
              <p className="text-sm text-muted-foreground">الرابط منتهي أو مش صحيح.</p>
            </>
          )}
          {state === "error" && (
            <>
              <h1 className="font-display text-xl font-bold text-destructive mb-2">حصل خطأ</h1>
              <p className="text-sm text-muted-foreground">حاولي تاني بعد شوية.</p>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
