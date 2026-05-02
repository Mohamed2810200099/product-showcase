import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, Star, ShoppingBag, MessageCircle, ShieldCheck, Truck, Heart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useCart } from "@/context/CartContext";
import { useBrand } from "@/hooks/use-brand";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";

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
  const { add } = useCart();
  const brand = useBrand();
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

  if (isLoading) return <PublicLayout><div className="container mx-auto py-20 text-center">جاري التحميل…</div></PublicLayout>;
  if (!product) throw notFound();

  const images = ((product.images as string[]) ?? []).length > 0
    ? (product.images as string[])
    : ["https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=900&auto=format&fit=crop"];

  const discount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)
    : null;

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

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">الرئيسية</Link>
          <ArrowLeft className="h-3 w-3" />
          <Link to="/shop" className="hover:text-primary">المتجر</Link>
          <ArrowLeft className="h-3 w-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden relative">
              <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              {discount && (
                <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-full shadow-soft">
                  -{discount}%
                </span>
              )}
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
            {product.brand && <div className="text-xs uppercase tracking-widest text-muted-foreground">{product.brand}</div>}
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{product.name}</h1>

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

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{formatEGP(Number(product.price))}</span>
              {product.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through">{formatEGP(Number(product.compare_at_price))}</span>
              )}
            </div>

            {product.short_description && (
              <p className="text-muted-foreground leading-relaxed">{product.short_description}</p>
            )}

            <div className="flex items-center gap-4 py-3 border-y border-border">
              <span className="text-sm font-medium">الكمية:</span>
              <div className="flex items-center border border-border rounded-full">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 hover:bg-accent rounded-r-full"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="p-2 hover:bg-accent rounded-l-full"><Plus className="h-4 w-4" /></button>
              </div>
              <span className={`text-xs ${product.stock < 5 ? "text-destructive" : "text-muted-foreground"}`}>
                {product.stock > 0 ? `متاح ${product.stock} قطعة` : "نفد المخزون"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={product.stock === 0}
                onClick={() => {
                  add(
                    { id: product.id, name: product.name, slug: product.slug, price: Number(product.price), image: images[0] },
                    qty,
                  );
                  toast.success("تمت الإضافة للسلة 🛍️");
                }}
                className="bg-primary text-primary-foreground py-3.5 rounded-full font-medium shadow-elegant hover:opacity-90 transition disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" /> أضيفي للسلة
              </button>
              <a
                href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(`عايزة أطلب: ${product.name} بسعر ${formatEGP(Number(product.price))}`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] text-white py-3.5 rounded-full font-medium hover:opacity-90 transition inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" /> اطلبي عبر واتساب
              </a>
            </div>

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

            {product.description && (
              <div className="pt-4 border-t border-border">
                <h2 className="font-display text-xl font-semibold mb-2">الوصف</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* REVIEWS */}
        <section className="mt-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-bold mb-5">آراء العميلات</h2>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">لا توجد تقييمات بعد. كوني أول من يقيم! 💕</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r: any) => (
                  <li key={r.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{r.customer_name}</span>
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={submitReview} className="bg-secondary/40 rounded-2xl p-6 border border-border">
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
      </div>
    </PublicLayout>
  );
}
