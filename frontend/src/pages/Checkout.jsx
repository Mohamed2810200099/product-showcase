import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ShoppingBag, CreditCard, Wallet, MessageCircle, Tag, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { api, formatEGP, EGYPT_GOVERNORATES, formatApiErrorDetail, resolveImg } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PAYMENT_OPTIONS = [
  { k: "cod", label: "الدفع عند الاستلام", desc: "ادفعي كاش عند استلام الطلب", icon: Wallet },
  { k: "whatsapp", label: "طلب عبر واتساب", desc: "نأكد الطلب معكِ عبر واتساب", icon: MessageCircle },
  { k: "vodafone_cash", label: "فودافون كاش", desc: "تحويل يدوي على الرقم", icon: CreditCard },
  { k: "instapay", label: "إنستاباي", desc: "تحويل يدوي على إنستاباي", icon: CreditCard },
  { k: "stripe", label: "دفع إلكتروني (بطاقة)", desc: "دفع آمن عبر Stripe", icon: CreditCard },
];

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [applying, setApplying] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    governorate: "",
    city: "",
    address: "",
    notes: "",
    payment_method: "cod",
  });

  const enabledPayments = settings?.payment_methods || { cod: true, whatsapp: true };
  const deliveryFee = useMemo(() => {
    if (!form.governorate) return 0;
    const feeMap = settings?.delivery_fees || {};
    const fee = feeMap[form.governorate] ?? settings?.flat_delivery_fee ?? 70;
    const freeThresh = settings?.free_delivery_threshold || 0;
    if (freeThresh && subtotal >= freeThresh) return 0;
    return fee;
  }, [form.governorate, settings, subtotal]);

  const total = Math.max(0, subtotal + deliveryFee - discount);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    try {
      const { data } = await api.post("/coupons/validate", { code: coupon, subtotal });
      setDiscount(data.discount);
      setAppliedCoupon(coupon.toUpperCase());
      toast.success(`تم تطبيق خصم ${formatEGP(data.discount)}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "كود غير صالح");
      setDiscount(0);
      setAppliedCoupon("");
    } finally {
      setApplying(false);
    }
  };

  const validate = () => {
    if (!form.customer_name.trim()) return "الاسم مطلوب";
    if (!/^01\d{9}$/.test(form.phone.trim())) return "رقم تليفون غير صحيح";
    if (!form.governorate) return "اختاري المحافظة";
    if (!form.city.trim()) return "المدينة مطلوبة";
    if (!form.address.trim()) return "العنوان مطلوب";
    if (!form.payment_method) return "اختاري طريقة الدفع";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);
    if (items.length === 0) return toast.error("السلة فارغة");

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          brand: i.brand,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
        })),
        coupon_code: appliedCoupon,
      };
      const { data } = await api.post("/orders", payload);
      clear();
      toast.success("تم استلام طلبك بنجاح");
      navigate(`/order-success/${data.order_number}`);
    } catch (e2) {
      toast.error(formatApiErrorDetail(e2.response?.data?.detail) || "فشل إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-14 h-14 mx-auto text-blush-300 mb-3" />
          <h2 className="font-display text-2xl mb-2">سلتكِ فارغة</h2>
          <button
            onClick={() => navigate("/shop")}
            className="mt-3 px-6 py-3 rounded-full bg-ink text-white"
          >
            تسوقي الآن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-nude-50 py-10 lg:py-14" data-testid="checkout-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-2">
            Checkout
          </p>
          <h1 className="font-display text-3xl lg:text-4xl text-ink">إتمام الطلب</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
            {/* Customer info */}
            <Section title="بيانات التواصل">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="الاسم الكامل" required value={form.customer_name}
                  onChange={(v) => setField("customer_name", v)} testId="checkout-name" />
                <Input label="رقم التليفون" required value={form.phone} type="tel"
                  placeholder="01xxxxxxxxx"
                  onChange={(v) => setField("phone", v)} testId="checkout-phone" />
                <Input label="رقم واتساب (اختياري)" value={form.whatsapp} type="tel"
                  onChange={(v) => setField("whatsapp", v)} />
                <Input label="البريد الإلكتروني (اختياري)" value={form.email} type="email"
                  onChange={(v) => setField("email", v)} />
              </div>
            </Section>

            {/* Address */}
            <Section title="عنوان التوصيل">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-ink-soft mb-1.5 block">المحافظة *</label>
                  <select
                    required
                    value={form.governorate}
                    onChange={(e) => setField("governorate", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none bg-white"
                    data-testid="checkout-governorate"
                  >
                    <option value="">اختاري المحافظة</option>
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <Input label="المدينة / الحي" required value={form.city}
                  onChange={(v) => setField("city", v)} testId="checkout-city" />
              </div>
              <Input label="العنوان التفصيلي" required value={form.address}
                onChange={(v) => setField("address", v)} testId="checkout-address" />
              <div>
                <label className="text-sm text-ink-soft mb-1.5 block">ملاحظات (اختياري)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none bg-white resize-none"
                  placeholder="أي تعليمات خاصة للتوصيل..."
                />
              </div>
            </Section>

            {/* Payment */}
            <Section title="طريقة الدفع">
              <div className="space-y-2">
                {PAYMENT_OPTIONS.filter((o) => enabledPayments[o.k]).map((opt) => {
                  const Icon = opt.icon;
                  const active = form.payment_method === opt.k;
                  return (
                    <label
                      key={opt.k}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        active
                          ? "border-blush-500 bg-blush-50"
                          : "border-blush-100 hover:border-blush-200"
                      }`}
                      data-testid={`payment-${opt.k}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={active}
                        onChange={() => setField("payment_method", opt.k)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active ? "bg-blush-500 text-white" : "bg-blush-50 text-blush-600"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-ink text-sm">{opt.label}</p>
                        <p className="text-xs text-ink-muted">{opt.desc}</p>
                      </div>
                      {active && <Check className="w-5 h-5 text-blush-500" />}
                    </label>
                  );
                })}
              </div>
              {form.payment_method === "stripe" && !enabledPayments.stripe && (
                <p className="text-xs text-rose-600 mt-2">
                  الدفع الإلكتروني بالبطاقة غير مفعّل حاليًا. من فضلك اختاري وسيلة أخرى.
                </p>
              )}
              {form.payment_method === "vodafone_cash" && (
                <div className="mt-3 p-4 bg-champagne-50 border border-champagne-200 rounded-xl text-sm text-ink-soft">
                  رقم فودافون كاش: <strong className="text-ink">{settings.whatsapp_number}</strong> — بعد التحويل ابعتي صورة التحويل على واتساب.
                </div>
              )}
              {form.payment_method === "instapay" && (
                <div className="mt-3 p-4 bg-champagne-50 border border-champagne-200 rounded-xl text-sm text-ink-soft">
                  InstaPay: <strong className="text-ink">thegirlhouse@instapay</strong>
                </div>
              )}
            </Section>
          </div>

          {/* Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-28 bg-white rounded-3xl p-6 border border-blush-100 space-y-4"
            >
              <h3 className="font-display text-xl text-ink border-b border-blush-100 pb-3">
                ملخص الطلب
              </h3>

              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {items.map((i) => (
                  <div key={i.product_id} className="flex gap-3 text-sm">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-blush-50 flex-shrink-0 relative">
                      <img src={resolveImg(i.image)} alt="" className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 bg-ink text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold">
                        {i.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-ink">{i.name_ar || i.name}</p>
                      <p className="text-blush-600 font-semibold">
                        {formatEGP(i.price * i.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="pt-2 border-t border-blush-100">
                <label className="text-sm text-ink-soft mb-1.5 block">كود خصم</label>
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="WELCOME10"
                    className="flex-1 px-3 py-2 rounded-xl border border-blush-200 outline-none text-sm"
                    data-testid="coupon-input"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applying || !coupon}
                    className="px-4 py-2 rounded-xl bg-ink text-white text-sm disabled:opacity-50"
                    data-testid="apply-coupon-btn"
                  >
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {appliedCoupon} مطبّق
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm pt-2 border-t border-blush-100">
                <Row label="المجموع الفرعي" value={formatEGP(subtotal)} />
                <Row
                  label="رسوم التوصيل"
                  value={deliveryFee === 0 ? "مجاني" : formatEGP(deliveryFee)}
                />
                {discount > 0 && (
                  <Row label="الخصم" value={`- ${formatEGP(discount)}`} success />
                )}
              </div>

              <div className="pt-3 border-t border-blush-100 flex justify-between items-baseline">
                <span className="font-display text-lg">الإجمالي</span>
                <span className="text-2xl font-bold text-blush-600">
                  {formatEGP(total)}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="place-order-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...
                  </>
                ) : (
                  "تأكيد الطلب"
                )}
              </button>

              <p className="text-xs text-ink-muted text-center leading-relaxed">
                بتأكيدك للطلب، أنتِ موافقة على شروط الشحن وسياسة الخصوصية.
              </p>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-white rounded-3xl p-6 border border-blush-100 space-y-4">
    <h3 className="font-display text-xl text-ink">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const Input = ({ label, type = "text", value, onChange, required, placeholder, testId }) => (
  <div>
    <label className="text-sm text-ink-soft mb-1.5 block">
      {label} {required && <span className="text-blush-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none bg-white text-sm"
      data-testid={testId}
    />
  </div>
);

const Row = ({ label, value, success }) => (
  <div className="flex justify-between">
    <span className="text-ink-soft">{label}</span>
    <span className={`font-semibold ${success ? "text-emerald-600" : "text-ink"}`}>{value}</span>
  </div>
);

export default Checkout;
