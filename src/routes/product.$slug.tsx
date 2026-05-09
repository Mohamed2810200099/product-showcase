import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, Star, ShoppingBag, MessageCircle, ShieldCheck, Truck, Heart, ArrowLeft, Zap, Check, AlertTriangle, Sparkles, Info, BadgeCheck, Wallet } from "lucide-react";
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
  const reduce = useReducedMotion();
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

  useEffect(() => {
    if (product?.id) {
      trackEvent("view_item", {
        currency: "EGP",
        value: Number(product.price),
        items: [{
          item_id: product.id,
          item_name: (product as any).arabic_title || product.name,
          item_brand: (product as any).brand ?? undefined,
          item_category: (product as any).categories?.name ?? undefined,
          price: Number(product.price),
          quantity: 1,
        }],
        source: "product_page",
      });
    }
  }, [product?.id, product?.name, product?.price, product?.slug]);

  if (isLoading) return <PublicLayout><div className="container mx-auto py-20 text-center">جاري التحميل…</div></PublicLayout>;
  if (!product) throw notFound();

  const hasImages = Array.isArray(product.images) && (product.images as string[]).length > 0;
  const images = hasImages ? (product.images as string[]) : [placeholderImg];

  const discount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)
    : null;

  const productUrl = typeof window !== "undefined" ? `${window.location.origin}/product/${product.slug}` : `/product/${product.slug}`;
  const waMsg = `مرحبًا، أريد طلب هذا المنتج من The Girl House:\nالمنتج: ${product.name}\nالسعر: ${formatEGP(Number(product.price))}\nالكمية: ${qty}\nالرابط: ${productUrl}`;

  // Defensive purchasability check — must mirror server createOrder validation.
  const availabilityStatus = (product as any).availability_status ?? "available";
  const trackingEnabled = (product as any).stock_tracking_enabled === true;
  const isComingSoonProduct = availabilityStatus === "coming_soon";
  const isOutProduct =
    availabilityStatus === "out_of_stock" || (trackingEnabled && Number(product.stock ?? 0) <= 0);
  const notPurchasable = isComingSoonProduct || isOutProduct;
  const maxQty = trackingEnabled ? Math.max(0, Number(product.stock ?? 0)) : Infinity;

  const incQty = () => {
    setQty((q) => {
      if (trackingEnabled && q + 1 > maxQty) {
        toast.error("الكمية المطلوبة غير متاحة حالياً");
        return q;
      }
      return q + 1;
    });
  };
  const decQty = () => setQty((q) => Math.max(1, q - 1));

  const handleAdd = () => {
    if (notPurchasable) {
      toast.error(isComingSoonProduct ? "هذا المنتج غير متاح للطلب حالياً" : "نفد المخزون");
      return;
    }
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
    if (notPurchasable) {
      toast.error(isComingSoonProduct ? "هذا المنتج غير متاح للطلب حالياً" : "نفد المخزون");
      return;
    }
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

  const statusLabel = isComingSoonProduct ? "قريباً" : isOutProduct ? "نفد المخزون" : "متاح للطلب";

  // SEO: per-product title/description + Product JSON-LD.
  const seoTitle = `${product.arabic_title || product.name} — The Girl House`;
  const seoDescription = (
    product.short_description ||
    product.description ||
    `${product.arabic_title || product.name} — منتج ألماني أصلي من The Girl House، ${formatEGP(Number(product.price))}.`
  ).toString().slice(0, 158);

  const ldAvailability = isComingSoonProduct
    ? "https://schema.org/PreOrder"
    : isOutProduct
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.arabic_title || product.name,
    description: seoDescription,
    image: hasImages ? (product.images as string[]) : undefined,
    sku: (product as any).sku ?? product.id,
    brand: (product as any).brand ? { "@type": "Brand", name: (product as any).brand } : undefined,
    category: (product as any).categories?.name ?? undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "EGP",
      price: Number(product.price),
      availability: ldAvailability,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = seoTitle;
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", seoDescription);
  }, [seoTitle, seoDescription]);

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="container mx-auto px-4 py-8 pb-[180px] md:pb-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <ArrowLeft className="h-3 w-3" />
          <Link to="/shop" className="hover:text-primary">المتجر</Link>
          <ArrowLeft className="h-3 w-3" />
          <span className="text-foreground">{product.arabic_title || product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Gallery */}
          <div>
            <div
              className="aspect-square rounded-[2rem] overflow-hidden relative p-6 sm:p-12 border border-border/60 shadow-[0_25px_60px_-25px_rgba(217,108,157,0.35)]"
              style={{
                background:
                  "radial-gradient(80% 70% at 50% 40%, #ffffff 0%, #fdf6f9 55%, #f8e3ec 100%)",
              }}
            >
              {/* soft radial glow */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(55% 50% at 50% 60%, rgba(217,108,157,0.18), transparent 70%)",
                }}
              />
              <motion.img
                key={activeImg}
                src={images[activeImg]}
                alt={product.arabic_title || product.name}
                loading="eager"
                fetchPriority="high"
                className="relative z-[1] w-full h-full object-contain drop-shadow-[0_25px_35px_rgba(180,90,130,0.25)]"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={
                  reduce
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 1, scale: 1, y: [0, -6, 0] }
                }
                transition={
                  reduce
                    ? { duration: 0.4 }
                    : { opacity: { duration: 0.4 }, scale: { duration: 0.5 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }
                }
              />
              {discount && (
                <span className="absolute top-4 right-4 z-[2] inline-flex items-center bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-full shadow-soft ring-1 ring-white/40">
                  -{discount}%
                </span>
              )}
              {product.is_limited && (
                <span className="absolute top-4 left-4 z-[2] inline-flex items-center gap-1 bg-gradient-to-br from-gold to-amber-300 text-foreground text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-soft ring-1 ring-white/40">
                  <Sparkles className="h-3 w-3" /> كمية محدودة
                </span>
              )}
              <div className="absolute bottom-4 left-4 right-4 z-[2] flex flex-wrap gap-2 justify-center">
                <span className="bg-background/90 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-full text-primary shadow-soft">
                  🇩🇪 منتج ألماني أصلي
                </span>
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`صورة ${i + 1}`}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 bg-white p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      activeImg === i
                        ? "border-primary shadow-[0_8px_20px_-8px_rgba(217,108,157,0.5)] scale-[1.03]"
                        : "border-border/60 opacity-70 hover:opacity-100 hover:border-primary/40"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] font-semibold text-primary bg-primary/8 border border-primary/20 px-2.5 py-1 rounded-full">
                  <BadgeCheck className="h-3 w-3" /> {product.brand}
                </span>
              )}
              {(product as any).sub_category && (
                <span className="text-xs bg-secondary/70 border border-border px-2.5 py-1 rounded-full">{(product as any).sub_category}</span>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight text-foreground/90">
              {product.arabic_title || product.name}
            </h1>
            <p className="text-sm text-muted-foreground/80" dir="ltr">{product.name}</p>

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

            {/* Price block */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-4xl font-bold text-primary tracking-tight leading-none">
                {formatEGP(Number(product.price))}
              </span>
              {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatEGP(Number(product.compare_at_price))}</span>
                  {discount && (
                    <span className="inline-flex items-center bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                      وفّري {discount}%
                    </span>
                  )}
                </>
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

            {/* Quantity + status */}
            <div className="flex items-center gap-4 py-4 border-y border-border/60">
              <span className="text-sm font-medium">الكمية:</span>
              <div className="flex items-center bg-card border border-border rounded-full shadow-[0_4px_14px_-6px_rgba(217,108,157,0.25)]">
                <button
                  onClick={decQty}
                  aria-label="إنقاص"
                  className="p-2.5 hover:bg-primary/10 hover:text-primary rounded-r-full transition-colors disabled:opacity-40"
                  disabled={qty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold tabular-nums">{qty}</span>
                <button
                  onClick={incQty}
                  aria-label="زيادة"
                  className="p-2.5 hover:bg-primary/10 hover:text-primary rounded-l-full transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  isComingSoonProduct
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : isOutProduct
                    ? "text-destructive bg-destructive/10 border-destructive/30"
                    : "text-emerald-700 bg-emerald-50 border-emerald-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isComingSoonProduct ? "bg-amber-500" : isOutProduct ? "bg-destructive" : "bg-emerald-500 animate-pulse"
                  }`}
                />
                {statusLabel}
              </span>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleBuyNow}
                disabled={notPurchasable}
                className="group relative inline-flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-base
                  bg-gradient-to-br from-primary to-[#C95588] text-primary-foreground
                  shadow-[0_18px_38px_-12px_rgba(217,108,157,0.7)]
                  transition-all duration-300 ease-out
                  hover:shadow-[0_22px_44px_-12px_rgba(217,108,157,0.85)] hover:-translate-y-0.5
                  active:translate-y-0 active:scale-[0.98]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:bg-muted disabled:bg-none disabled:text-muted-foreground disabled:shadow-none"
              >
                <Zap className="h-4 w-4 transition-transform group-hover:-rotate-12" /> اشتري الآن
              </button>
              <button
                onClick={handleAdd}
                disabled={notPurchasable}
                className="group inline-flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-base
                  bg-card border-2 border-primary/80 text-primary
                  hover:bg-primary hover:text-primary-foreground hover:border-primary
                  transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-card disabled:hover:text-primary"
              >
                <ShoppingBag className="h-4 w-4" /> أضيفي للسلة
              </button>
            </div>

            {brand.whatsapp ? (
              <a
                href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(waMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("whatsapp_clicked", { source: "product_page", product_id: product.id, product_name: product.name })}
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full font-medium text-sm text-[#1FAA52] bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60"
              >
                <MessageCircle className="h-4 w-4" /> أو تواصلي عبر واتساب
              </a>
            ) : null}

            {/* Reassurance card */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { icon: ShieldCheck, label: "منتج ألماني أصلي" },
                { icon: Wallet, label: "الدفع عند الاستلام" },
                { icon: MessageCircle, label: "تأكيد الطلب عبر واتساب" },
                { icon: Truck, label: "توصيل داخل مصر" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 bg-gradient-to-br from-card to-secondary/30 border border-border/60 rounded-xl text-xs sm:text-[13px]"
                >
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <b.icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{b.label}</span>
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
            <h3 className="font-display text-xl font-semibold mb-1">شاركينا رأيك</h3>
            <p className="text-xs text-muted-foreground mb-4">يتم مراجعة التقييم قبل ظهوره</p>
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

      {/* Sticky mobile buy bar — sits above MobileBottomBar (h≈56px) */}
      <div
        className="md:hidden fixed inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-10px_30px_-10px_rgba(58,36,48,0.18)] px-4 py-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 56px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground">السعر</span>
            <span className="text-lg font-bold text-primary tabular-nums">{formatEGP(Number(product.price) * qty)}</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={notPurchasable}
            aria-label="أضيفي للسلة"
            className="h-12 w-12 shrink-0 rounded-full border-2 border-primary text-primary flex items-center justify-center active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
          <button
            onClick={handleBuyNow}
            disabled={notPurchasable}
            className="flex-1 h-12 rounded-full font-semibold text-sm bg-gradient-to-br from-primary to-[#C95588] text-primary-foreground shadow-[0_12px_28px_-10px_rgba(217,108,157,0.7)] active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:bg-none disabled:text-muted-foreground disabled:shadow-none inline-flex items-center justify-center gap-2"
          >
            {notPurchasable ? (isComingSoonProduct ? "قريباً" : "نفد المخزون") : (<><Zap className="h-4 w-4" /> اشتري الآن</>)}
          </button>
        </div>
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
