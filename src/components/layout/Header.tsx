import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "الرئيسية" },
  { to: "/shop", label: "المتجر" },
  { to: "/shop", label: "العناية بالشعر", search: { category: "hair-care" } },
  { to: "/shop", label: "العناية بالبشرة", search: { category: "skin-care" } },
  { to: "/shop", label: "المكياج", search: { category: "makeup" } },
] as const;

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 h-16 sm:h-20">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2 -mx-2 rounded-md hover:bg-accent" aria-label="القائمة">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl text-primary">The Girl House</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((it, i) => (
                <Link
                  key={i}
                  to={it.to}
                  // @ts-expect-error optional search
                  search={it.search}
                  onClick={() => setOpen(false)}
                  className="py-3 px-3 rounded-lg text-sm hover:bg-accent transition"
                >
                  {it.label}
                </Link>
              ))}
              <div className="border-t border-border my-2" />
              <Link to="/admin/login" onClick={() => setOpen(false)} className="py-3 px-3 rounded-lg text-sm text-muted-foreground hover:bg-accent">
                دخول الإدارة
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-gradient-blush flex items-center justify-center text-primary-foreground font-display text-lg shadow-soft group-hover:scale-105 transition">
            G
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="font-display text-lg sm:text-xl text-primary font-semibold">The Girl House</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground tracking-widest">ALEMANIA · DM · EGYPT</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {navItems.slice(0, 5).map((it, i) => (
            <Link
              key={i}
              to={it.to}
              // @ts-expect-error optional search
              search={it.search}
              className="px-3 py-2 text-sm font-medium hover:text-primary transition relative after:absolute after:bottom-0 after:right-1/2 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-1/2 hover:after:right-1/4"
              activeProps={{ className: "text-primary" }}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button aria-label="بحث" className="p-2 rounded-full hover:bg-accent transition hidden sm:block">
            <Search className="h-5 w-5" />
          </button>
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-accent transition" aria-label="السلة">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -left-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
