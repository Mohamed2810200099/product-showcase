import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "دخول الإدارة — The Girl House" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("أهلاً بيكي 💕");
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ";
      if (msg.includes("Invalid login")) toast.error("البريد أو الباسورد غلط");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/40 via-background to-primary/10 px-4" dir="rtl">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-elegant">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-primary">The Girl House</h1>
          <p className="text-sm text-muted-foreground mt-1">لوحة الإدارة</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium shadow-elegant hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            دخول
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          🔒 يتم منح صلاحيات الإدارة من صاحب المتجر فقط.
        </p>
      </div>
    </div>
  );
}
