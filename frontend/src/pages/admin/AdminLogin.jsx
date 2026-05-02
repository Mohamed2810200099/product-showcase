import React, { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const AdminLogin = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blush-500" />
      </div>
    );
  }

  if (user && user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("أهلاً بيكِ");
      navigate("/admin", { replace: true });
    } catch (e) {
      setError(formatApiErrorDetail(e.response?.data?.detail) || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush-50 via-white to-champagne-50 p-4" dir="rtl" data-testid="admin-login-page">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-soft border border-blush-100 p-8">
        <Link to="/" className="block text-center mb-6">
          <span className="font-brand text-3xl text-ink">
            The Girl <span className="italic text-blush-600">House</span>
          </span>
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blush-100 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-blush-600" />
          </div>
          <h1 className="font-display text-2xl text-ink">لوحة الإدارة</h1>
          <p className="text-sm text-ink-muted mt-1">سجّلي دخولك لإدارة المتجر</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-ink-soft mb-1.5 block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-ink-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pr-10 pl-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none"
                placeholder="admin@thegirlhouse.eg"
                data-testid="admin-email"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-ink-soft mb-1.5 block">كلمة السر</label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-ink-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pr-10 pl-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 outline-none"
                data-testid="admin-password"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm" data-testid="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="admin-login-submit"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            تسجيل الدخول
          </button>
        </form>

        <p className="text-xs text-center text-ink-muted mt-6">
          للمساعدة، تواصلي مع الدعم الفني.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
