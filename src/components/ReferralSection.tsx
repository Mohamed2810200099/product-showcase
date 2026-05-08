import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Gift, Share2, Sparkles, Copy, MessageCircle, Check, Wallet, ShoppingBag, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type ProfileData = {
  profile: {
    personal_code: string;
    wallet_balance: number;
    lifetime_credits_earned: number;
  } | null;
  settings: {
    friend_discount_pct: number;
    referrer_reward_pct: number;
    monthly_cap: number;
    min_redemption: number;
  };
  transactions: Array<{ id: string; amount: number; kind: string; note: string | null; created_at: string }>;
} | null;

export function ReferralSection() {
  const { isAuthenticated, loading } = useAuth();
  const [data, setData] = useState<ProfileData>(null);
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setData(null);
      setFetching(false);
      setFetchError(false);
      return;
    }
    let cancelled = false;
    setFetching(true);
    setFetchError(false);
    (async () => {
      try {
        const { getMyGlowProfile } = await import("@/server/referral.functions");
        const res = await getMyGlowProfile();
        if (!cancelled) setData(res as ProfileData);
      } catch (e) {
        console.warn("Glow profile failed", e);
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading]);

  const code = data?.profile?.personal_code ?? "";
  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const friendPct = data?.settings?.friend_discount_pct ?? 15;
  const rewardPct = data?.settings?.referrer_reward_pct ?? 10;

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("تم نسخ الكود 💕");
    setTimeout(() => setCopied(false), 1500);
  };

  const waText = code
    ? `مرحبًا 💗\nاستخدمي كودي على The Girl House واحصلي على خصم ${friendPct}% على أول طلب:\n${code}\n\nاطلبي من هنا: https://thegirlhouse.life`
    : "";

  return (
    <section dir="rtl" className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#FFF8F4] via-[#F9EEF3] to-[#F8DCE5] p-8 sm:p-12 shadow-[0_30px_60px_-30px_rgba(217,108,157,0.35)]"
      >
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#E7A8BF]/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-[#EDE7F6]/60 blur-3xl" />

        <div className="relative">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-white px-4 py-1.5 text-xs font-medium text-[#3A2430]">
              <Sparkles className="h-3.5 w-3.5 text-[#D96C9D]" />
              برنامج Share the Glow ✨
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3A2430] leading-tight mt-3">
              ادي صديقتك {friendPct}٪ — خدي رصيد {rewardPct}٪
            </h2>
            <p className="text-[#3A2430]/75 max-w-xl mx-auto leading-relaxed text-sm sm:text-base mt-3">
              شاركي كودك الشخصي مع صديقاتك. أول ما طلبها يكتمل، يدخلك رصيد في محفظتك تستخدميه على طلبك الجاي.
            </p>
          </div>

          {/* 3 steps */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Step n={1} icon={<Share2 className="h-5 w-5" />} title="شاركي الكود" desc="ابعتي كودك الشخصي لصديقتك على واتساب" />
            <Step n={2} icon={<ShoppingBag className="h-5 w-5" />} title="صديقتك تطلب" desc={`تستخدم كودك وتاخد خصم ${friendPct}٪ على أول طلب`} />
            <Step n={3} icon={<Wallet className="h-5 w-5" />} title="يدخلك رصيد" desc={`${rewardPct}٪ يدخل محفظتك بعد ما طلبها يتسلم`} />
          </div>

          {/* Code box / login CTA */}
          {!isAuthenticated ? (
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-white p-6 text-center max-w-md mx-auto">
              <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white">
                <LogIn className="h-6 w-6" />
              </div>
              <p className="text-[#3A2430] font-medium mb-3">سجلي دخولك علشان نطلعلك كودك الشخصي</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-6 py-3 font-medium shadow-[0_12px_30px_-10px_rgba(217,108,157,0.6)] transition"
              >
                <LogIn className="h-4 w-4" /> دخول / إنشاء حساب
              </Link>
            </div>
          ) : !code ? (
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-white p-6 text-center max-w-md mx-auto">
              <div className="h-5 w-5 mx-auto rounded-full border-2 border-[#D96C9D] border-t-transparent animate-spin" />
              <p className="text-sm text-[#3A2430]/70 mt-3">جاري تجهيز كودك…</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border-2 border-dashed border-[#D96C9D] p-5 text-center">
                <div className="text-xs text-[#3A2430]/60 mb-1 flex items-center justify-center gap-1">
                  <Gift className="h-3.5 w-3.5" /> كودك الشخصي
                </div>
                <div dir="ltr" className="font-display text-3xl sm:text-4xl font-bold text-[#D96C9D] tracking-wider my-2">
                  {code}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={copy}
                    className="bg-[#FFF4F8] border border-[#F0CCD9] rounded-full py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#FCE6EE] transition"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    {copied ? "تم النسخ" : "انسخي الكود"}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] text-white rounded-full py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" /> شاركي على واتساب
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#F0CCD9] p-5">
                <div className="flex items-center gap-2 text-[#3A2430] font-semibold">
                  <Wallet className="h-5 w-5 text-[#D96C9D]" /> رصيدك الحالي
                </div>
                <div className="font-display text-3xl font-bold text-[#3A2430] mt-2">
                  {balance.toLocaleString("ar-EG")} <span className="text-base font-normal text-[#3A2430]/60">ج.م</span>
                </div>
                <p className="text-xs text-[#3A2430]/60 mt-1">يُصرف تلقائيًا في طلبك الجاي</p>
                {data?.transactions && data.transactions.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-xs text-[#3A2430]/70 max-h-24 overflow-auto">
                    {data.transactions.slice(0, 4).map((t) => (
                      <li key={t.id} className="flex justify-between gap-2 border-b border-dashed border-[#F0CCD9] pb-1">
                        <span className="line-clamp-1">{t.note ?? t.kind}</span>
                        <span className={`font-semibold whitespace-nowrap ${Number(t.amount) > 0 ? "text-emerald-600" : "text-[#3A2430]"}`}>
                          {Number(t.amount) > 0 ? "+" : ""}{Number(t.amount).toLocaleString("ar-EG")} ج
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <p className="text-[10px] text-[#3A2430]/55 text-center leading-relaxed mt-6 max-w-xl mx-auto">
            الرصيد يدخل بعد تسليم طلب صديقتك. لا يُحتسب على الطلبات الملغية أو المرتجعة. حد شهري: {data?.settings?.monthly_cap ?? 500} ج.م.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative bg-white/70 backdrop-blur rounded-2xl border border-white p-5 text-center">
      <div className="absolute -top-3 right-4 bg-[#D96C9D] text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-md">
        {n}
      </div>
      <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white">
        {icon}
      </div>
      <h3 className="font-semibold text-[#3A2430] text-sm">{title}</h3>
      <p className="text-xs text-[#3A2430]/65 mt-1">{desc}</p>
    </div>
  );
}
