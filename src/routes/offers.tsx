import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض — The Girl House" },
      { name: "description", content: "أقوى عروض وخصومات على منتجات DM الألمانية الأصلية في The Girl House." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["offers-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,arabic_title,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description,availability_status,stock_tracking_enabled")
        .eq("is_active", true)
        .not("compare_at_price", "is", null)
        .order("order_index", { ascending: true });
      // filter where compare_at_price > price
      return ((data ?? []) as any[]).filter(
        (p) => Number(p.compare_at_price) > Number(p.price),
      ) as unknown as Product[];
    },
  });

  return (
    <PublicLayout>
      <div className="bg-secondary/40 border-b border-border">
        <div className="container mx-auto px-4 py-10 text-center" dir="rtl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Flame className="h-3.5 w-3.5" /> عروض حصرية
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">العروض</h1>
          <p className="text-muted-foreground mt-1">{products.length} منتج بخصم</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8" dir="rtl">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">لا توجد عروض حالياً</p>
            <Link to="/shop" className="text-primary hover:underline mt-2 inline-block">تصفّحي كل المنتجات</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
