import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Minus, Plus, Star, ShoppingBag, MessageCircle, ShieldCheck, Truck, Heart, ArrowLeft, Zap, Check, AlertTriangle, Sparkles, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useBrand } from "@/hooks/use-brand";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import placeholderImg from "@/assets/product-placeholder.jpg";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto py-20 text-center">
        <h1 className="font-display text-3xl">المنتج غير موجود</h1>
        <Link to="/shop" className="text-primary hover:underline mt-4 inline-block">العودة للمتجر</Link>
      </div>
    </PublicLayout>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { add, subtotal } = useCart();
  const brand = useBrand();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product!.id)
        .eq("approved", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.id, product?.category_id],
    enabled: !!product?.id && !!product?.category_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,arabic_title,slug,price,compare_at_price,images,rating,reviews_count,stock,is_limited,short_description,availability_status,stock_tracking_enabled")
        .eq("is_active", true)
        .eq("category_id", product!.category_id as string)
        .neq("id", product!.id)
        .order("order_index", { ascending: true })
        .limit(4);
      return (data ?? []) as unknown as Product[];
    },
  });

  if (isLoading) return <PublicLayout><div className="container mx-auto py-20 text-center">جاري التحميل…</div></PublicLayout>;
  if (!product) throw notFound();

  const hasImages = Array.isArray(product.images) && (product.images as string[]).length > 0;
  const images = hasImages ? (product.images as string[]) : [placeholderImg];

  const discount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)
    : null;

  const productUrl = typeof window !== "undefined" ? `${window.location.origin}/product/${product.slug}` : `/product/${product.slug}`;
  const waMsg = `مرحبًا، أريد طلب هذا المنتج من The Girl House:\nالمنتج: ${product.name}\nالسعر: ${formatEGP(Number(product.price))}\nالكمية: ${qty}\nالرابط: ${productUrl}`;

  useEffect(() => {
    if (product?.id) {
      trackEvent("product_view", {
        product_id: product.id,
        product_name: product.name,
        price: Number(product.price),
        slug: product.slug,
      });
    }
  }, [product?.id, product?.name, product?.price, product?.slug]);

  const handleAdd = () => {
    add(
      { id: product.id, name: product.name, slug: product.slug, price: Number(product.price), image: images[0] },
      qty,
    );
    trackEvent("add_to_cart", {
      product_id: product.id,
      product_name: product.name,
      price: Number(product.price),
      qty,
      source: "product_page",
    });
    toast.success("تمت الإضافة للسلة 🛍️");
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate({ to: "/checkout" });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewName.trim().length < 2) return toast.error("الاسم قصير جداً");
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: product.id,
      customer_name: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim() || null,
      approved: false,
    });
    setSubmitting(false);
    if (error) return toast.error("حصل خطأ، حاولي تاني");
    toast.success("شكراً! رأيك هيظهر بعد الموافقة 💕");
    setReviewName(""); setReviewComment(""); setReviewRating(5);
    refetchReviews();
  };

  const benefits = (product.key_benefits as string[] | null) ?? [];
  const ingredients = (product.key_ingredients as string[] | null) ?? [];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <ArrowLeft className="h-3 w-3" />
          <Link to="/shop" className="hover:text-primary">المتجر</Link>
          <ArrowLeft className="h-3 w-3" />
          <span className="text-foreground">{product.arabic_title || product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden relative">
              <img src={images[activeImg]} alt={product.arabic_title || product.name} className="w-full h-full object-cover" />
              {discount && (
                <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-full shadow-soft">
                  -{discount}%
                </span>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                <span className="bg-background/90 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-full text-primary shadow-soft">
                  🇩🇪 منتج ألماني أصلي
                </span>
                <span className="bg-background/90 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-full text-foreground shadow-soft">
                  مستورد من ألمانيا
                </span>
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${activeImg === i ? "border-primary" : "border-transparent opacity-70"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && <span className="text-xs uppercase tracking-widest text-muted-foreground">{product.brand}</span>}
              {(product as any).sub_category && (
                <span className="text-xs bg-secondary px-2 py-1 rounded-full">{(product as any).sub_category}</span>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">{product.arabic_title || product.name}</h1>
            <p className="text-sm text-muted-foreground" dir="ltr">{product.name}</p>

            {Number(product.reviews_count) > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(product.rating)) ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews_count} تقييم)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-primary">{formatEGP(Number(product.price))}</span>
              {product.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through">{formatEGP(Number(product.compare_at_price))}</span>
              )}
            </div>

            {product.short_description && (
              <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
            )}

            {(() => {
              const remaining = brand.free_shipping_threshold - subtotal;
              return remaining > 0 ? (
                <div className="bg-primary/5 border border-primary/20 text-primary text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>أضيفي منتجات بقيمة {formatEGP(remaining)} للحصول على شحن مجاني 🚚</span>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>مبروك! أهلتي للشحن المجاني 🎉</span>
                </div>
              );
            })()}

            {(() => {
              const status = (product as any).availability_status ?? "available";
              const tracking = (product as any).stock_tracking_enabled === true;
              const isOut = status === "out_of_stock" || (tracking && product.stock === 0);
              return (
                <>
                  <div className="flex items-center gap-4 py-3 border-y border-border">
                    <span className="text-sm font-medium">الكمية:</span>
                    <div className="flex items-center border border-border rounded-full">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 hover:bg-accent rounded-r-full"><Minus className="h-4 w-4" /></button>
                      <span className="w-10 text-center font-semibold">{qty}</span>
                      <button onClick={() => setQty((q) => q + 1)} className="p-2 hover:bg-accent rounded-l-full"><Plus className="h-4 w-4" /></button>
                    </div>
                    <span className={`text-xs font-medium ${isOut ? "text-destructive" : "text-emerald-600"}`}>
                      {isOut ? "نفد المخزون" : "متاح للطلب"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handleAdd}
                      disabled={isOut}
                      className="bg-card border-2 border-primary text-primary py-3.5 rounded-full font-medium hover:bg-primary hover:text-primary-foreground transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ShoppingBag className="h-4 w-4" /> أضيفي للسلة
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={isOut}
                      className="bg-primary text-primary-foreground py-3.5 rounded-full font-medium shadow-elegant hover:opacity-90 transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Zap className="h-4 w-4" /> اشتري الآن
                    </button>
                    {brand.whatsapp ? (
                      <a
                        href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(waMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] text-white py-3.5 rounded-full font-medium hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" /> واتساب
                      </a>
                    ) : null}
                  </div>
                </>
              );
            })()}

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { icon: ShieldCheck, label: "أصلية ١٠٠٪" },
                { icon: Truck, label: "توصيل سريع" },
                { icon: Heart, label: "خدمة راقية" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-3 bg-secondary/40 rounded-xl text-center text-xs">
                  <b.icon className="h-5 w-5 text-primary" />
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DETAILS SECTIONS */}
        <div className="mt-14 grid md:grid-cols-2 gap-6 items-start auto-rows-min">
          {benefits.length > 0 && (
            <Section icon={Sparkles} title="الفوائد الرئيسية">
              <ul className="space-y-2">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(product as any).suitable_for && (
            <Section icon={Heart} title="مناسب لـ">
              <p className="text-sm leading-relaxed text-muted-foreground">{(product as any).suitable_for}</p>
            </Section>
          )}

          {(product as any).how_to_use && (
            <Section icon={Info} title="طريقة الاستخدام">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{(product as any).how_to_use}</p>
            </Section>
          )}

          {ingredients.length > 0 && (
            <Section icon={Sparkles} title="المكونات الفعّالة">
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-secondary/60 border border-border rounded-full px-3 py-1.5" dir="ltr">{ing}</span>
                ))}
              </div>
            </Section>
          )}

          {(product as any).product_details && (
            <Section icon={Info} title="تفاصيل المنتج">
              <p className="text-sm leading-relaxed text-muted-foreground">{(product as any).product_details}</p>
            </Section>
          )}

          {(product as any).warnings && (
            <Section icon={AlertTriangle} title="تحذيرات وملاحظات">
              <p className="text-sm leading-relaxed text-muted-foreground">{(product as any).warnings}</p>
            </Section>
          )}

          {product.description && (
            <Section icon={Info} title="الوصف الكامل" className="md:col-span-2">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
            </Section>
          )}
        </div>

        {/* REVIEWS */}
        <section className="mt-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-bold mb-5">آراء العميلات</h2>
            {reviews.length === 0 ? (
              <div className="bg-secondary/40 border border-border rounded-2xl p-8 text-center">
                <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">لا توجد تقييمات بعد</p>
                <p className="text-xs text-muted-foreground mt-1">كوني أول من يقيم هذا المنتج 💕</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r: any) => (
                  <li key={r.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{r.customer_name}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">عميلة موثّقة</span>
                      </div>
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={submitReview} className="bg-secondary/40 rounded-2xl p-6 border border-border h-fit">
            <h3 className="font-display text-xl font-semibold mb-4">شاركينا رأيك</h3>
            <div className="space-y-3">
              <input
                type="text" placeholder="اسمك" value={reviewName} onChange={(e) => setReviewName(e.target.value)} maxLength={100}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required
              />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">التقييم</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)}>
                      <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="رأيك في المنتج" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} maxLength={1000} rows={3}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground py-2.5 px-6 rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50">
                {submitting ? "جاري الإرسال…" : "إرسال التقييم"}
              </button>
            </div>
          </form>
        </section>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold mb-6">منتجات ذات صلة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}

function Section({ icon: Icon, title, children, className = "" }: { icon: any; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-card border border-border rounded-2xl p-5 ${className}`}>
      <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}
