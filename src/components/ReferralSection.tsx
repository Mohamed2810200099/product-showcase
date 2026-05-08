import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Gift, Sparkles, Copy, MessageCircle, Check, Wallet, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProfileRow = {
  personal_code: string | null;
  wallet_balance: number | null;
};

export function ReferralSection() {
  const { isAuthenticated, loading, user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Cap auth loading skeleton at 3s
  useEffect(() => {
    if (!loading) { setAuthTimedOut(false); return; }
    const t = setTimeout(() => setAuthTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      setProfile(null);
      setFetching(false);
      return;
    }
    let cancelled = false;
    setFetching(true);
    (async () => {
      const { data } = await supabase
        .from("customer_profiles")
        .select("personal_code, wallet_balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile((data as ProfileRow | null) ?? null);
      setFetching(false);
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading, user]);

  const code = profile?.personal_code ?? "";
  const balance = Number(profile?.wallet_balance ?? 0);
  const friendPct = 15;
  const rewardPct = 10;

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

  const showAuthSkeleton = loading && !authTimedOut;

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
          </div>

          {/* How it works */}
          <div className="mb-8">
            <h3 className="text-center font-display text-xl sm:text-2xl font-bold text-[#3A2430] mb-5">
              ازاي يشتغل البرنامج؟
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <Step n={1} emoji="🎁" title="شاركي كودك" desc="ابعتي كودك لصديقتك على واتساب" />
              <Step n={2} emoji="🛍" title="صديقتك تطلب" desc={`هي بتستخدم كودك وتاخد خصم ${friendPct}% على أول طلب`} />
              <Step n={3} emoji="💰" title="يدخلك رصيد" desc={`${rewardPct}% من قيمة طلبها بيتحط في محفظتك تلقائياً`} />
            </div>
            <p className="text-[11px] text-[#3A2430]/60 text-center mt-4">
              الرصيد بيدخل بعد تسليم الطلب — حد شهري 500 ج.م.
            </p>
          </div>

          {/* Code box / login CTA */}
          {showAuthSkeleton ? (
            <div className="bg-white/60 rounded-2xl border border-white p-6 max-w-md mx-auto animate-pulse">
              <div className="h-6 w-2/3 mx-auto bg-[#F0CCD9]/60 rounded mb-3" />
              <div className="h-10 w-1/2 mx-auto bg-[#F0CCD9]/60 rounded" />
            </div>
          ) : !isAuthenticated ? (
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-white p-6 text-center max-w-md mx-auto">
              <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white">
                <LogIn className="h-6 w-6" />
              </div>
              <p className="text-[#3A2430] font-medium mb-3">سجلي دخولك لعرض كودك</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-6 py-3 font-medium shadow-[0_12px_30px_-10px_rgba(217,108,157,0.6)] transition"
              >
                <LogIn className="h-4 w-4" /> دخول / إنشاء حساب
              </Link>
            </div>
          ) : !profile || !code ? (
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-white p-6 text-center max-w-md mx-auto">
              <div className="h-5 w-5 mx-auto rounded-full border-2 border-[#D96C9D] border-t-transparent animate-spin" />
              <p className="text-sm text-[#3A2430]/70 mt-3">
                {fetching ? "جاري تحميل بياناتك…" : "جاري إنشاء كودك…"}
              </p>
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
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function Step({ n, emoji, title, desc }: { n: number; emoji: string; title: string; desc: string }) {
  return (
    <div className="relative bg-white/70 backdrop-blur rounded-2xl border border-white p-5 text-center">
      <div className="absolute -top-3 right-4 bg-[#D96C9D] text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-md">
        {n}
      </div>
      <div className="text-3xl mb-2">{emoji}</div>
      <h3 className="font-semibold text-[#3A2430] text-sm">{title}</h3>
      <p className="text-xs text-[#3A2430]/65 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}
