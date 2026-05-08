import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Package, Wallet, LogOut, Copy, Check, LogIn, Sparkles, Mail, Gift } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/server/orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي — The Girl House" },
      { name: "description", content: "إدارة حسابك على The Girl House: بياناتك، طلباتك، رصيدك، وكودك الشخصي." },
    ],
  }),
  component: AccountPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  items: import("@/lib/order-items").OrderItemLike[] | null;
};

type AccountData = {
  profile: {
    display_name: string | null;
    personal_code: string | null;
    wallet_balance: number;
    lifetime_credits_earned: number;
    phone: string | null;
  } | null;
  orders: OrderRow[];
} | null;

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };
  return m[s] ?? s;
}

function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AccountData>(null);
  const [fetching, setFetching] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) { setData(null); return; }
    let cancelled = false;
    setFetching(true);
    (async () => {
      try {
        const [{ data: profile }, { data: orders }] = await Promise.all([
          supabase
            .from("customer_profiles")
            .select("display_name, personal_code, wallet_balance, lifetime_credits_earned, phone")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("orders")
            .select("id, order_number, status, created_at, total, items")
            .eq("customer_user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        if (!cancelled) setData({ profile: (profile as any) ?? null, orders: (orders as any) ?? [] });
      } catch (e) {
        console.warn("Account load failed", e);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading, user]);

  const code = data?.profile?.personal_code ?? "";
  const balance = Number(data?.profile?.wallet_balance ?? 0);
  const orders = data?.orders ?? [];

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("تم نسخ الكود 💕");
    setTimeout(() => setCopied(false), 1500);
  };

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
            <p className="text-sm text-[#3A2430]/70 mt-2 mb-5">سجلي دخولك عشان تشوفي بياناتك وطلباتك.</p>
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

  const displayName = data?.profile?.display_name || (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "حبيبتي";

  return (
    <PublicLayout>
      <section dir="rtl" className="container mx-auto px-4 py-10 sm:py-14">
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
                <p className="text-xs sm:text-sm text-[#3A2430]/65 mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> <span dir="ltr">{user?.email}</span>
                </p>
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

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Wallet */}
          <div className="bg-white rounded-2xl border border-[#F0CCD9] p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#3A2430] font-semibold">
              <Wallet className="h-5 w-5 text-[#D96C9D]" /> رصيد المحفظة
            </div>
            <div className="font-display text-3xl font-bold text-[#3A2430] mt-2">
              {balance.toLocaleString("ar-EG")} <span className="text-base font-normal text-[#3A2430]/60">ج.م</span>
            </div>
            <p className="text-xs text-[#3A2430]/60 mt-1">يُصرف تلقائيًا في طلبك الجاي</p>
          </div>

          {/* Personal code */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#D96C9D] p-5">
            <div className="flex items-center gap-2 text-[#3A2430] font-semibold mb-2">
              <Gift className="h-5 w-5 text-[#D96C9D]" /> كودك الشخصي
            </div>
            {fetching && !code ? (
              <div className="h-5 w-5 rounded-full border-2 border-[#D96C9D] border-t-transparent animate-spin" />
            ) : code ? (
              <div className="flex items-center gap-3">
                <div dir="ltr" className="font-display text-2xl sm:text-3xl font-bold text-[#D96C9D] tracking-wider bg-[#FFF4F8] rounded-xl px-4 py-2 border border-[#F0CCD9] flex-1 text-center">
                  {code}
                </div>
                <button
                  onClick={copy}
                  aria-label="انسخي الكود"
                  className="bg-[#FFF4F8] border border-[#F0CCD9] rounded-full p-2.5 hover:bg-[#FCE6EE] transition"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-[#D96C9D]" />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#3A2430]/70">كودك لسه مش جاهز.</p>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl border border-[#F0CCD9] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-[#3A2430] font-semibold">
              <Package className="h-5 w-5 text-[#D96C9D]" /> طلباتي
            </div>
            <Link to="/orders" className="text-xs text-[#D96C9D] hover:underline">عرض الكل</Link>
          </div>

          {fetching && orders.length === 0 ? (
            <div className="py-10 text-center text-[#3A2430]/60 text-sm">جاري تحميل طلباتك…</div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-[#3A2430]/60">
              <Package className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">لسه مفيش طلبات.</p>
              <Link to="/shop" className="inline-block mt-3 text-sm text-[#D96C9D] hover:underline">ابدئي التسوق</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-[#F0CCD9]/60 bg-[#FFF8F4]/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-sm font-semibold text-[#3A2430]" dir="ltr">{o.order_number}</div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#D96C9D]/10 text-[#D96C9D] font-medium">
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#3A2430]/55 mt-1">
                    {new Date(o.created_at).toLocaleString("ar-EG")}
                  </div>
                  <div className="mt-2 pt-2 border-t border-dashed border-[#F0CCD9] flex justify-between text-sm">
                    <span className="text-[#3A2430]/70">الإجمالي</span>
                    <span className="font-semibold text-[#3A2430]">{Number(o.total).toLocaleString("ar-EG")} ج.م</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
