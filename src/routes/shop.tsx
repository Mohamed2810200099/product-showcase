import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Filter, SlidersHorizontal } from "lucide-react";

const searchSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["new", "price-asc", "price-desc", "rating"]).optional(),
  q: z.string().optional(),
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

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products", search.category, search.sort, search.q],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description,category_id,categories(slug)")
        .eq("is_active", true);

      if (search.category) {
        const cat = (categories as any[]).find((c) => c.slug === search.category);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (search.q) q = q.ilike("name", `%${search.q}%`);

      switch (search.sort) {
        case "price-asc": q = q.order("price", { ascending: true }); break;
        case "price-desc": q = q.order("price", { ascending: false }); break;
        case "rating": q = q.order("rating", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }
      const { data } = await q;
      return (data ?? []) as unknown as Product[];
    },
    enabled: categories.length > 0 || !search.category,
  });

  const setCategory = (slug?: string) =>
    navigate({ search: (s: any) => ({ ...s, category: slug }) });

  const Filters = (
    <aside className="bg-card rounded-2xl border border-border p-5 space-y-5">
      <div>
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4" /> الفئات
        </h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setCategory(undefined)}
              className={`w-full text-right py-2 px-3 rounded-lg transition ${!search.category ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              كل المنتجات
            </button>
          </li>
          {(categories as any[]).map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setCategory(c.slug)}
                className={`w-full text-right py-2 px-3 rounded-lg transition ${search.category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );

  return (
    <PublicLayout>
      <div className="bg-secondary/40 border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold">المتجر</h1>
          <p className="text-muted-foreground mt-1">{products.length} منتج متاح</p>
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
              <p className="text-muted-foreground">لا توجد منتجات في هذه الفئة حالياً</p>
              <Link to="/shop" className="text-primary hover:underline mt-2 inline-block">عرض كل المنتجات</Link>
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
