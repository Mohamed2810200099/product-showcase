import React, { useEffect, useState } from "react";
import { Check, Trash2, Star, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending | approved | all

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "pending") params.approved = false;
      if (filter === "approved") params.approved = true;
      const { data } = await api.get("/admin/reviews", { params });
      setReviews(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const approve = async (id) => {
    try {
      await api.patch(`/admin/reviews/${id}/approve`);
      toast.success("تم الاعتماد");
      load();
    } catch {
      toast.error("فشل");
    }
  };

  const del = async (id) => {
    if (!window.confirm("متأكدة من الحذف؟")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      load();
      toast.success("تم الحذف");
    } catch {
      toast.error("فشل");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl" data-testid="admin-reviews-page">
      <div>
        <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-1">Reviews</p>
        <h1 className="font-display text-3xl text-ink">تقييمات المنتجات</h1>
      </div>

      <div className="flex gap-2">
        {[
          { v: "pending", l: "بانتظار الاعتماد" },
          { v: "approved", l: "معتمدة" },
          { v: "all", l: "الكل" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setFilter(t.v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === t.v
                ? "bg-ink text-white"
                : "bg-white border border-blush-200 text-ink-soft hover:text-ink"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-10 text-center text-ink-muted">جاري التحميل...</div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center text-ink-muted bg-white rounded-3xl border border-blush-100">
            لا توجد تقييمات
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="bg-white border border-blush-100 rounded-3xl p-5" data-testid={`review-row-${r.id}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blush-100 flex items-center justify-center font-display text-blush-700">
                    {r.customer_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{r.customer_name}</p>
                    <p className="text-[11px] text-ink-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleString("ar-EG")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-champagne-400 text-champagne-400" />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-ink-soft leading-relaxed mb-3">"{r.comment}"</p>}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${r.is_approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {r.is_approved ? "معتمد" : "بانتظار الاعتماد"}
                </span>
                <div className="flex gap-2">
                  {!r.is_approved && (
                    <button
                      onClick={() => approve(r.id)}
                      className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      اعتماد ونشر
                    </button>
                  )}
                  <button
                    onClick={() => del(r.id)}
                    className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
