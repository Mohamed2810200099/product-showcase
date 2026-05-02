import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Store, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";

const MobileBottomBar = () => {
  const { count, setDrawerOpen } = useCart();
  const { whatsappLink } = useSettings();

  const item = (isActive) =>
    `flex flex-col items-center gap-0.5 text-[11px] ${
      isActive ? "text-blush-600" : "text-ink-soft"
    }`;

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-blush-100 pb-safe"
      data-testid="mobile-bottom-bar"
    >
      <div className="grid grid-cols-4 py-2">
        <NavLink to="/" end className={({ isActive }) => item(isActive)} data-testid="bottom-home">
          <Home className="w-5 h-5" />
          <span>الرئيسية</span>
        </NavLink>
        <NavLink to="/shop" className={({ isActive }) => item(isActive)} data-testid="bottom-shop">
          <Store className="w-5 h-5" />
          <span>المتجر</span>
        </NavLink>
        <button onClick={() => setDrawerOpen(true)} className={item(false)} data-testid="bottom-cart">
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blush-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </div>
          <span>السلة</span>
        </button>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noreferrer"
          className={item(false)}
          data-testid="bottom-whatsapp"
        >
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          <span>واتساب</span>
        </a>
      </div>
    </div>
  );
};

export default MobileBottomBar;
