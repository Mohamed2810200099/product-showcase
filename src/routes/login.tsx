import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: search.redirect ?? "/" });
    });
  }, [navigate, search.redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${search.redirect ?? "/"}`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب! افتحي البريد لتأكيد الإيميل.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("أهلاً بيكي 💕");
        navigate({ to: search.redirect ?? "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ";
      if (msg.includes("Invalid login")) toast.error("البريد أو كلمة السر غلط");
      else if (msg.includes("already registered")) toast.error("الحساب موجود بالفعل، سجلي دخول");
      else if (msg.includes("Email not confirmed")) toast.error("افتحي بريدك وأكدي الإيميل أولاً");
      else toast.error(msg);
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
              {mode === "login" ? "ادخلي على حسابك علشان تكملي الطلب" : "اعملي حساب علشان تتابعي طلباتك ومكافآتك"}
            </p>
          </div>

          <div className="flex bg-secondary rounded-full p-1 mb-6 text-sm">
            <button type="button" onClick={() => setMode("login")} className={`flex-1 py-2 rounded-full transition ${mode === "login" ? "bg-card shadow-soft font-semibold" : "text-muted-foreground"}`}>تسجيل دخول</button>
            <button type="button" onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-full transition ${mode === "signup" ? "bg-card shadow-soft font-semibold" : "text-muted-foreground"}`}>حساب جديد</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">الاسم</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">كلمة السر</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "دخول" : "إنشاء حساب"}
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            <Link to="/" className="hover:text-primary">العودة للرئيسية</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
