import { createFileRoute } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  ShieldCheck,
  Truck,
  BadgeCheck,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useBrand } from "@/hooks/use-brand";

const searchSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["new", "price-asc", "price-desc", "rating"]).optional(),
  q: z.string().optional(),
  search: z.string().optional(),
  concern: z.string().optional(),
  type: z.string().optional(),
  skin: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  offers: z.coerce.boolean().optional(),
  limited: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "المتجر — The Girl House" },
      { name: "description", content: "تصفحي كل منتجات DM الألمانية: شامبو، كريمات، مكياج، عناية بالشعر والبشرة." },
    ],
  }),
  component: ShopPage,
});

const CONCERNS: { value: string; label: string }[] = [
  { value: "hair_repair", label: "إصلاح الشعر" },
  { value: "hair_growth", label: "نمو الشعر" },
  { value: "frizz", label: "هيشان الشعر" },
  { value: "dry_skin", label: "بشرة جافة" },
  { value: "oily_skin", label: "بشرة دهنية" },
  { value: "acne", label: "حبوب وآثار" },
  { value: "glow", label: "نضارة" },
  { value: "hydration", label: "ترطيب" },
];

const PRODUCT_TYPES: { value: string; label: string }[] = [
  { value: "shampoo", label: "شامبو" },
  { value: "conditioner", label: "بلسم" },
  { value: "mask", label: "ماسك" },
  { value: "oil", label: "زيت" },
  { value: "serum", label: "سيروم" },
  { value: "cream", label: "كريم" },
  { value: "cleanser", label: "غسول" },
  { value: "toner", label: "تونر" },
  { value: "sunscreen", label: "واقي شمس" },
  { value: "makeup", label: "مكياج" },
  { value: "treatment", label: "علاج" },
];

