import React, { useState } from "react";
import { Outlet, Link, NavLink, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Settings, LogOut,
  Menu, X, Loader2, Home, MessageSquareQuote, Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const NAV = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, end: true, testId: "admin-nav-dashboard" },
  { to: "/admin/products", label: "المنتجات", icon: Package, testId: "admin-nav-products" },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingCart, testId: "admin-nav-orders" },
  { to: "/admin/reviews", label: "تقييمات المنتجات", icon: Star, testId: "admin-nav-reviews" },
  { to: "/admin/testimonials", label: "شهادات العميلات", icon: MessageSquareQuote, testId: "admin-nav-testimonials" },
  { to: "/admin/coupons", label: "أكواد الخصم", icon: Tag, testId: "admin-nav-coupons" },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings, testId: "admin-nav-settings" },
];

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blush-500" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج");
    navigate("/admin/login", { replace: true });
  };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
      isActive
        ? "bg-blush-500 text-white shadow-soft"
        : "text-ink-soft hover:bg-blush-50 hover:text-blush-600"
    }`;

  return (
    <div className="min-h-screen bg-nude-50" dir="rtl">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-30 glass border-b border-blush-100 p-4 flex items-center justify-between">
        <button onClick={() => setMenuOpen(true)} aria-label="القائمة">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-brand text-xl">Admin Panel</span>
        <button onClick={handleLogout} aria-label="خروج">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 sticky top-0 h-screen bg-white border-l border-blush-100 p-5">
          <Link to="/admin" className="block mb-2">
            <span className="font-brand text-2xl text-ink">
              The Girl <span className="italic text-blush-600">House</span>
            </span>
            <p className="text-[11px] text-champagne-400 tracking-wider font-latin mt-0.5">Admin Panel</p>
          </Link>

          <nav className="flex-1 space-y-1 mt-8">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkCls} data-testid={n.testId}>
                <n.icon className="w-4 h-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-1 pt-4 border-t border-blush-100">
            <Link to="/" target="_blank" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-ink-soft hover:bg-blush-50">
              <Home className="w-4 h-4" />
              عرض المتجر
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-rose-600 hover:bg-rose-50"
              data-testid="admin-logout"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />
            <aside className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 p-5 lg:hidden">
              <div className="flex items-center justify-between mb-6">
                <span className="font-brand text-xl">Admin</span>
                <button onClick={() => setMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {NAV.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={() => setMenuOpen(false)}
                    className={linkCls}
                  >
                    <n.icon className="w-4 h-4" />
                    {n.label}
                  </NavLink>
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
