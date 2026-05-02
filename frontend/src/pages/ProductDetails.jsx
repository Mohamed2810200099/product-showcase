import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag, MessageCircle, Truck, ShieldCheck, Share2, Star, Check,
  Plus, Minus, Sparkles, ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { api, formatEGP, resolveImg } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { whatsappLink } = useSettings();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [related, setRelated] = useState([]);
  const [tab, setTab] = useState("description");
  const [faqOpen, setFaqOpen] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ customer_name: "", rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setQty(1);
      setActiveImg(0);
      try {
        const { data } = await api.get(`/products/${slug}`);
        setProduct(data);
        const [r, reviewsRes] = await Promise.all([
          api.get("/products", { params: { category: data.category_slug, limit: 8 } }),
          api.get(`/reviews/${data.id}`),
        ]);
        setRelated(r.data.filter((p) => p.id !== data.id).slice(0, 4));
        setReviews(reviewsRes.data);
      } catch {
        toast.error("المنتج غير موجود");
        navigate("/shop");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, navigate]);

  if (loading || !product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-ink-muted">جاري التحميل...</div>
      </div>
    );
  }

  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : 0;
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`تمت إضافة ${qty} قطعة للسلة`);
  };
  const handleBuyNow = () => {
    addItem(product, qty);
    navigate("/checkout");
  };

  const faqs = [
    { q: "هل المنتج أصلي؟", a: "نعم، كل منتجاتنا أصلية 100% من متاجر DM الألمانية." },
    { q: "كم يستغرق التوصيل؟", a: "من 2 إلى 5 أيام عمل لكل محافظات مصر." },
    { q: "هل يمكن الدفع عند الاستلام؟", a: "نعم، الدفع عند الاستلام متاح لكل المحافظات." },
    { q: "هل يمكن إرجاع المنتج؟", a: "الإرجاع متاح خلال 48 ساعة إذا كان المنتج مختوم ولم يُفتح." },
  ];

  return (
    <div className="bg-white" data-testid="product-details-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-ink-muted mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-blush-600">الرئيسية</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-blush-600">المتجر</Link>
          <span>/</span>
          <span className="text-ink">{product.name_ar || product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-3">
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square rounded-[2rem] overflow-hidden bg-blush-50"
            >
              <img
                src={resolveImg(product.images?.[activeImg] || product.images?.[0])}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <span className="absolute top-4 right-4 bg-blush-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                  -{discount}%
                </span>
              )}
            </motion.div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                      i === activeImg ? "border-blush-500" : "border-transparent"
                    }`}
                  >
                    <img src={resolveImg(img)} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {product.is_best_seller && (
                <span className="text-[11px] px-2.5 py-1 bg-ink text-white rounded-full font-bold">
                  الأكثر مبيعًا
                </span>
              )}
              {product.is_new_arrival && (
                <span className="text-[11px] px-2.5 py-1 bg-champagne-400 text-ink rounded-full font-bold">
                  جديد
                </span>
              )}
              {product.is_limited && (
                <span className="text-[11px] px-2.5 py-1 bg-blush-500 text-white rounded-full font-bold">
                  كمية محدودة
                </span>
              )}
              <span className="text-[11px] px-2.5 py-1 bg-champagne-50 text-champagne-400 border border-champagne-200 rounded-full font-bold">
                🇩🇪 From Germany
              </span>
              <span className="text-[11px] px-2.5 py-1 bg-blush-50 text-blush-600 border border-blush-200 rounded-full font-bold">
                DM Product
              </span>
            </div>

            <div>
              <p className="text-xs text-champagne-400 font-latin tracking-[0.25em] uppercase mb-2">
                {product.brand}
              </p>
              <h1 className="font-display text-3xl lg:text-4xl text-ink leading-tight">
                {product.name_ar || product.name}
              </h1>
              {product.name_ar && product.name !== product.name_ar && (
                <p className="font-latin italic text-ink-muted mt-1">{product.name}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating)
                        ? "fill-champagne-400 text-champagne-400"
                        : "text-blush-100"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-ink-soft">
                {product.rating} ({product.reviews_count} تقييم)
              </span>
            </div>

            <p className="text-ink-soft leading-loose">{product.short_description}</p>

            <div className="flex items-baseline gap-3 pb-5 border-b border-blush-100">
              <span className="text-3xl lg:text-4xl font-bold text-blush-600 font-body">
                {formatEGP(product.price)}
              </span>
              {product.old_price && product.old_price > product.price && (
                <span className="text-lg text-ink-muted line-through">
                  {formatEGP(product.old_price)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm">
              {outOfStock ? (
                <span className="text-rose-600 font-semibold">نفذت الكمية حاليًا</span>
              ) : product.stock <= 5 ? (
                <span className="text-blush-600 font-semibold">
                  ⚡ باقي {product.stock} قطع فقط
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">متوفر ({product.stock} قطعة)</span>
                </>
              )}
            </div>

            {/* Qty + actions */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center bg-blush-50 rounded-full p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                  aria-label="نقصان"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                  aria-label="زيادة"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAdd}
                disabled={outOfStock}
                className="py-3.5 rounded-full border-2 border-ink text-ink font-semibold hover:bg-ink hover:text-white transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-40"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag className="w-4 h-4" />
                أضيفي للسلة
              </button>
              <button
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="py-3.5 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-colors disabled:opacity-40"
                data-testid="buy-now-btn"
              >
                اشتري الآن
              </button>
            </div>

            <a
              href={whatsappLink(`استفسار عن منتج: ${product.name}\n${window.location.href}`)}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#25D366] text-white font-semibold hover:bg-emerald-600 transition-colors"
              data-testid="whatsapp-order-btn"
            >
              <MessageCircle className="w-4 h-4" />
              اطلبي عبر واتساب
            </a>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-center">
              <Perk icon={Truck} text="توصيل سريع" sub="2-5 أيام" />
              <Perk icon={ShieldCheck} text="أصلي 100%" sub="من ألمانيا" />
              <Perk icon={Sparkles} text="دفع عند الاستلام" sub="لكل مصر" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14 lg:mt-20">
          <div className="flex flex-wrap gap-2 border-b border-blush-100 mb-6">
            {[
              { k: "description", l: "الوصف" },
              { k: "benefits", l: "الفوائد" },
              { k: "how_to_use", l: "طريقة الاستخدام" },
              { k: "ingredients", l: "المكونات" },
              { k: "delivery", l: "معلومات التوصيل" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.k
                    ? "border-blush-500 text-blush-600"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
                data-testid={`tab-${t.k}`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="prose max-w-none text-ink-soft leading-loose">
            {tab === "description" && <p>{product.description || product.short_description}</p>}
            {tab === "benefits" && (
              <ul className="space-y-2">
                {(product.benefits || []).map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
                {product.suitable_for?.length > 0 && (
                  <li className="mt-4 pt-4 border-t border-blush-100">
                    <strong className="text-ink">مناسب لـ: </strong>
                    {product.suitable_for.join("، ")}
                  </li>
                )}
              </ul>
            )}
            {tab === "how_to_use" && <p className="whitespace-pre-line">{product.how_to_use || "—"}</p>}
            {tab === "ingredients" && (
              <div>
                <p className="text-sm">{product.ingredients || "—"}</p>
                {product.warnings && (
                  <div className="mt-4 p-4 bg-blush-50 rounded-2xl text-sm">
                    <strong className="text-blush-700">تحذيرات: </strong>
                    {product.warnings}
                  </div>
                )}
              </div>
            )}
            {tab === "delivery" && (
              <ul className="space-y-2">
                <li>🚚 توصيل داخل مصر خلال 2-5 أيام عمل.</li>
                <li>💰 رسوم التوصيل تختلف حسب المحافظة (60-120 ج.م).</li>
                <li>🎁 توصيل مجاني للطلبات فوق 2000 ج.م.</li>
                <li>💳 متاح الدفع عند الاستلام، فودافون كاش، إنستاباي، أو عبر واتساب.</li>
              </ul>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-14">
          <h2 className="font-display text-2xl lg:text-3xl text-ink mb-6">تقييمات العميلات</h2>
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-blush-50/50 rounded-2xl p-6 text-center text-ink-muted text-sm">
                  لسه مفيش تقييمات. كوني أول واحدة تشاركي تجربتك ❤️
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="bg-white border border-blush-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blush-100 flex items-center justify-center font-display text-blush-700">
                          {r.customer_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-ink">{r.customer_name}</p>
                          <p className="text-[11px] text-ink-muted">
                            {new Date(r.created_at).toLocaleDateString("ar-EG")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-champagne-400 text-champagne-400" />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-ink-soft leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!reviewForm.customer_name.trim()) return toast.error("الاسم مطلوب");
                setSubmittingReview(true);
                try {
                  await api.post("/reviews", { ...reviewForm, product_id: product.id });
                  toast.success("شكرًا لكِ ❤️ هيظهر التقييم بعد المراجعة");
                  setReviewForm({ customer_name: "", rating: 5, comment: "" });
                } catch {
                  toast.error("فشل إرسال التقييم");
                } finally {
                  setSubmittingReview(false);
                }
              }}
              className="bg-blush-50/50 border border-blush-100 rounded-3xl p-5 h-fit sticky top-28 space-y-3"
              data-testid="review-form"
            >
              <h3 className="font-display text-lg text-ink">شاركينا تجربتك</h3>
              <input
                type="text"
                placeholder="اسمك"
                value={reviewForm.customer_name}
                onChange={(e) => setReviewForm({ ...reviewForm, customer_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-blush-200 bg-white outline-none focus:border-blush-500 text-sm"
                data-testid="review-name"
              />
              <div>
                <p className="text-xs text-ink-soft mb-1.5">تقييمك</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                      className="focus:outline-none"
                      data-testid={`review-star-${n}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          n <= reviewForm.rating
                            ? "fill-champagne-400 text-champagne-400"
                            : "text-blush-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={3}
                placeholder="رأيك في المنتج..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-blush-200 bg-white outline-none focus:border-blush-500 text-sm resize-none"
                data-testid="review-comment"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-blush-600 transition-colors disabled:opacity-50"
                data-testid="submit-review-btn"
              >
                {submittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14">
          <h2 className="font-display text-2xl lg:text-3xl text-ink mb-6">أسئلة شائعة</h2>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="bg-blush-50/50 rounded-2xl border border-blush-100 overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-right"
                  data-testid={`faq-${i}`}
                >
                  <span className="font-semibold text-ink">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === i && <p className="px-5 pb-4 text-ink-soft text-sm">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl lg:text-3xl text-ink mb-6">منتجات مشابهة</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p, i) => <ProductCard key={p.id} product={p} idx={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Perk = ({ icon: Icon, text, sub }) => (
  <div className="p-3 rounded-2xl bg-blush-50/50 border border-blush-100">
    <Icon className="w-4 h-4 mx-auto text-blush-600 mb-1" />
    <p className="text-xs font-semibold text-ink">{text}</p>
    <p className="text-[10px] text-ink-muted">{sub}</p>
  </div>
);

export default ProductDetails;
