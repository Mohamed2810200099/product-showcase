import { Link, useLocation } from "@tanstack/react-router";
import { Home, Store, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useBrand } from "@/hooks/use-brand";

export function MobileBottomBar() {
  const { pathname } = useLocation();
  const { count } = useCart();
  const brand = useBrand();
  const Item = ({
    to, icon: Icon, label, badge, href,
  }: { to?: string; icon: any; label: string; badge?: number; href?: string }) => {
    const active = to && pathname === to;
    const cls = `flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`;
    const content = (
      <>
        <div className="relative">
          <Icon className="h-5 w-5" />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -left-2 bg-primary text-primary-foreground text-[9px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center font-bold">
              {badge}
            </span>
          )}
        </div>
        <span>{label}</span>
      </>
    );
    return href ? (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>{content}</a>
    ) : (
      <Link to={to!} className={cls}>{content}</Link>
    );
  };
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border flex">
      <Item to="/" icon={Home} label="الرئيسية" />
      <Item to="/shop" icon={Store} label="المتجر" />
      <Item to="/cart" icon={ShoppingBag} label="السلة" badge={count} />
      <Item href={`https://wa.me/${brand.whatsapp}`} icon={MessageCircle} label="واتساب" />
    </nav>
  );
}
