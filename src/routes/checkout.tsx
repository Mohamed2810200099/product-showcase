import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useCart } from "@/context/CartContext";
import { useBrand } from "@/hooks/use-brand";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import { CreditCard, Tag, Wallet } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

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
  const [referralInput, setReferralInput] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<{ code: string; discount: number } | null>(null);
  const [glowSettings, setGlowSettings] = useState<{ friend_discount_pct: number; min_redemption: number; max_wallet_per_order_pct: number }>({ friend_discount_pct: 15, min_redemption: 0, max_wallet_per_order_pct: 50 });
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(true);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: user?.email ?? "",
    address: "", city: "", governorate: "القاهرة", notes: "",
  });

  // Load wallet balance directly from customer_profiles (RLS-protected)
  useEffect(() => {
    if (!isAuthenticated || !user) { setWalletBalance(0); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("customer_profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setWalletBalance(Number(data?.wallet_balance ?? 0));
    })();
    // also load glow settings (best-effort)
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "share_the_glow")
        .maybeSingle();
      if (cancelled) return;
      const v = data?.value as { friend_discount_pct?: number; min_redemption?: number; max_wallet_per_order_pct?: number } | null;
      if (v) setGlowSettings({
        friend_discount_pct: v.friend_discount_pct ?? 15,
        min_redemption: v.min_redemption ?? 0,
        max_wallet_per_order_pct: v.max_wallet_per_order_pct ?? 50,
      });
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  if (authLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
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
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const referralDiscount = appliedReferral?.discount ?? 0;
  const discount = couponDiscount + referralDiscount;
  const maxWalletByOrder = Math.floor((subtotal * glowSettings.max_wallet_per_order_pct) / 100);
  const walletApplied = useWallet
    ? Math.min(walletBalance, Math.max(0, subtotal - discount), maxWalletByOrder)
    : 0;
  const total = Math.max(0, subtotal - discount - walletApplied + shipping);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const phone = form.customer_phone.trim();
    if (phone.length < 10 || !/^[0-9+\-\s]+$/.test(phone)) {
      return toast.error("اكتبي رقم الموبايل الأول عشان نتأكد إن الكود صالح ليكي.");
    }
    const { validateCoupon } = await import("@/server/coupons.functions");
    const result = await validateCoupon({
      data: { code, subtotal, phone },
    });
    if (!result.ok) return toast.error(result.error);
    setAppliedCoupon({ code: result.code, discount: result.discount });
    setAppliedReferral(null); // mutually exclusive
    toast.success("تم تطبيق الخصم بنجاح");
  };

  const setPhone = (v: string) => {
    setForm((prev) => {
      if (prev.customer_phone !== v && appliedCoupon) {
        setAppliedCoupon(null);
        toast.info("غيّرتي رقم الموبايل، من فضلك طبّقي كود الخصم تاني.");
      }
      return { ...prev, customer_phone: v };
    });
  };

  const applyReferral = () => {
    const code = referralInput.trim().toUpperCase();
    if (!code) return;
    if (!glowSettings) return toast.error("جاري التحميل…");
    const d = Math.round((subtotal * glowSettings.friend_discount_pct) / 100);
    setAppliedReferral({ code, discount: d });
    setAppliedCoupon(null);
    toast.success(`تم تطبيق كود صديقتك — خصم ${glowSettings.friend_discount_pct}٪`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = (user?.email ?? form.customer_email ?? "").trim();
    const payload = { ...form, customer_email: emailToUse };
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
        referral_code: appliedReferral?.code ?? null,
        use_wallet: useWallet,
        
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
                <Field label="الاسم بالكامل *" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} invalidMessage="من فضلك أدخلي اسمك الكامل" />
                <Field label="رقم الموبايل *" type="tel" value={form.customer_phone} onChange={setPhone} invalidMessage="من فضلك أدخلي رقم موبايلك" />
                {!isAuthenticated && (
                  <Field
                    label="البريد الإلكتروني (اختياري)"
                    type="email"
                    value={form.customer_email}
                    onChange={(v) => setForm({ ...form, customer_email: v })}
                    className="sm:col-span-2"
                  />
                )}

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
                <Field label="المدينة / المنطقة *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} invalidMessage="من فضلك أدخلي مدينتك" />
                <Field label="العنوان بالتفصيل *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} className="sm:col-span-2" invalidMessage="من فضلك أدخلي عنوانك بالتفصيل" />
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
                <li key={it.id} className="flex justify-between gap-2 items-start">
                  <span className="line-clamp-2 leading-snug" title={it.name}>{it.name} × {it.qty}</span>
                  <span className="font-semibold whitespace-nowrap">{formatEGP(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border my-4" />

            <div className="flex gap-2 mb-2">
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

            <div className="flex gap-2 mb-3">
              <input
                placeholder="كود صديقتك (Share the Glow)"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                className="flex-1 bg-background border border-border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" onClick={applyReferral} className="bg-[#FCE6EE] text-[#C95588] px-4 rounded-full text-sm font-medium hover:bg-[#FAD5E1] inline-flex items-center gap-1">
                ✨ تطبيق
              </button>
            </div>

            {isAuthenticated && walletBalance > 0 && (
              <div className="mb-3 p-4 rounded-xl bg-[#FFF8F4] border border-[#F0CCD9]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#D96C9D]" />
                    <div>
                      <div className="text-sm font-semibold text-[#3A2430]">رصيد محفظتك: {formatEGP(walletBalance)}</div>
                      <div className="text-[11px] text-[#3A2430]/65">هل تريدي استخدامه؟ (حد أقصى {glowSettings.max_wallet_per_order_pct}٪ من قيمة الطلب)</div>
                    </div>
                  </div>
                  <Switch checked={useWallet} onCheckedChange={setUseWallet} />
                </div>
              </div>
            )}

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>المجموع الفرعي</dt><dd>{formatEGP(subtotal)}</dd></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-primary"><dt>خصم ({appliedCoupon?.code})</dt><dd>-{formatEGP(couponDiscount)}</dd></div>
              )}
              {referralDiscount > 0 && (
                <div className="flex justify-between text-primary"><dt>خصم صديقتك ({appliedReferral?.code})</dt><dd>-{formatEGP(referralDiscount)}</dd></div>
              )}
              {walletApplied > 0 && (
                <div className="flex justify-between text-red-600"><dt>خصم المحفظة</dt><dd>-{formatEGP(walletApplied)}</dd></div>
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

function Field({ label, value, onChange, type = "text", className = "", invalidMessage }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string; invalidMessage?: string }) {
  const msg = invalidMessage ?? "من فضلك أدخلي هذا الحقل";
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        required={label.includes("*")}
        onInvalid={(e) => e.currentTarget.setCustomValidity(msg)}
        onInput={(e) => e.currentTarget.setCustomValidity("")}
      />
    </div>
  );
}
