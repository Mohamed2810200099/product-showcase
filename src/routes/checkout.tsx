import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useCart } from "@/context/CartContext";
import { useBrand } from "@/hooks/use-brand";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import { CreditCard, Tag } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "إتمام الطلب — The Girl House" }] }),
  component: CheckoutPage,
});

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", "الشرقية", "المنوفية",
  "الغربية", "كفر الشيخ", "البحيرة", "الإسماعيلية", "السويس", "بورسعيد", "دمياط",
  "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان",
  "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء",
];

const schema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().min(10).max(20).regex(/^[0-9+\-\s]+$/),
  customer_email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  governorate: z.string().min(2).max(100),
  notes: z.string().max(500).optional(),
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const brand = useBrand();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: user?.email ?? "",
    address: "", city: "", governorate: "القاهرة", notes: "",
  });

  if (authLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-md px-4 py-16 text-center" dir="rtl">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-elegant">
            <h2 className="font-display text-2xl font-bold mb-3">سجلي دخول علشان تكملي الطلب</h2>
            <p className="text-sm text-muted-foreground mb-6">
              لازم يكون عندك حساب علشان نقدر نحفظ طلباتك ونرسلك تأكيد على البريد.
            </p>
            <Link to="/login" search={{ redirect: "/checkout" }} className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:opacity-90">
              تسجيل دخول / إنشاء حساب
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }


  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">سلتك فاضية</p>
          <Link to="/shop" className="text-primary hover:underline">تسوقي الآن</Link>
        </div>
      </PublicLayout>
    );
  }

  const shipping = subtotal >= brand.free_shipping_threshold ? 0 : brand.shipping_fee;
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const { validateCoupon } = await import("@/server/coupons.functions");
    const usedKey = `coupon_used_${code}`;
    const usedCount = Number(localStorage.getItem(usedKey) ?? "0");
    const phone = form.customer_phone.trim();
    const result = await validateCoupon({
      data: {
        code,
        subtotal,
        phone: phone.length >= 6 ? phone : undefined,
      },
    });
    if (!result.ok) return toast.error(result.error);
    // local per-customer guardrail kept as a soft check (server already enforces phone-based use)
    if (usedCount > 0 && phone.length < 6) {
      // no-op, server is authoritative when phone present
    }
    setAppliedCoupon({ code: result.code, discount: result.discount });
    toast.success("تم تطبيق الخصم بنجاح");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, customer_email: user?.email ?? "" };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return toast.error("راجعي البيانات لو سمحتي");

    setSubmitting(true);
    const { createOrder } = await import("@/server/orders.create.functions");
    const result = await createOrder({
      data: {
        ...parsed.data,
        customer_email: parsed.data.customer_email || "",
        items: items.map((it) => ({ product_id: it.id, qty: it.qty })),
        coupon_code: appliedCoupon?.code ?? null,
      },
    });

    setSubmitting(false);

    if (!result.ok) {
      return toast.error(result.error);
    }
    const data = { order_number: result.order_number };

    if (appliedCoupon) {
      const usedKey = `coupon_used_${appliedCoupon.code}`;
      localStorage.setItem(usedKey, String(Number(localStorage.getItem(usedKey) ?? "0") + 1));
    }
    localStorage.setItem("tgh_has_ordered", "1");

    // Send branded order confirmation email (best-effort, non-blocking)
    const emailToUse = user?.email ?? "";
    if (emailToUse) {
      try {
        const { sendTransactionalEmail } = await import("@/lib/email/send");
        await sendTransactionalEmail({
          templateName: "order-confirmation",
          recipientEmail: emailToUse,
          idempotencyKey: `order-${data.order_number}`,
          templateData: {
            customerName: form.customer_name,
            orderNumber: data.order_number,
            items: items.map((it) => ({ name: it.name, qty: it.qty, price: it.price })),
            subtotal,
            discount,
            shipping,
            total,
            address: form.address,
            governorate: form.governorate,
            city: form.city,
            phone: form.customer_phone,
          },
        });
      } catch (err) {
        console.warn("Order email failed", err);
      }
    }

    clear();
    navigate({ to: "/order-success", search: { order: data.order_number } });
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-8">إتمام الطلب</h1>
        <form onSubmit={submit} className="grid md:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-4">بيانات التوصيل</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="الاسم بالكامل *" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
                <Field label="رقم الموبايل *" type="tel" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} />
                
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">المحافظة *</label>
                  <select
                    value={form.governorate}
                    onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {governorates.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <Field label="المدينة / المنطقة *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="العنوان بالتفصيل *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="sm:col-span-2" />
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1">ملاحظات (اختياري)</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> طريقة الدفع
              </h2>
              <div className="bg-secondary/40 border border-border rounded-xl p-4 flex items-center gap-3">
                <input type="radio" checked readOnly className="accent-primary" />
                <div>
                  <div className="font-semibold">الدفع عند الاستلام</div>
                  <div className="text-xs text-muted-foreground">ادفعي نقداً عند استلام الطلب</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">طرق دفع إضافية (Paymob/Fawry/Stripe) قريباً 💳</p>
            </section>
          </div>

          <aside className="bg-card border border-border rounded-2xl p-5 h-fit md:sticky md:top-28">
            <h2 className="font-display text-xl font-bold mb-4">طلبك ({items.length})</h2>
            <ul className="space-y-2 text-sm max-h-60 overflow-auto">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1">{it.name} × {it.qty}</span>
                  <span className="font-semibold whitespace-nowrap">{formatEGP(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border my-4" />

            <div className="flex gap-2 mb-3">
              <input
                placeholder="كود الخصم"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="flex-1 bg-background border border-border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" onClick={applyCoupon} className="bg-secondary text-secondary-foreground px-4 rounded-full text-sm font-medium hover:bg-accent inline-flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> تطبيق
              </button>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>المجموع</dt><dd>{formatEGP(subtotal)}</dd></div>
              {discount > 0 && (
                <div className="flex justify-between text-primary"><dt>خصم ({appliedCoupon?.code})</dt><dd>-{formatEGP(discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt>الشحن</dt><dd>{shipping === 0 ? "مجاناً" : formatEGP(shipping)}</dd></div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <dt>الإجمالي</dt><dd className="text-primary">{formatEGP(total)}</dd>
              </div>
            </dl>

            <button type="submit" disabled={submitting} className="mt-5 w-full bg-primary text-primary-foreground py-3 rounded-full font-medium shadow-elegant hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {submitting ? "جاري التأكيد…" : "تأكيد الطلب"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              هنبعتلك تأكيد الطلب على إيميلك فوراً ✨
            </p>
          </aside>
        </form>
      </div>
    </PublicLayout>
  );
}

function Field({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        required={label.includes("*")}
      />
    </div>
  );
}
