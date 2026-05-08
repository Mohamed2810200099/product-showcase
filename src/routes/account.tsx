import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Package, Gift, Wallet, LogOut, Copy, Check, MessageCircle, LogIn, Sparkles, Mail, Phone } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي — The Girl House" },
      { name: "description", content: "إدارة حسابك على The Girl House: بياناتك، طلباتك، كود الإحالة، ورصيد محفظتك." },
    ],
  }),
  component: AccountPage,
});

type ProfileData = {
  profile: { personal_code: string; wallet_balance: number; lifetime_credits_earned: number } | null;
  settings: { friend_discount_pct: number; referrer_reward_pct: number; monthly_cap: number; min_redemption: number };
  transactions: Array<{ id: string; amount: number; kind: string; note: string | null; created_at: string }>;
} | null;

function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    (async () => {
      try {
        const { getMyGlowProfile } = await import("@/server/referral.functions");
        const res = await getMyGlowProfile();
        setData(res as ProfileData);
      } catch (e) {
        console.warn("Profile load failed", e);
      }
    })();
  }, [isAuthenticated, loading]);

  const code = data?.profile?.personal_code ?? "";
  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const lifetime = Number(data?.profile?.lifetime_credits_earned ?? 0);
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

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-[#D96C9D] border-t-transparent animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <section dir="rtl" className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-white/80 backdrop-blur rounded-3xl border border-[#F0CCD9] p-8 text-center shadow-[0_30px_60px_-30px_rgba(217,108,157,0.35)]">
            <div className="h-14 w-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white">
              <LogIn className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#3A2430]">سجلي دخولك</h1>
            <p className="text-sm text-[#3A2430]/70 mt-2 mb-5">عشان تقدري تشوفي بياناتك وطلباتك ورصيدك.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-6 py-3 font-medium shadow-[0_12px_30px_-10px_rgba(217,108,157,0.6)] transition"
            >
              <LogIn className="h-4 w-4" /> دخول / إنشاء حساب
            </Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  const displayName = (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || user?.email?.split("@")[0] || "حبيبتي";

  return (
    <PublicLayout>
      <section dir="rtl" className="container mx-auto px-4 py-10 sm:py-14">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#FFF8F4] via-[#F9EEF3] to-[#F8DCE5] p-6 sm:p-10 shadow-[0_30px_60px_-30px_rgba(217,108,157,0.35)] mb-6"
        >
          <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-[#E7A8BF]/30 blur-3xl" />
          <div className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-[#EDE7F6]/60 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white shadow-md">
                <User className="h-7 w-7" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur border border-white px-3 py-0.5 text-[11px] font-medium text-[#3A2430]">
                  <Sparkles className="h-3 w-3 text-[#D96C9D]" /> حسابك
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3A2430] mt-1">أهلاً، {displayName} 💕</h1>
                <p className="text-xs sm:text-sm text-[#3A2430]/65 mt-0.5">سعيدين إنك معانا في The Girl House</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-white/80 hover:bg-white text-[#3A2430] border border-[#F0CCD9] px-4 py-2 text-sm font-medium transition"
            >
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-[#F0CCD9] p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#3A2430] font-semibold mb-3">
              <User className="h-5 w-5 text-[#D96C9D]" /> بياناتك
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-[#3A2430]/80">
                <Mail className="h-4 w-4 text-[#D96C9D]/70" />
                <span dir="ltr" className="break-all">{user?.email}</span>
              </div>
              {(user?.user_metadata as any)?.phone && (
                <div className="flex items-center gap-2 text-[#3A2430]/80">
                  <Phone className="h-4 w-4 text-[#D96C9D]/70" />
                  <span dir="ltr">{(user?.user_metadata as any)?.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-2xl border border-[#F0CCD9] p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#3A2430] font-semibold">
              <Wallet className="h-5 w-5 text-[#D96C9D]" /> رصيدك
            </div>
            <div className="font-display text-3xl font-bold text-[#3A2430] mt-2">
              {balance.toLocaleString("ar-EG")} <span className="text-base font-normal text-[#3A2430]/60">ج.م</span>
            </div>
            <p className="text-xs text-[#3A2430]/60 mt-1">يُصرف تلقائيًا في طلبك الجاي</p>
            <p className="text-[11px] text-[#3A2430]/55 mt-2">إجمالي ما كسبتيه: {lifetime.toLocaleString("ar-EG")} ج.م</p>
          </div>

          {/* Orders link */}
          <div className="bg-white rounded-2xl border border-[#F0CCD9] p-5 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-[#3A2430] font-semibold mb-2">
              <Package className="h-5 w-5 text-[#D96C9D]" /> طلباتك
            </div>
            <p className="text-xs text-[#3A2430]/65 mb-3">تتبعي حالة طلباتك السابقة بسهولة.</p>
            <Link
              to="/orders"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#FFF4F8] border border-[#F0CCD9] hover:bg-[#FCE6EE] text-[#3A2430] px-4 py-2.5 text-sm font-medium transition"
            >
              <Package className="h-4 w-4" /> عرض الطلبات
            </Link>
          </div>
        </div>

        {/* Referral */}
        <div className="mt-5 bg-white rounded-2xl border-2 border-dashed border-[#D96C9D] p-6">
          <div className="flex items-center gap-2 text-[#3A2430] font-semibold">
            <Gift className="h-5 w-5 text-[#D96C9D]" /> كود الإحالة الخاص بيكي
          </div>
          <p className="text-xs text-[#3A2430]/65 mt-1 mb-3">
            ادي صديقتك خصم {friendPct}٪ على أول طلب — وخدي رصيد {rewardPct}٪ في محفظتك.
          </p>
          {!code ? (
            <div className="flex items-center gap-2 text-sm text-[#3A2430]/70">
              <div className="h-4 w-4 rounded-full border-2 border-[#D96C9D] border-t-transparent animate-spin" />
              جاري تجهيز كودك…
            </div>
          ) : (
            <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-center">
              <div dir="ltr" className="font-display text-3xl sm:text-4xl font-bold text-[#D96C9D] tracking-wider text-center sm:text-right bg-[#FFF4F8] rounded-xl px-6 py-4 border border-[#F0CCD9]">
                {code}
              </div>
              <div className="grid grid-cols-2 gap-2">
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
          )}

          {data?.transactions && data.transactions.length > 0 && (
            <div className="mt-5">
              <div className="text-xs font-semibold text-[#3A2430]/70 mb-2">آخر الحركات</div>
              <ul className="space-y-1.5 text-xs text-[#3A2430]/75 max-h-40 overflow-auto">
                {data.transactions.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 border-b border-dashed border-[#F0CCD9] pb-1">
                    <span className="line-clamp-1">{t.note ?? t.kind}</span>
                    <span className={`font-semibold whitespace-nowrap ${Number(t.amount) > 0 ? "text-emerald-600" : "text-[#3A2430]"}`}>
                      {Number(t.amount) > 0 ? "+" : ""}{Number(t.amount).toLocaleString("ar-EG")} ج
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
