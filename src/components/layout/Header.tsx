import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop", label: "Hair Care", search: { category: "hair-care" } },
  { to: "/shop", label: "Skincare", search: { category: "skincare" } },
  { to: "/shop", label: "Offers" },
] as const;

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = searchQuery.trim();
    if (!v) return;
    navigate({ to: "/shop", search: { search: v } });
    setIsSearchOpen(false);
  };

  return (
    <header dir="ltr" className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_2px_20px_-10px_rgba(217,108,157,0.2)]">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 h-16 sm:h-20">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2 -mx-2 rounded-md hover:bg-[#F9EEF3]" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl text-[#D96C9D]">The Girl House</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {navItems.map((it, i) => (
                <Link
                  key={i}
                  to={it.to}
                  // @ts-expect-error optional search
                  search={it.search}
                  onClick={() => setOpen(false)}
                  className="py-3 px-3 rounded-lg text-sm hover:bg-[#F9EEF3] transition"
                >
                  {it.label}
                </Link>
              ))}
              <div className="border-t border-border my-2" />
              <Link to="/admin/login" onClick={() => setOpen(false)} className="py-2 px-3 rounded-lg text-xs text-muted-foreground/70 hover:bg-[#F9EEF3]">
                Admin
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={logo}
            alt="The Girl House"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover ring-1 ring-white shadow-[0_6px_18px_-6px_rgba(217,108,157,0.4)] group-hover:scale-105 transition"
          />
          <div className="hidden sm:block leading-tight">
            <div className="font-display text-lg sm:text-xl text-[#3A2430] font-semibold">The Girl House</div>
            <div className="text-[10px] sm:text-[11px] text-[#3A2430]/55 tracking-[0.18em]">Curated German Beauty • Egypt</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {navItems.map((it, i) => (
            <Link
              key={i}
              to={it.to}
              // @ts-expect-error optional search
              search={it.search}
              className="px-3 py-2 text-sm font-medium text-[#3A2430]/80 hover:text-[#D96C9D] transition relative after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-[#D96C9D] after:transition-all hover:after:w-1/2"
              activeProps={{ className: "text-[#D96C9D]" }}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            aria-label="Search"
            onClick={() => setIsSearchOpen((s) => !s)}
            className="p-2 rounded-full hover:bg-[#F9EEF3] transition"
          >
            <Search className="h-5 w-5 text-[#3A2430]" />
          </button>
          <Link to="/orders" aria-label="My Orders" className="p-2 rounded-full hover:bg-[#F9EEF3] transition hidden sm:block">
            <User className="h-5 w-5 text-[#3A2430]" />
          </Link>
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-[#F9EEF3] transition" aria-label="Cart">
            <ShoppingBag className="h-5 w-5 text-[#3A2430]" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#D96C9D] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      </div>
      {isSearchOpen && (
        <div className="border-t border-white/60 bg-white/90 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={submitSearch} className="container mx-auto px-4 py-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-[#3A2430]/60 shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحثي عن منتج..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-[#3A2430]/40 py-2"
            />
            <button
              type="submit"
              className="bg-[#D96C9D] hover:bg-[#C95588] text-white text-sm font-medium px-4 py-2 rounded-full transition shrink-0"
            >
              بحث
            </button>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setIsSearchOpen(false)}
              className="p-2 rounded-full hover:bg-[#F9EEF3] transition shrink-0"
            >
              <X className="h-5 w-5 text-[#3A2430]" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
