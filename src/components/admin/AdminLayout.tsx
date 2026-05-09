import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Tag,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";

const nav = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/categories", label: "الفئات", icon: FolderTree },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/coupons", label: "كوبونات الخصم", icon: Tag },
  { to: "/admin/reviews", label: "التقييمات", icon: Star },
  { to: "/admin/testimonials", label: "آراء العملاء", icon: MessageSquare },
  { to: "/admin/media", label: "مكتبة الصور", icon: ImageIcon },
  { to: "/admin/settings", label: "الإعدادات", icon: SettingsIcon },
  { to: "/admin/audit", label: "سجل الأمان", icon: ShieldCheck },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/admin/login" });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-secondary/30 flex" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 bg-card border-l border-border transform transition-transform lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link to="/admin" className="block">
            <div className="font-display text-xl font-bold text-primary">The Girl House</div>
            <div className="text-xs text-muted-foreground">لوحة الإدارة</div>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-soft"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary"
          >
            ← العودة للموقع
          </Link>
          <button
            onClick={logout}
            className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="p-1">
            <Menu className="h-6 w-6" />
          </button>
          <div className="font-display font-bold text-primary">لوحة الإدارة</div>
          <div className="w-6" />
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
