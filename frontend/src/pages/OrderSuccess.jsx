import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, MessageCircle, Home } from "lucide-react";
import { motion } from "framer-motion";
import { api, formatEGP } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

const OrderSuccess = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const { whatsappLink } = useSettings();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/orders/public/${orderNumber}`);
        setOrder(data);
      } catch {
        setOrder({});
      }
    })();
  }, [orderNumber]);

  const wa = whatsappLink(
    `أهلاً، تم تأكيد طلبي رقم ${orderNumber} 🎀 حابة أتأكد من التفاصيل.`
  );

  return (
    <div className="min-h-screen py-14 bg-gradient-to-br from-blush-50 via-white to-champagne-50" data-testid="order-success-page">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-24 h-24 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-6 shadow-glow"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-4xl lg:text-5xl text-ink mb-2">
            تم استلام طلبك بنجاح
          </h1>
          <p className="text-ink-soft">
            شكرًا ليكِ ❤️ هنتواصل معكِ قريبًا لتأكيد الطلب
          </p>
        </motion.div>

        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-blush-100 shadow-soft space-y-5">
          <div className="text-center pb-5 border-b border-blush-100">
            <p className="text-xs text-ink-muted mb-1">رقم الطلب</p>
            <p className="font-brand text-3xl tracking-wider text-blush-600" data-testid="order-number">
              {orderNumber}
            </p>
          </div>

          {order && order.total !== undefined && (
            <div className="space-y-2 text-sm">
              <Row label="الاسم" value={order.customer_name} />
              <Row label="التليفون" value={order.phone} />
              <Row label="العنوان" value={`${order.governorate} - ${order.city}`} />
              <Row label="طريقة الدفع" value={methodLabel(order.payment_method)} />
              <div className="pt-3 border-t border-blush-100">
                <Row label="المجموع الفرعي" value={formatEGP(order.subtotal)} />
                <Row label="التوصيل" value={order.delivery_fee === 0 ? "مجاني" : formatEGP(order.delivery_fee)} />
                {order.discount > 0 && <Row label="الخصم" value={`- ${formatEGP(order.discount)}`} />}
                <div className="flex justify-between items-baseline pt-2 mt-2 border-t border-blush-100">
                  <span className="font-display text-base">الإجمالي</span>
                  <span className="text-2xl font-bold text-blush-600">
                    {formatEGP(order.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blush-50 rounded-2xl p-4 text-sm text-ink-soft leading-relaxed">
            📦 هنحضر طلبك ونتواصل معكِ خلال 24 ساعة لتأكيد الشحن.
            للاستعجال، تواصلي معنا عبر واتساب.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#25D366] text-white font-semibold hover:bg-emerald-600 transition-colors text-sm"
              data-testid="order-whatsapp-btn"
            >
              <MessageCircle className="w-4 h-4" />
              تواصلي معنا
            </a>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 py-3 rounded-full border-2 border-ink text-ink font-semibold hover:bg-ink hover:text-white transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1">
    <span className="text-ink-muted">{label}</span>
    <span className="text-ink font-medium text-left">{value}</span>
  </div>
);

const methodLabel = (m) => ({
  cod: "الدفع عند الاستلام",
  whatsapp: "طلب عبر واتساب",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  stripe: "بطاقة",
  paymob: "Paymob",
  fawry: "فوري",
}[m] || m);

export default OrderSuccess;
