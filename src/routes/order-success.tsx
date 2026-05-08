import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle, MessageCircle, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useBrand } from "@/hooks/use-brand";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/order-success")({
  validateSearch: z.object({ order: z.string().optional() }),
  head: () => ({ meta: [{ title: "تم الطلب — The Girl House" }] }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { order } = Route.useSearch();
  const brand = useBrand();
  const { isAuthenticated, loading } = useAuth();

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center bg-card border border-border rounded-3xl p-10 shadow-elegant">
          <div className="h-20 w-20 mx-auto bg-gradient-blush rounded-full flex items-center justify-center mb-5 shadow-soft">
            <CheckCircle className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">تم استلام طلبك! 🎉</h1>
          {order && (
            <div className="mt-3 mb-2 inline-flex flex-col items-center gap-2 bg-secondary/40 border border-border rounded-2xl px-4 py-3 w-full">
              <div className="text-xs text-muted-foreground">رقم الطلب</div>
              <div className="font-mono font-bold text-lg text-foreground" dir="ltr">{order}</div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(order);
                    toast.success("تم نسخ رقم الطلب");
                  } catch {
                    toast.error("تعذّر النسخ");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Copy className="h-3.5 w-3.5" /> نسخ الرقم
              </button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                احفظي رقم الطلب — هتحتاجيه مع رقم الموبايل لتتبّع طلبك من صفحة "طلباتي".
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            شكراً لطلبك من The Girl House 💕<br />
            هنتواصل معاكِ خلال ساعات لتأكيد الطلب وموعد التوصيل.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <a
              href={`https://wa.me/${brand.whatsapp}`}
              target="_blank" rel="noreferrer"
              onClick={() => trackEvent("whatsapp_clicked", { source: "order_success", order_number: order })}
              className="bg-[#25D366] text-white py-2.5 rounded-full text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> تواصلي معنا
            </a>
            <Link to="/shop" className="bg-secondary text-secondary-foreground py-2.5 rounded-full text-sm font-medium hover:bg-accent">
              متابعة التسوق
            </Link>
          </div>

          {!loading && !isAuthenticated && (
            <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-right" dir="rtl">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                <Sparkles className="h-4 w-4 text-primary" /> اعملي حساب لمتابعة طلباتك
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                سجلي حساب علشان تتابعي طلباتك وتحصلي على كود خصم شخصي تشاركيه مع صحباتك ✨
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90"
              >
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>

      </div>
    </PublicLayout>
  );
}
