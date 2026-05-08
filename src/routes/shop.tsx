import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

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

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
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
    navigate({ search: () => ({ category: undefined, sort: search.sort }) as any });

  const activeFilterCount =
    (search.concern ? 1 : 0) +
    (search.type ? 1 : 0) +
    (search.skin ? 1 : 0) +
    (typeof search.min === "number" ? 1 : 0) +
    (typeof search.max === "number" ? 1 : 0) +
    (search.offers ? 1 : 0) +
    (search.limited ? 1 : 0);

  const Filters = (
    <aside className="bg-card rounded-2xl border border-border p-5 space-y-5">
      <div>
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4" /> الفئات
        </h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setParam({ category: undefined })}
              className={`w-full text-right py-2 px-3 rounded-lg transition ${!search.category ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              كل المنتجات
            </button>
          </li>
          {(categories as any[]).map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setParam({ category: c.slug })}
                className={`w-full text-right py-2 px-3 rounded-lg transition ${search.category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-2 text-sm">مشكلة الشعر / البشرة</h3>
        <div className="flex flex-wrap gap-1.5">
          {CONCERNS.map((c) => {
            const active = search.concern === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setParam({ concern: active ? undefined : c.value })}
                className={`text-xs rounded-full px-3 py-1.5 border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:bg-accent"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-2 text-sm">نوع المنتج</h3>
        <select
          value={search.type ?? ""}
          onChange={(e) => setParam({ type: e.target.value || undefined })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">كل الأنواع</option>
          {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-2 text-sm">نوع البشرة</h3>
        <div className="flex flex-wrap gap-1.5">
          {["دهنية","جافة","مختلطة","حساسة","عادية"].map((s) => {
            const active = search.skin === s;
            return (
              <button
                key={s}
                onClick={() => setParam({ skin: active ? undefined : s })}
                className={`text-xs rounded-full px-3 py-1.5 border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:bg-accent"}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-2 text-sm">السعر (ج.م)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="من"
            value={search.min ?? ""}
            onChange={(e) => setParam({ min: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            placeholder="إلى"
            value={search.max ?? ""}
            onChange={(e) => setParam({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between cursor-pointer text-sm">
          <span>عروض فقط</span>
          <input type="checkbox" checked={!!search.offers} onChange={(e) => setParam({ offers: e.target.checked || undefined })} className="accent-primary h-4 w-4" />
        </label>
        <label className="flex items-center justify-between cursor-pointer text-sm">
          <span>كمية محدودة</span>
          <input type="checkbox" checked={!!search.limited} onChange={(e) => setParam({ limited: e.target.checked || undefined })} className="accent-primary h-4 w-4" />
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full inline-flex items-center justify-center gap-2 text-xs bg-secondary hover:bg-accent rounded-full py-2"
        >
          <X className="h-3.5 w-3.5" /> مسح الفلاتر ({activeFilterCount})
        </button>
      )}
    </aside>
  );

  return (
    <PublicLayout>
      <div className="bg-secondary/40 border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold">المتجر</h1>
          <p className="text-muted-foreground mt-1">{products.length} منتج متاح</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = searchInput.trim();
              if (v) trackEvent("search_submitted", { query: v, source: "shop" });
              navigate({ search: (s: any) => ({ ...s, search: v || undefined, q: undefined }) });
            }}
            className="mt-4 flex gap-2 max-w-xl"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحثي عن منتج..."
              className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button type="submit" className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90">
              بحث
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <div className="hidden md:block">{Filters}</div>

        {/* Mobile filter trigger */}
        <div className="md:hidden flex justify-between items-center">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="bg-card border border-border rounded-full px-4 py-2 text-sm flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" /> الفلاتر
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={search.sort ?? "new"}
            onChange={(e) => navigate({ search: (s: any) => ({ ...s, sort: e.target.value as any }) })}
            className="bg-card border border-border rounded-full px-4 py-2 text-sm"
          >
            <option value="new">الأحدث</option>
            <option value="price-asc">الأرخص</option>
            <option value="price-desc">الأغلى</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>
        {showFilters && <div className="md:hidden">{Filters}</div>}

        <div>
          <div className="hidden md:flex justify-end mb-4">
            <select
              value={search.sort ?? "new"}
              onChange={(e) => navigate({ search: (s: any) => ({ ...s, sort: e.target.value as any }) })}
              className="bg-card border border-border rounded-full px-4 py-2 text-sm"
            >
              <option value="new">الأحدث</option>
              <option value="price-asc">الأرخص</option>
              <option value="price-desc">الأغلى</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">لا توجد منتجات بهذه الفلاتر حالياً</p>
              <button onClick={clearAll} className="text-primary hover:underline mt-2 inline-block">مسح الفلاتر</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
