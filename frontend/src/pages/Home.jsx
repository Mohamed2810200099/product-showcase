import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Truck, ShieldCheck, MessageCircle, Star, ArrowLeft, Instagram, Heart,
  Flower2, Droplets, Zap, Gift, Leaf, Moon, Flame, Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { useSettings } from "@/context/SettingsContext";

const CATEGORY_ICONS = {
  haircare: Sparkles, skincare: Flower2, masks: Moon, body: Droplets,
  serums: Zap, oils: Leaf, bundles: Gift,
};

const Home = () => {
  const { settings, categories, whatsappLink } = useSettings();
  const [loading, setLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [offers, setOffers] = useState([]);
  const [limited, setLimited] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [b, n, o, l, t] = await Promise.all([
          api.get("/products", { params: { is_best_seller: true, limit: 8 } }),
          api.get("/products", { params: { is_new_arrival: true, limit: 8 } }),
          api.get("/products", { params: { is_offer: true, limit: 8 } }),
          api.get("/products", { params: { limit: 50 } }),
          api.get("/testimonials"),
        ]);
        setBestSellers(b.data);
        setNewArrivals(n.data);
        setOffers(o.data);
        setLimited(l.data.filter((p) => p.is_limited || p.stock <= 5).slice(0, 4));
        setTestimonials(t.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shopCats = categories.filter((c) => !c.concern).slice(0, 7);

  return (
    <div className="overflow-hidden" data-testid="home-page">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-blush-50 via-white to-champagne-50 overflow-hidden">
        <div className="absolute inset-0 noise" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 text-right"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-blush-200 text-xs font-semibold text-blush-600 tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                حصري — منتجات DM الألمانية
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.15] text-ink">
                {settings.hero_title || "منتجات عناية ألمانية أصلية وصلت مصر"}
              </h1>
              <p className="text-base lg:text-lg text-ink-soft leading-loose max-w-xl">
                {settings.hero_subtitle ||
                  "اختاري منتجات DM الألمانية للعناية بالشعر والبشرة، مع توصيل داخل مصر وتجربة شراء سهلة وآمنة."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-all shadow-soft hover:shadow-glow"
                  data-testid="hero-shop-cta"
                >
                  تسوقي الآن
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <a
                  href={whatsappLink("السلام عليكم، حابة أستفسر عن منتجاتكم")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[#25D366] text-white font-semibold hover:bg-emerald-600 transition-colors shadow-soft"
                  data-testid="hero-whatsapp-cta"
                >
                  <MessageCircle className="w-4 h-4" />
                  اطلبي عبر واتساب
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs lg:text-sm text-ink-soft">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-champagne-400 text-champagne-400" />
                  <span>تقييم 4.9 من 500+ عميلة</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>منتجات أصلية 100%</span>
                </div>
              </div>
            </motion.div>

            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-soft">
                <img
                  src={settings.hero_image || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000"}
                  alt="The Girl House"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
              </div>

              {/* Floating chips */}
              <motion.div
                animate={{ y: [0, -18, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 lg:-right-8 bg-white rounded-2xl shadow-soft px-4 py-3 flex items-center gap-3 border border-blush-100"
              >
                <div className="w-10 h-10 rounded-xl bg-champagne-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-champagne-400" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-ink-muted">أفضل مبيع</p>
                  <p className="text-sm font-semibold text-ink">Balea Hair Mask</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 left-4 lg:-left-8 bg-white rounded-2xl shadow-soft px-4 py-3 flex items-center gap-3 border border-blush-100"
              >
                <div className="w-10 h-10 rounded-xl bg-blush-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-blush-500 fill-blush-500" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-ink-muted">وصل حديثًا</p>
                  <p className="text-sm font-semibold text-ink">Vitamin C Serum</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-y border-blush-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {[
            { icon: ShieldCheck, title: "منتجات مختارة من ألمانيا", sub: "جودة أوروبية" },
            { icon: Truck, title: "توصيل داخل مصر", sub: "لكل المحافظات" },
            { icon: Sparkles, title: "دفع عند الاستلام", sub: "بدون أي مقدم" },
            { icon: MessageCircle, title: "طلب سريع عبر واتساب", sub: "خدمة فورية" },
            { icon: Flame, title: "كميات محدودة", sub: "اطلبي قبل النفاد" },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-blush-50 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-4 h-4 text-blush-600" />
              </div>
              <div>
                <p className="font-display text-sm lg:text-base text-ink leading-tight">{b.title}</p>
                <p className="text-[11px] text-ink-muted">{b.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories quick nav */}
      <section className="py-14 bg-nude-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-2">
              Our Categories
            </p>
            <h2 className="font-display text-3xl lg:text-4xl text-ink">تسوقي حسب القسم</h2>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-7 gap-3 lg:gap-4">
            {shopCats.map((c, i) => {
              const Icon = CATEGORY_ICONS[c.slug] || Sparkles;
              return (
                <motion.div
                  key={c.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={`/shop?category=${c.slug}`}
                    className="group block bg-white rounded-3xl p-4 lg:p-6 text-center hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
                    data-testid={`home-cat-${c.slug}`}
                  >
                    <div className="w-14 h-14 lg:w-16 lg:h-16 mx-auto rounded-2xl bg-gradient-to-br from-blush-100 to-champagne-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-blush-600" />
                    </div>
                    <p className="text-sm lg:text-base font-medium text-ink">{c.name_ar}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <ProductSection
        title="الأكثر طلبًا"
        subtitle="Best Sellers"
        desc="المنتجات اللي بنات مصر بيطلبوها أكتر"
        products={bestSellers}
        loading={loading}
        link="/shop?is_best_seller=true"
        testId="home-best-sellers"
      />

      {/* Limited Stock — Urgency section */}
      {limited.length > 0 && (
        <section className="py-14 bg-gradient-to-br from-blush-500 via-blush-400 to-blush-500 text-white relative overflow-hidden" data-testid="home-limited-stock">
          <div className="absolute inset-0 noise opacity-40" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold tracking-wide">اطلبي قبل النفاد</span>
                </div>
                <h2 className="font-display text-3xl lg:text-4xl">كميات محدودة جدًا</h2>
                <p className="mt-1 text-white/80 text-sm">المنتجات دي أوشكت على النفاد — اغتنمي الفرصة</p>
              </div>
              <Link
                to="/shop"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white text-blush-600 px-5 py-2.5 rounded-full hover:bg-ink hover:text-white transition-colors"
              >
                عرض الكل <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {limited.map((p, i) => <ProductCard key={p.id} product={p} idx={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Why German DM */}
      <section className="py-16 bg-gradient-to-br from-champagne-50 via-white to-blush-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900"
              alt="DM German products"
              className="rounded-[2rem] shadow-soft w-full"
            />
            <div className="absolute -bottom-6 -right-6 lg:-left-6 lg:right-auto bg-white rounded-2xl px-5 py-4 shadow-soft border border-blush-100">
              <p className="text-3xl font-display text-blush-600">100%</p>
              <p className="text-xs text-ink-muted">منتجات أصلية</p>
            </div>
          </div>
          <div className="space-y-5">
            <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin">
              Why DM Germany
            </p>
            <h2 className="font-display text-3xl lg:text-4xl text-ink leading-tight">
              ليه منتجات DM الألمانية؟
            </h2>
            <ul className="space-y-3">
              {[
                "جودة أوروبية معتمدة وموثوقة",
                "أسماء بنات كل العالم بتحبها: Balea, Alverde, Plex Care",
                "مختارين بعناية لتناسب البشرة والشعر المصري",
                "مستوردين مباشر من ألمانيا بدون وسطاء",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blush-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Sparkles className="w-3 h-3 text-blush-600" />
                  </div>
                  <span className="text-ink-soft leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <ProductSection
        title="وصل حديثًا"
        subtitle="New Arrivals"
        desc="أحدث منتجاتنا اللي لسه واصلة من ألمانيا"
        products={newArrivals}
        loading={loading}
        link="/shop?is_new_arrival=true"
        testId="home-new-arrivals"
      />

      {/* Offers */}
      <ProductSection
        title="عروض لا تفوّتيها"
        subtitle="Special Offers"
        desc="خصومات محدودة على منتجاتنا المفضلة"
        products={offers}
        loading={loading}
        link="/shop?is_offer=true"
        testId="home-offers"
        dark
      />

      {/* Before / After inspired section (no medical claims) */}
      <section className="py-16 bg-gradient-to-br from-nude-50 to-blush-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-2">Real Results</p>
            <h2 className="font-display text-3xl lg:text-4xl text-ink">تجربة روتين العناية</h2>
            <p className="mt-2 text-sm text-ink-muted max-w-xl mx-auto">
              استخدام منتجاتنا الألمانية بانتظام يساعد على الحصول على مظهر بشرة أكثر نضارة وشعر بمظهر أنعم
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "روتين الشعر التالف",
                desc: "شامبو + ماسك + زيت — ثلاثي يساعد على تحسين ملمس الشعر وإحساس أنعم",
                img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
                duration: "٢١ يوم",
              },
              {
                title: "روتين الإشراقة",
                desc: "غسول + سيروم + كريم ترطيب — يدعم مظهر بشرة أكثر إشراقة وتوحيد اللون",
                img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800",
                duration: "٣٠ يوم",
              },
              {
                title: "روتين الترطيب",
                desc: "ماسك + سيروم ترطيب — يمنح إحساسًا بالنعومة ومظهر بشرة مشبّعة بالترطيب",
                img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
                duration: "١٤ يوم",
              },
            ].map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-3xl overflow-hidden border border-blush-100 hover:shadow-soft transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden bg-blush-50">
                  <img src={r.img} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] text-blush-600 mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-bold tracking-wide">خلال {r.duration}</span>
                  </div>
                  <h3 className="font-display text-xl text-ink mb-1">{r.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-ink-muted mt-6 max-w-2xl mx-auto">
            * النتائج تختلف من شخص لآخر. المنتجات لا تقدّم ادعاءات طبية، وهي منتجات عناية جمالية عادية.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-2">
              Testimonials
            </p>
            <h2 className="font-display text-3xl lg:text-4xl text-ink">آراء عميلاتنا</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {(testimonials.length > 0 ? testimonials : []).slice(0, 3).map((t, i) => (
              <motion.div
                key={t.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-gradient-to-br from-blush-50 to-white border border-blush-100 rounded-3xl p-6 relative"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating || 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-champagne-400 text-champagne-400" />
                  ))}
                </div>
                <p className="text-ink-soft leading-relaxed text-sm mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blush-200 flex items-center justify-center font-display text-blush-700">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{t.name}</p>
                    <p className="text-xs text-ink-muted">{t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram CTA */}
      <section className="py-16 gradient-nude">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Instagram className="w-10 h-10 mx-auto text-blush-600 mb-4" />
          <h2 className="font-display text-3xl lg:text-4xl text-ink mb-3">
            تابعينا على إنستجرام
          </h2>
          <p className="text-ink-soft mb-6 max-w-xl mx-auto">
            أول من يعرف بوصول المنتجات الجديدة، العروض الحصرية، ونصايح الجمال اليومية
          </p>
          <a
            href={settings.instagram || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-ink text-white font-semibold hover:bg-blush-600 transition-colors"
            data-testid="instagram-cta"
          >
            <Instagram className="w-4 h-4" />
            @thegirlhouse_eg
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 bg-blush-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 noise opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl mb-3">
            اشتركي عشان توصلك العروض أول بأول
          </h2>
          <p className="text-white/80 mb-6">
            اكتبي رقم واتساب واحنا هنبعتلك كل جديد وعروضنا الحصرية
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
};

const NewsletterForm = () => {
  const { whatsappLink } = useSettings();
  const [phone, setPhone] = useState("");
  return (
    <a
      href={whatsappLink(`أهلاً، أحب أشترك في قائمة عروض The Girl House. رقمي: ${phone || "—"}`)}
      target="_blank"
      rel="noreferrer"
      className="inline-block"
    >
      <div className="flex gap-2 bg-white rounded-full p-1.5 max-w-md mx-auto">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01xxxxxxxxx"
          className="flex-1 px-4 py-2 bg-transparent outline-none text-ink text-sm"
          data-testid="newsletter-phone"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-full bg-ink text-white text-sm font-semibold hover:bg-blush-600 transition-colors"
          data-testid="newsletter-submit"
        >
          اشتركي
        </button>
      </div>
    </a>
  );
};

const ProductSection = ({ title, subtitle, desc, products, loading, link, testId, dark }) => (
  <section className={`py-16 ${dark ? "bg-ink text-white" : "bg-white"}`} data-testid={testId}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-10 gap-4">
        <div>
          <p className={`text-xs tracking-[0.3em] uppercase font-latin mb-2 ${dark ? "text-champagne-200" : "text-champagne-400"}`}>
            {subtitle}
          </p>
          <h2 className={`font-display text-3xl lg:text-4xl ${dark ? "text-white" : "text-ink"}`}>
            {title}
          </h2>
          {desc && <p className={`mt-2 text-sm ${dark ? "text-white/60" : "text-ink-muted"}`}>{desc}</p>}
        </div>
        <Link
          to={link}
          className={`hidden sm:inline-flex items-center gap-2 text-sm font-medium ${dark ? "text-champagne-200 hover:text-white" : "text-blush-600 hover:text-ink"} transition-colors`}
        >
          عرض الكل
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} idx={i} />)}
      </div>
      <div className="text-center mt-8 sm:hidden">
        <Link to={link} className={`inline-flex items-center gap-2 text-sm font-medium ${dark ? "text-champagne-200" : "text-blush-600"}`}>
          عرض الكل <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </section>
);

export default Home;
