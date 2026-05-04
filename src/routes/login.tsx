import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Search = { redirect?: string; confirmed?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    confirmed: typeof s.confirmed === "string" ? s.confirmed : undefined,
  }),
  head: () => ({ meta: [{ title: "تسجيل الدخول — The Girl House" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const authNoticeShown = useRef(false);

  const safeRedirect = (value?: string) =>
    value?.startsWith("/") && !value.startsWith("//") ? value : "/";
  const redirectTarget = safeRedirect(search.redirect);

  const getEmailRedirectUrl = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://thegirlhouse.life";
    const url = new URL("/login", origin);
    url.searchParams.set("confirmed", "1");
    if (redirectTarget !== "/") url.searchParams.set("redirect", redirectTarget);
    return url.toString();
  };

  const resendConfirmation = async () => {
    if (!email) {
      toast.error("اكتبي البريد الإلكتروني الأول");
      return;
    }
    if (typeof window !== "undefined") localStorage.setItem("tgh_pending_confirm_email", email);
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: getEmailRedirectUrl() },
      });
      if (error) throw error;
      setConfirmMessage(
        "بعتنالك لينك جديد. مهم تفتحي آخر إيميل وصلِك فقط لأن أي لينك قديم ممكن يبقى منتهي.",
      );
      toast.success("بعتنالك الإيميل تاني، شوفي الـ Inbox أو الـ Spam 💌");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirectTarget });
    });
  }, [navigate, redirectTarget]);

  useEffect(() => {
    if (authNoticeShown.current || typeof window === "undefined") return;
    authNoticeShown.current = true;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const linkError = hashParams.get("error_description") || hashParams.get("error");
    const pendingEmail = localStorage.getItem("tgh_pending_confirm_email");
    if (pendingEmail) setEmail(pendingEmail);

    if (linkError) {
      setMode("login");
      setNeedsConfirm(true);
      setConfirmMessage(
        "لينك التأكيد ده قديم أو اتفتح قبل كده. اضغطي إعادة إرسال وافتحي آخر إيميل يوصلِك.",
      );
      toast.error("لينك التأكيد غير صالح، ابعتي لينك جديد وافتحي آخر إيميل");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }

    if (search.confirmed === "1") {
      setMode("login");
      setNeedsConfirm(false);
      toast.success("تم تأكيد الإيميل بنجاح، سجلي دخولك دلوقتي 💕");
      localStorage.removeItem("tgh_pending_confirm_email");
    }
  }, [search.confirmed]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirm(false);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getEmailRedirectUrl(),
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (typeof window !== "undefined") localStorage.setItem("tgh_pending_confirm_email", email);
        setNeedsConfirm(true);
        setConfirmMessage(
          "بعتنالك إيميل تأكيد. بعد ما تضغطي تأكيد، هترجعي هنا تسجلي دخولك وتكملي عادي.",
        );
        toast.success("تم إنشاء الحساب! افتحي البريد لتأكيد الإيميل.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("أهلاً بيكي 💕");
        navigate({ to: redirectTarget });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ";
      if (msg.includes("Invalid login")) toast.error("البريد أو كلمة السر غلط");
      else if (msg.includes("already registered")) toast.error("الحساب موجود بالفعل، سجلي دخول");
      else if (msg.includes("Email not confirmed") || msg.toLowerCase().includes("not confirmed")) {
        setNeedsConfirm(true);
        setConfirmMessage(
          "الإيميل لسه مش متأكد. لو كنتي ضغطتي على لينك قديم، ابعتي لينك جديد وافتحي آخر إيميل وصلِك.",
        );
        if (typeof window !== "undefined") localStorage.setItem("tgh_pending_confirm_email", email);
        toast.error("افتحي بريدك وأكدي الإيميل أولاً");
      } else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-md px-4 py-16" dir="rtl">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-elegant">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold text-primary">
              {mode === "login" ? "تسجيل الدخول" : "حساب جديد"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login"
                ? "ادخلي على حسابك علشان تكملي الطلب"
                : "اعملي حساب علشان تتابعي طلباتك ومكافآتك"}
            </p>
          </div>

          <div className="flex bg-secondary rounded-full p-1 mb-6 text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-full transition ${mode === "login" ? "bg-card shadow-soft font-semibold" : "text-muted-foreground"}`}
            >
              تسجيل دخول
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-full transition ${mode === "signup" ? "bg-card shadow-soft font-semibold" : "text-muted-foreground"}`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">الاسم</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">كلمة السر</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "دخول" : "إنشاء حساب"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> أو <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={async () => {
              const { lovable } = await import("@/integrations/lovable");
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: typeof window !== "undefined" ? window.location.origin + redirectTarget : undefined,
              });
              if (result.error) toast.error("تعذر تسجيل الدخول بـ Google");
              if (!result.redirected && !result.error) navigate({ to: redirectTarget });
            }}
            className="w-full bg-white border border-border py-2.5 rounded-full font-medium inline-flex items-center justify-center gap-2 hover:bg-secondary/50 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            تسجيل الدخول بـ Google
          </button>

          {needsConfirm && (
            <div className="mt-5 p-4 rounded-xl bg-secondary/60 border border-border text-center space-y-2">
              <p className="text-sm text-foreground font-medium">
                بعتنالك إيميل تأكيد على <span className="font-bold">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {confirmMessage ??
                  "لو الإيميل ما وصلش، شوفي مجلد Spam / غير مرغوب فيه أو اضغطي إعادة إرسال."}
              </p>
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={resending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {resending && <Loader2 className="h-4 w-4 animate-spin" />}
                إعادة إرسال إيميل التأكيد
              </button>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground mt-6">
            <Link to="/" className="hover:text-primary">
              العودة للرئيسية
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
