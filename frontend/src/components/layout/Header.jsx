import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, Heart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const { count, setDrawerOpen } = useCart();
  const { categories } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const shopCats = categories.filter((c) => !c.concern).slice(0, 6);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/shop?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const navLink = ({ isActive }) =>
    `relative py-2 text-sm font-medium transition-colors hover:text-blush-600 ${
      isActive ? "text-blush-600" : "text-ink-soft"
    }`;

  return (
    <header className="sticky top-0 z-40 glass border-b border-blush-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 lg:h-20 flex items-center justify-between gap-4">
          {/* Mobile menu */}
          <button
            className="lg:hidden p-2 text-ink"
            onClick={() => setMenuOpen(true)}
            aria-label="القائمة"
            data-testid="mobile-menu-button"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <span className="font-brand text-3xl lg:text-4xl tracking-tight text-ink">
              The Girl <span className="italic text-blush-600">House</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            <NavLink to="/" end className={navLink} data-testid="nav-home">الرئيسية</NavLink>
            <NavLink to="/shop" className={navLink} data-testid="nav-shop">المتجر</NavLink>
            {shopCats.slice(0, 4).map((c) => (
              <NavLink
                key={c.slug}
                to={`/shop?category=${c.slug}`}
                className={navLink}
                data-testid={`nav-cat-${c.slug}`}
              >
                {c.name_ar}
              </NavLink>
            ))}
            <NavLink to="/shop?is_offer=true" className={navLink} data-testid="nav-offers">
              عروض
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="p-2 text-ink hover:text-blush-600 transition-colors"
              aria-label="بحث"
              data-testid="search-toggle"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2 text-ink hover:text-blush-600 transition-colors"
              aria-label="السلة"
              data-testid="open-cart-button"
            >
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blush-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.form
              onSubmit={submitSearch}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-4">
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحثي عن منتج..."
                  className="w-full px-4 py-3 rounded-xl border border-blush-200 focus:border-blush-500 focus:outline-none bg-white"
                  data-testid="search-input"
                />
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85%] bg-white z-50 flex flex-col"
              data-testid="mobile-menu"
            >
              <div className="flex items-center justify-between p-4 border-b border-blush-100">
                <span className="font-brand text-2xl">القائمة</span>
                <button onClick={() => setMenuOpen(false)} className="p-2" aria-label="إغلاق">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <Link to="/" onClick={() => setMenuOpen(false)} className="block py-3 border-b border-blush-50">الرئيسية</Link>
                <Link to="/shop" onClick={() => setMenuOpen(false)} className="block py-3 border-b border-blush-50">كل المنتجات</Link>
                <div className="pt-3 pb-1 text-xs text-ink-muted uppercase">الأقسام</div>
                {shopCats.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/shop?category=${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-ink-soft hover:text-blush-600"
                  >
                    {c.name_ar}
                  </Link>
                ))}
                <Link to="/shop?is_offer=true" onClick={() => setMenuOpen(false)} className="block py-3 mt-3 bg-blush-50 rounded-xl px-4 text-blush-600 font-semibold">
                  ✨ عروض خاصة
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
