import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Truck, ShieldCheck, Award, MessageCircle, Heart, ArrowLeft, Star, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useBrand } from "@/hooks/use-brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Girl House — منتجات DM الألمانية الأصلية في مصر" },
      { name: "description", content: "تسوقي منتجات DM الألمانية الأصلية: شامبو Balea، كريمات Nivea، مكياج، عناية بالشعر والبشرة. توصيل لكل المحافظات وكوبون WELCOME10 لأول طلب." },
    ],
  }),
  component: HomePage,
});

const trustBadges = [
  { icon: ShieldCheck, label: "أصلية ١٠٠٪" },
  { icon: Truck, label: "توصيل لكل مصر" },
  { icon: Award, label: "جودة ألمانية" },
  { icon: Heart, label: "خدمة راقية" },
  { icon: Sparkles, label: "تغليف فخم" },
];

function HomePage() {
  const brand = useBrand();

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []) as unknown as Product[];
    },
  });

  const { data: limited = [] } = useQuery({
    queryKey: ["limited-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description")
        .eq("is_active", true)
        .eq("is_limited", true)
        .limit(4);
      return (data ?? []) as unknown as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-home"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order").limit(8);
      return data ?? [];
    },
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data } = await supabase.from("testimonials").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-center md:text-right relative z-10">
            <span className="inline-flex items-center gap-2 bg-background/70 backdrop-blur px-4 py-1.5 rounded-full text-xs font-medium text-primary border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" /> منتجات أصلية من ألمانيا 🇩🇪
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-foreground">
              جمالك الألماني<br />
              <span className="text-primary">في انتظارك</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto md:mx-0">
              اكتشفي تشكيلة فخمة من منتجات DM الألمانية الأصلية — عناية، مكياج، وفخامة بأسعار تستحقينها.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link to="/shop" className="bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-medium hover:opacity-90 transition shadow-elegant inline-flex items-center gap-2">
                تسوقي الآن <ArrowLeft className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("مرحباً، عايزة أعرف عروض اليوم 💕")}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] text-white px-7 py-3.5 rounded-full font-medium hover:opacity-90 transition shadow-soft inline-flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" /> اطلبي عبر واتساب
              </a>
            </div>
          </div>
          <div className="relative aspect-square max-w-md mx-auto md:mx-0">
            <div className="absolute inset-0 bg-gradient-gold rounded-full blur-3xl opacity-40 animate-float-soft" />
            <img
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=900&auto=format&fit=crop"
              alt="منتجات تجميل ألمانية فاخرة"
              className="relative rounded-3xl object-cover w-full h-full shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container mx-auto px-4 py-6 flex flex-wrap items-center justify-around gap-4">
          {trustBadges.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="h-9 w-9 rounded-full bg-background flex items-center justify-center text-primary shadow-soft">
                <b.icon className="h-4 w-4" />
              </div>
              <span className="font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">تسوقي حسب الفئة</h2>
          <p className="text-muted-foreground">اختاري ما يناسبك من تشكيلتنا الواسعة</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((c: any) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug }}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-blush via-nude to-champagne flex items-center justify-center text-center p-4 hover:shadow-elegant transition-all hover:-translate-y-1 border border-border"
            >
              <div>
                <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-background/60 backdrop-blur flex items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">{c.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">منتجات مميزة</h2>
            <p className="text-muted-foreground mt-1">اختياراتنا المفضلة لكِ</p>
          </div>
          <Link to="/shop" className="text-primary hover:underline text-sm font-medium hidden sm:flex items-center gap-1">
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">قريباً منتجات مميزة 💕</p>
        )}
      </section>

      {/* LIMITED STOCK URGENCY */}
      {limited.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="bg-gradient-blush rounded-3xl p-6 sm:p-10 text-primary-foreground text-center mb-8 shadow-elegant relative overflow-hidden">
            <Flame className="h-10 w-10 mx-auto mb-3" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold">⏰ الكمية محدودة</h2>
            <p className="opacity-90 mt-2">منتجات مطلوبة جداً — الكميات بتنفد بسرعة. اطلبي قبل ما تخلص!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {limited.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ROUTINES */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">روتينك المثالي</h2>
          <p className="text-muted-foreground mt-1">جمعنا لكِ روتينات يومية بمنتجاتنا الألمانية الأصلية</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "روتين البشرة الصباحي", desc: "غسول لطيف، تونر منعش، وكريم مرطب لإشراقة طبيعية على مدار اليوم.", img: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?q=80&w=600&auto=format&fit=crop" },
            { title: "روتين الشعر اللامع", desc: "شامبو، بلسم، وماسك أسبوعي للحصول على شعر صحي ولامع.", img: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?q=80&w=600&auto=format&fit=crop" },
            { title: "روتين العناية المسائي", desc: "تنظيف عميق، سيروم، وكريم ليلي مغذي لتجديد البشرة أثناء النوم.", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop" },
          ].map((r, i) => (
            <article key={i} className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-elegant transition group">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={r.img} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="bg-secondary/40 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl sm:text-4xl font-bold">آراء عميلاتنا</h2>
              <p className="text-muted-foreground mt-1">تجارب حقيقية من بنات ست المعمورة 💕</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((t: any) => (
                <div key={t.id} className="bg-background rounded-2xl p-6 border border-border shadow-soft">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-blush flex items-center justify-center text-primary-foreground font-display font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
