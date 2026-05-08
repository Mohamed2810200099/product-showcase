import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Truck, ShieldCheck, Award, Heart, ArrowLeft, Star, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ImageSwiper, type SwiperProduct } from "@/components/ui/image-swiper";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import placeholderImg from "@/assets/product-placeholder.jpg";

import { HeroPremium } from "@/components/HeroPremium";
import { ReferralSection } from "@/components/ReferralSection";
import { BeautyAssistant } from "@/components/BeautyAssistant";
import { useBrand } from "@/hooks/use-brand";
import { FloatingBeautyElements } from "@/components/three-d/FloatingBeautyElements";
import { RevealOnView } from "@/components/three-d/RevealOnView";


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
  const navigate = useNavigate();
  const { add } = useCart();

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-products-onsale"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,arabic_title,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description,availability_status,stock_tracking_enabled")
        .eq("is_active", true)
        .not("compare_at_price", "is", null)
        .order("order_index", { ascending: true })
        .limit(20);
      const all = (data ?? []) as unknown as Product[];
      return all.filter((p) => p.compare_at_price && p.compare_at_price > p.price).slice(0, 8);
    },
  });

  const { data: limited = [] } = useQuery({
    queryKey: ["limited-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,arabic_title,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description,availability_status,stock_tracking_enabled")
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
      <HeroPremium />
      {brand.show_referral_section && <ReferralSection />}

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
      <section className="container mx-auto px-4 py-10 relative">
        <FloatingBeautyElements variant="pearls" density={5} />
        <RevealOnView>
          <div className="flex items-end justify-between mb-8 relative z-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">منتجات مميزة</h2>
              <p className="text-muted-foreground mt-1">اختياراتنا المفضلة لكِ</p>
            </div>
            <Link to="/shop" className="text-primary hover:underline text-sm font-medium hidden sm:flex items-center gap-1">
              عرض الكل <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </RevealOnView>
        {featured.length > 0 ? (
          <div className="relative z-10 bg-gradient-to-br from-[#FFF8F4] via-white to-[#FCE9F1] rounded-[32px] p-6 sm:p-10 border border-[#E7A8BF]/30 shadow-[0_30px_80px_-40px_rgba(217,108,157,0.4)]">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-medium text-[#D96C9D]">
                <Sparkles className="h-3.5 w-3.5" /> اختياراتنا المفضلة لكِ
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-2 text-[#3B2332]">
                عروض مختارة من ألمانيا
              </h3>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                اسحبي يمين وشمال أو استخدمي الأسهم لتصفح العروض.
              </p>
            </div>
            <div className="flex justify-center">
              <ImageSwiper
                cardWidth={380}
                cardHeight={520}
                products={featured.map<SwiperProduct>((p) => ({
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  arabicName: p.arabic_title || p.name,
                  image: (p.images && p.images[0]) || placeholderImg,
                  priceEgp: p.price,
                  comparePriceEgp: p.compare_at_price ?? undefined,
                  category: p.is_limited ? "كمية محدودة" : "عرض خاص",
                }))}
                onProductClick={(sp) => sp.slug && navigate({ to: "/product/$slug", params: { slug: sp.slug } })}
                onAddToCart={(sp) => {
                  const orig = featured.find((f) => f.id === sp.id);
                  if (!orig) return;
                  add({
                    id: orig.id,
                    name: orig.name,
                    slug: orig.slug,
                    price: orig.price,
                    image: sp.image,
                  });
                  toast.success("تمت الإضافة للسلة 🛍️");
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">قريباً منتجات مميزة 💕</p>
        )}

      </section>

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

      {/* BEAUTY ASSISTANT */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Beauty Match Assistant
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">اختاري روتينك مع The Girl House</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">جاوبي على كام سؤال بسيط، واحنا هنرشح لكِ المنتجات الألمانية الأنسب من اختياراتنا.</p>
        </div>
        <div className="max-w-md mx-auto">
          <BeautyAssistant embedded />
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
      <BeautyAssistant />
    </PublicLayout>
  );
}