const SKIN_TYPES = ["دهنية", "جافة", "مختلطة", "حساسة", "عادية"];

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const reduce = useReducedMotion();
  const brand = useBrand();
  const [showFilters, setShowFilters] = useState(false);
  const activeQuery = search.search ?? search.q ?? "";
  const [searchInput, setSearchInput] = useState(activeQuery);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products", search.category, search.sort, activeQuery, search.concern, search.type, search.skin, search.min, search.max, search.offers, search.limited],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let categoryId: string | null = null;
      if (search.category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", search.category)
          .maybeSingle();
        categoryId = cat?.id ?? null;
      }

      let q = supabase
        .from("products")
        .select("id,name,arabic_title,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description,availability_status,stock_tracking_enabled,category_id,product_type,tags,suitable_for,categories(slug)")
        .eq("is_active", true);

      if (categoryId) q = q.eq("category_id", categoryId);
      if (activeQuery) q = q.or(`name.ilike.%${activeQuery}%,arabic_title.ilike.%${activeQuery}%`);
      if (search.concern) q = q.contains("tags", [search.concern]);
      if (search.type) q = q.eq("product_type", search.type);
      if (search.skin) q = q.ilike("suitable_for", `%${search.skin}%`);
      if (typeof search.min === "number") q = q.gte("price", search.min);
      if (typeof search.max === "number") q = q.lte("price", search.max);
      if (search.offers) q = q.not("compare_at_price", "is", null);
      if (search.limited) q = q.eq("is_limited", true);

      switch (search.sort) {
        case "price-asc": q = q.order("price", { ascending: true }); break;
        case "price-desc": q = q.order("price", { ascending: false }); break;
        case "rating": q = q.order("rating", { ascending: false }); break;
        case "new": q = q.order("created_at", { ascending: false }); break;
        default: q = q.order("order_index", { ascending: true });
      }
      const { data } = await q;
      return (data ?? []) as unknown as Product[];
    },
  });

  const setParam = (patch: Record<string, unknown>) =>
    navigate({ search: (s: any) => ({ ...s, ...patch }) });

  const clearAll = () =>
    navigate({ search: () => ({ sort: search.sort }) as any });

  const activeFilterCount =
    (search.concern ? 1 : 0) +
    (search.type ? 1 : 0) +
    (search.skin ? 1 : 0) +
    (typeof search.min === "number" ? 1 : 0) +
    (typeof search.max === "number" ? 1 : 0) +
    (search.offers ? 1 : 0) +
    (search.limited ? 1 : 0) +
    (search.category ? 1 : 0);

  const concernLabel = (v?: string) => CONCERNS.find((c) => c.value === v)?.label ?? v;
  const typeLabel = (v?: string) => PRODUCT_TYPES.find((c) => c.value === v)?.label ?? v;
  const categoryLabel = (slug?: string) =>
    (categories as any[]).find((c) => c.slug === slug)?.name ?? slug;

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (search.category) chips.push({ key: "category", label: categoryLabel(search.category)!, onRemove: () => setParam({ category: undefined }) });
    if (search.concern) chips.push({ key: "concern", label: concernLabel(search.concern)!, onRemove: () => setParam({ concern: undefined }) });
    if (search.type) chips.push({ key: "type", label: typeLabel(search.type)!, onRemove: () => setParam({ type: undefined }) });
    if (search.skin) chips.push({ key: "skin", label: `بشرة ${search.skin}`, onRemove: () => setParam({ skin: undefined }) });
    if (typeof search.min === "number") chips.push({ key: "min", label: `من ${search.min} ج.م`, onRemove: () => setParam({ min: undefined }) });
    if (typeof search.max === "number") chips.push({ key: "max", label: `إلى ${search.max} ج.م`, onRemove: () => setParam({ max: undefined }) });
    if (search.offers) chips.push({ key: "offers", label: "عروض فقط", onRemove: () => setParam({ offers: undefined }) });
    if (search.limited) chips.push({ key: "limited", label: "كمية محدودة", onRemove: () => setParam({ limited: undefined }) });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categories]);

  const Filters = (
    <aside className="bg-gradient-to-br from-card to-secondary/30 rounded-2xl border border-border/70 p-5 space-y-5 shadow-[0_10px_30px_-20px_rgba(58,36,48,0.25)]">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" /> الفلاتر
        </h3>
        {activeFilterCount > 0 && (
          <span className="bg-primary/10 text-primary text-[11px] font-bold rounded-full px-2 py-0.5">
            {activeFilterCount} نشطة
          </span>
        )}
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">الفئات</h4>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setParam({ category: undefined })}
              className={`w-full text-right py-2 px-3 rounded-lg transition ${!search.category ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent"}`}
            >
              كل المنتجات
            </button>
          </li>
          {(categories as any[]).map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setParam({ category: c.slug })}
                className={`w-full text-right py-2 px-3 rounded-lg transition ${search.category === c.slug ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent"}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px bg-border/60" />

      <div>
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">مشكلة الشعر / البشرة</h4>
        <div className="flex flex-wrap gap-1.5">
          {CONCERNS.map((c) => {
            const active = search.concern === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setParam({ concern: active ? undefined : c.value })}
                className={`text-xs rounded-full px-3 py-1.5 border transition focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background/60 border-border hover:bg-accent"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">نوع المنتج</h4>
        <select
          value={search.type ?? ""}
          onChange={(e) => setParam({ type: e.target.value || undefined })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">كل الأنواع</option>
          {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">نوع البشرة</h4>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_TYPES.map((s) => {
            const active = search.skin === s;
            return (
              <button
                key={s}
                onClick={() => setParam({ skin: active ? undefined : s })}
                className={`text-xs rounded-full px-3 py-1.5 border transition focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background/60 border-border hover:bg-accent"}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">السعر (ج.م)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="من"
            value={search.min ?? ""}
            onChange={(e) => setParam({ min: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            placeholder="إلى"
            value={search.max ?? ""}
            onChange={(e) => setParam({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-center justify-between cursor-pointer text-sm bg-background/50 hover:bg-accent/40 rounded-lg px-3 py-2 border border-border/60 transition">
          <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> عروض فقط</span>
          <input type="checkbox" checked={!!search.offers} onChange={(e) => setParam({ offers: e.target.checked || undefined })} className="accent-primary h-4 w-4" />
        </label>
        <label className="flex items-center justify-between cursor-pointer text-sm bg-background/50 hover:bg-accent/40 rounded-lg px-3 py-2 border border-border/60 transition">
          <span>كمية محدودة</span>
          <input type="checkbox" checked={!!search.limited} onChange={(e) => setParam({ limited: e.target.checked || undefined })} className="accent-primary h-4 w-4" />
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full inline-flex items-center justify-center gap-2 text-xs bg-secondary hover:bg-accent rounded-full py-2.5 font-medium transition"
        >
          <X className="h-3.5 w-3.5" /> مسح كل الفلاتر ({activeFilterCount})
        </button>
      )}
    </aside>
  );

  const SortDropdown = (
    <div className="relative">
      <select
        value={search.sort ?? "new"}
        onChange={(e) => navigate({ search: (s: any) => ({ ...s, sort: e.target.value as any }) })}
        className="appearance-none bg-card border border-border rounded-full pr-9 pl-4 py-2 text-sm font-medium hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition cursor-pointer"
      >
        <option value="new">الأحدث</option>
        <option value="price-asc">الأرخص</option>
        <option value="price-desc">الأغلى</option>
        <option value="rating">الأعلى تقييماً</option>
      </select>
      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );

  const itemMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: "easeOut" as const },
      };

  return (
    <PublicLayout>
      {/* Premium hero strip */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/40 to-background" aria-hidden />
        <div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(closest-side, hsl(var(--primary) / 0.25), transparent)" }}
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(closest-side, hsl(var(--accent) / 0.3), transparent)" }}
          aria-hidden
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative container mx-auto px-4 py-10 sm:py-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            تسوقي منتجات <span className="bg-gradient-to-l from-primary to-[#C95588] bg-clip-text text-transparent">The Girl House</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
            منتجات ألمانية أصلية للعناية بالشعر والبشرة — مختارة بعناية ومتاحة في مصر
          </p>

          {/* Trust chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: BadgeCheck, label: "أصلية من ألمانيا" },
              { icon: ShieldCheck, label: "الدفع عند الاستلام" },
              { icon: Truck, label: "توصيل داخل مصر" },
            ].map((t) => (
              <span
                key={t.label}
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs bg-background/70 backdrop-blur-sm border border-border/70 rounded-full px-3 py-1.5 text-foreground/80"
              >
                <t.icon className="h-3.5 w-3.5 text-primary" />
                {t.label}
              </span>
            ))}
          </div>

          {/* Premium search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = searchInput.trim();
              if (v) trackEvent("search_submitted", { query: v, source: "shop" });
              navigate({ search: (s: any) => ({ ...s, search: v || undefined, q: undefined }) });
            }}
            className="mt-6 flex gap-2 max-w-2xl"
            role="search"
          >
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحثي عن منتج، فئة، أو ماركة..."
                aria-label="ابحثي في المتجر"
                className="w-full bg-background/90 backdrop-blur border border-border rounded-full pr-11 pl-12 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    navigate({ search: (s: any) => ({ ...s, search: undefined, q: undefined }) });
                  }}
                  aria-label="مسح البحث"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-gradient-to-br from-primary to-[#C95588] text-primary-foreground px-5 sm:px-7 py-3 rounded-full text-sm font-semibold shadow-[0_10px_24px_-10px_rgba(217,108,157,0.6)] hover:shadow-[0_14px_28px_-10px_rgba(217,108,157,0.7)] active:translate-y-0.5 transition"
            >
              بحث
            </button>
          </form>

          {/* Quick category pills (horizontal scroll on mobile) */}
          {(categories as any[]).length > 0 && (
            <div className="mt-5 -mx-4 px-4 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 w-max">
                <button
                  onClick={() => setParam({ category: undefined })}
                  className={`shrink-0 text-xs rounded-full px-4 py-1.5 border transition ${!search.category ? "bg-foreground text-background border-foreground" : "bg-background/70 border-border hover:bg-accent"}`}
                >
                  الكل
                </button>
                {(categories as any[]).map((c) => {
                  const active = search.category === c.slug;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setParam({ category: c.slug })}
                      className={`shrink-0 text-xs rounded-full px-4 py-1.5 border transition ${active ? "bg-foreground text-background border-foreground" : "bg-background/70 border-border hover:bg-accent"}`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      <div className="container mx-auto px-4 py-8 grid md:grid-cols-[280px_1fr] gap-6">
        <div className="hidden md:block">{Filters}</div>

        <div>
          {/* Mobile filter trigger + sort */}
          <div className="md:hidden flex justify-between items-center gap-3 mb-4">
            <button
              onClick={() => setShowFilters(true)}
              className="bg-card border border-border rounded-full px-4 py-2 text-sm flex items-center gap-2 hover:border-primary/40 transition"
            >
              <SlidersHorizontal className="h-4 w-4" /> الفلاتر
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {SortDropdown}
          </div>

          {/* Top bar: results count + desktop sort */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "جاري التحميل…" : `${products.length} منتج`}
            </p>
            <div className="hidden md:block">{SortDropdown}</div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 hover:bg-primary/15 transition"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {activeChips.length > 1 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  مسح الكل
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-muted via-muted/60 to-muted animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    <div className="h-8 bg-muted rounded-full animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 sm:py-20 max-w-md mx-auto">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">مش لاقيين منتجات مناسبة للفلاتر دي</h3>
              <p className="text-sm text-muted-foreground mb-5">
                جربي تمسحي بعض الفلاتر أو ابعتي لنا على واتساب ونرشح لكِ المنتج المناسب.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
                >
                  <X className="h-4 w-4" /> مسح الفلاتر
                </button>
                {brand.whatsapp && (
                  <a
                    href={`https://wa.me/${brand.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackEvent("whatsapp_clicked", { source: "shop_empty" })}
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="h-4 w-4" /> تواصلي عبر واتساب
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  {...itemMotion}
                  transition={reduce ? undefined : { duration: 0.35, ease: "easeOut", delay: Math.min(i * 0.04, 0.32) }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowFilters(false)}
              className="md:hidden fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
              aria-hidden
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl border-t border-border shadow-2xl max-h-[85vh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="الفلاتر"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-semibold">الفلاتر</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary/10 text-primary text-[11px] font-bold rounded-full px-2 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  aria-label="إغلاق"
                  className="h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-4 py-4 flex-1">{Filters}</div>
              <div
                className="px-4 py-3 border-t border-border bg-background/95 backdrop-blur"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
              >
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-gradient-to-br from-primary to-[#C95588] text-primary-foreground rounded-full py-3 font-semibold text-sm shadow-[0_12px_28px_-10px_rgba(217,108,157,0.7)] active:scale-[0.98] transition"
                >
                  تطبيق الفلاتر ({products.length} منتج)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
