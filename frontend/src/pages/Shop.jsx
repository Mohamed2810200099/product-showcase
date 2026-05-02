import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { v: "newest", l: "الأحدث" },
  { v: "price_asc", l: "السعر: من الأقل للأعلى" },
  { v: "price_desc", l: "السعر: من الأعلى للأقل" },
  { v: "best", l: "الأكثر مبيعًا" },
  { v: "offers", l: "العروض" },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = searchParams.get("category") || "";
  const concern = searchParams.get("concern") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const isOffer = searchParams.get("is_offer") === "true";
  const isBest = searchParams.get("is_best_seller") === "true";
  const isNew = searchParams.get("is_new_arrival") === "true";

  const shopCats = useMemo(() => categories.filter((c) => !c.concern), [categories]);
  const concerns = useMemo(() => categories.filter((c) => c.concern), [categories]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = { sort };
        if (category) params.category = category;
        if (concern) params.concern = concern;
        if (search) params.search = search;
        if (isOffer) params.is_offer = true;
        if (isBest) params.is_best_seller = true;
        if (isNew) params.is_new_arrival = true;
        const { data } = await api.get("/products", { params });
        setProducts(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [category, concern, search, sort, isOffer, isBest, isNew]);

  const updateParam = (key, value) => {
    const np = new URLSearchParams(searchParams);
    if (value) np.set(key, value);
    else np.delete(key);
    setSearchParams(np);
  };

  const clearAll = () => setSearchParams({});

  const activeFilters = [
    category && { key: "category", label: shopCats.find((c) => c.slug === category)?.name_ar },
    concern && { key: "concern", label: concerns.find((c) => c.slug === concern)?.name_ar },
    search && { key: "search", label: `"${search}"` },
    isOffer && { key: "is_offer", label: "عروض" },
    isBest && { key: "is_best_seller", label: "الأكثر مبيعًا" },
    isNew && { key: "is_new_arrival", label: "وصل حديثًا" },
  ].filter(Boolean);

  const Filters = () => (
    <div className="space-y-6">
      <FilterGroup title="الأقسام">
        <RadioRow
          label="كل المنتجات"
          checked={!category}
          onChange={() => updateParam("category", "")}
          testId="filter-all"
        />
        {shopCats.map((c) => (
          <RadioRow
            key={c.slug}
            label={c.name_ar}
            checked={category === c.slug}
            onChange={() => updateParam("category", c.slug)}
            testId={`filter-cat-${c.slug}`}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="حسب المشكلة">
        <RadioRow
          label="الكل"
          checked={!concern}
          onChange={() => updateParam("concern", "")}
        />
        {concerns.map((c) => (
          <RadioRow
            key={c.slug}
            label={c.name_ar}
            checked={concern === c.slug}
            onChange={() => updateParam("concern", c.slug)}
            testId={`filter-concern-${c.slug}`}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="مميزات">
        <label className="flex items-center justify-between py-2 text-sm cursor-pointer">
          <span>عروض</span>
          <input
            type="checkbox"
            checked={isOffer}
            onChange={(e) => updateParam("is_offer", e.target.checked ? "true" : "")}
            className="accent-blush-600"
            data-testid="filter-is-offer"
          />
        </label>
        <label className="flex items-center justify-between py-2 text-sm cursor-pointer">
          <span>الأكثر مبيعًا</span>
          <input
            type="checkbox"
            checked={isBest}
            onChange={(e) => updateParam("is_best_seller", e.target.checked ? "true" : "")}
            className="accent-blush-600"
            data-testid="filter-is-best"
          />
        </label>
        <label className="flex items-center justify-between py-2 text-sm cursor-pointer">
          <span>وصل حديثًا</span>
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => updateParam("is_new_arrival", e.target.checked ? "true" : "")}
            className="accent-blush-600"
            data-testid="filter-is-new"
          />
        </label>
      </FilterGroup>
    </div>
  );

  return (
    <div className="min-h-screen bg-nude-50" data-testid="shop-page">
      {/* Page header */}
      <section className="bg-gradient-to-br from-blush-50 to-white py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin">Our Shop</p>
          <h1 className="font-display text-3xl lg:text-5xl text-ink mt-2">متجر The Girl House</h1>
          <p className="text-ink-soft mt-2 text-sm lg:text-base">
            اختاري من بين {products.length || "عشرات"} منتج ألماني أصلي
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex lg:grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 bg-white rounded-3xl p-5 border border-blush-100 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl text-ink">التصفية</h3>
                {activeFilters.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-blush-600 hover:underline"
                    data-testid="clear-filters"
                  >
                    مسح الكل
                  </button>
                )}
              </div>
              <Filters />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Controls */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <button
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-blush-200 text-sm"
                onClick={() => setMobileFiltersOpen(true)}
                data-testid="mobile-filters-button"
              >
                <SlidersHorizontal className="w-4 h-4" />
                التصفية
                {activeFilters.length > 0 && (
                  <span className="bg-blush-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {activeFilters.length}
                  </span>
                )}
              </button>

              <select
                value={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="px-4 py-2.5 rounded-full bg-white border border-blush-200 text-sm focus:outline-none focus:border-blush-500"
                data-testid="sort-select"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            </div>

            {/* Active chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => updateParam(f.key, "")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blush-100 text-blush-700 rounded-full text-xs"
                  >
                    {f.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Products grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-blush-100">
                <p className="font-display text-2xl text-ink mb-2">لا توجد نتائج مطابقة</p>
                <p className="text-ink-muted text-sm mb-5">جربي تغيير عوامل التصفية</p>
                <button onClick={clearAll} className="px-5 py-2.5 rounded-full bg-ink text-white text-sm">
                  مسح التصفية
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {products.map((p, i) => <ProductCard key={p.id} product={p} idx={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85%] bg-white z-50 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-blush-100">
                <h3 className="font-display text-xl">التصفية</h3>
                <button onClick={() => setMobileFiltersOpen(false)} aria-label="إغلاق">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <Filters />
              </div>
              <div className="p-4 border-t border-blush-100 flex gap-2">
                <button
                  onClick={clearAll}
                  className="flex-1 py-3 rounded-full border border-blush-200 text-sm"
                >
                  مسح الكل
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 py-3 rounded-full bg-ink text-white text-sm font-semibold"
                >
                  عرض النتائج
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterGroup = ({ title, children }) => (
  <div>
    <h4 className="text-sm font-semibold text-ink mb-2 pb-2 border-b border-blush-100">{title}</h4>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const RadioRow = ({ label, checked, onChange, testId }) => (
  <button
    onClick={onChange}
    className={`flex items-center justify-between w-full py-1.5 text-sm transition-colors ${
      checked ? "text-blush-600 font-semibold" : "text-ink-soft hover:text-ink"
    }`}
    data-testid={testId}
  >
    <span>{label}</span>
    {checked && <Check className="w-4 h-4" />}
  </button>
);

export default Shop;
