import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Share2, Sparkles, Copy, X, MessageCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/hooks/use-brand";
import { toast } from "sonner";

function makeCode() {
  const prefix = Math.random() > 0.5 ? "GLOW" : "GIRL";
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

export function ReferralSection() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const brand = useBrand();

  const generate = async () => {
    if (name.trim().length < 2) return toast.error("اكتبي اسمك");
    if (contact.trim().length < 6) return toast.error("اكتبي رقمك أو إيميلك");
    setSubmitting(true);
    let attempts = 0;
    let newCode = makeCode();
    while (attempts < 5) {
      const { error } = await supabase.from("referrals").insert({
        code: newCode,
        referrer_name: name.trim(),
        referrer_contact: contact.trim(),
      });
      if (!error) break;
      newCode = makeCode();
      attempts++;
    }
    setSubmitting(false);
    setCode(newCode);
    toast.success("تم إنشاء كود الإحالة 💕");
  };

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const waText = code ? `مرحبًا 💗\nاستخدمي كود الخصم الخاص بي من The Girl House:\n${code}\nواحصلي على خصم 10% على أول طلب.` : "";

  return (
    <>
      <section dir="ltr" className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#FFF8F4] via-[#F9EEF3] to-[#F8DCE5] p-8 sm:p-12 shadow-[0_30px_60px_-30px_rgba(217,108,157,0.35)]"
        >
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#E7A8BF]/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-[#EDE7F6]/60 blur-3xl" />

          <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div className="space-y-5 text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-white px-4 py-1.5 text-xs font-medium text-[#3A2430]">
                <Sparkles className="h-3.5 w-3.5 text-[#D96C9D]" />
                Loved by beauty lovers in Egypt
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3A2430] leading-tight">
                Share the Glow
              </h2>
              <p dir="rtl" className="text-[#3A2430]/75 max-w-lg mx-auto md:mx-0 leading-relaxed text-right">
                ادي صديقتك خصم 10% على أول طلب، وخدي 10% رصيد بعد ما طلبها يكتمل.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-6 py-3 font-medium shadow-[0_12px_30px_-10px_rgba(217,108,157,0.6)] transition"
                >
                  <Share2 className="h-4 w-4" /> Share &amp; Save 10%
                </button>
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-white text-[#3A2430] px-6 py-3 font-medium hover:bg-white transition"
                >
                  <Gift className="h-4 w-4" /> Invite a Friend
                </button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_25px_60px_-20px_rgba(58,36,48,0.25)] flex flex-col items-center justify-center text-center p-6 motion-reduce:animate-none"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white shadow-[0_10px_24px_-8px_rgba(217,108,157,0.6)] mb-4">
                  <Gift className="h-7 w-7" />
                </div>
                <div dir="rtl" className="font-display text-2xl font-bold text-[#3A2430]">ادي ١٠٪</div>
                <div dir="rtl" className="text-xs tracking-[0.3em] text-[#D96C9D] my-1">·  واحصلي ١٠٪ ·</div>
                <p dir="rtl" className="text-xs text-[#3A2430]/70 mt-2">
                  انتِ وصديقتك بتوفروا على طلبكم الجاي.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#FFF8F4] to-[#FCEEF3] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white shadow-2xl relative"
            >
              <button onClick={() => setOpen(false)} aria-label="إغلاق" className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-white/70">
                <X className="h-4 w-4" />
              </button>
              <div className="text-center mb-5">
                <div className="h-14 w-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white">
                  <Gift className="h-7 w-7" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#3A2430]">شاركي الجمال مع صديقتك</h3>
                <p className="text-sm text-[#3A2430]/70 mt-1">ادي صديقتك خصم 10% على أول طلب، وخدي 10% رصيد بعد ما طلبها يكتمل.</p>
              </div>

              {!code ? (
                <div className="space-y-3">
                  <input
                    value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" maxLength={100}
                    className="w-full bg-white border border-[#F0CCD9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    value={contact} onChange={(e) => setContact(e.target.value)} placeholder="رقم واتساب أو إيميل" maxLength={200}
                    className="w-full bg-white border border-[#F0CCD9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={generate} disabled={submitting}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium shadow-soft hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "جاري الإنشاء…" : "احصلي على كود الإحالة"}
                  </button>
                  <p className="text-[10px] text-[#3A2430]/55 text-center leading-relaxed">
                    المكافأة تُقيد بعد إتمام طلب صديقتك بنجاح. لا تُحتسب على الطلبات الملغية أو المرتجعة.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border-2 border-dashed border-primary p-5 text-center">
                    <div className="text-xs text-[#3A2430]/60 mb-1">كود الإحالة</div>
                    <div dir="ltr" className="font-display text-3xl font-bold text-primary tracking-wider">{code}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={copy} className="bg-white border border-[#F0CCD9] rounded-full py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#FFF4F8]">
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      {copied ? "تم النسخ" : "انسخي الكود"}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="bg-[#25D366] text-white rounded-full py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" /> شاركي على واتساب
                    </a>
                  </div>
                  <a
                    href={`mailto:${brand.contact_email}?subject=${encodeURIComponent("متابعة كود الإحالة " + code)}`}
                    className="block text-center text-xs text-[#3A2430]/60 hover:text-primary"
                  >
                    شاهدي مكافآتك — راسلينا على {brand.contact_email}
                  </a>
                  <p className="text-[10px] text-[#3A2430]/55 text-center leading-relaxed">
                    احتفظي بالكود — هتقدري تتابعي مكافآتك معانا.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
