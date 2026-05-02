import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, ShoppingBag, Package, Clock, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api, formatEGP, STATUS_LABELS, STATUS_COLORS, resolveImg } from "@/lib/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/stats/dashboard");
        setStats(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-ink-muted">جاري التحميل...</div>;
  }

  // Build chart data
  const byDate = {};
  (stats?.daily_orders || []).forEach((o) => {
    const d = new Date(o.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
    byDate[d] = (byDate[d] || 0) + (o.total || 0);
  });
  const chartData = Object.entries(byDate).map(([name, total]) => ({ name, total }));

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <p className="text-xs text-champagne-400 tracking-[0.3em] uppercase font-latin mb-1">
          Dashboard
        </p>
        <h1 className="font-display text-3xl text-ink">نظرة عامة</h1>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="إجمالي المبيعات"
          value={formatEGP(stats?.total_sales || 0)}
          color="emerald"
        />
        <StatCard
          icon={ShoppingBag}
          label="عدد الطلبات"
          value={stats?.total_orders || 0}
          color="blush"
        />
        <StatCard
          icon={Package}
          label="المنتجات النشطة"
          value={stats?.total_products || 0}
          color="champagne"
        />
        <StatCard
          icon={Clock}
          label="طلبات جديدة"
          value={stats?.status_counts?.new || 0}
          color="blue"
        />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
        {/* Chart */}
        <div className="bg-white rounded-3xl p-6 border border-blush-100">
          <h3 className="font-display text-lg mb-4">المبيعات — آخر 7 أيام</h3>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-muted text-sm">
                لا توجد بيانات كافية
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2D3D5" />
                  <XAxis dataKey="name" stroke="#8C8C8C" fontSize={11} />
                  <YAxis stroke="#8C8C8C" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #F2D3D5", borderRadius: 12 }}
                    formatter={(v) => formatEGP(v)}
                  />
                  <Line type="monotone" dataKey="total" stroke="#B76E79" strokeWidth={2} dot={{ fill: "#B76E79", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-3xl p-6 border border-blush-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">مخزون منخفض</h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-3">
            {(stats?.low_stock || []).length === 0 ? (
              <p className="text-sm text-ink-muted">كل المنتجات بها مخزون كافٍ</p>
            ) : (
              stats.low_stock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 text-sm">
                  <img src={resolveImg(p.images?.[0])} alt="" className="w-10 h-10 rounded-xl object-cover bg-blush-50 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-ink">{p.name_ar || p.name}</p>
                    <p className="text-rose-600 text-xs font-semibold">باقي {p.stock} قطع</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-3xl p-6 border border-blush-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">أحدث الطلبات</h3>
          <Link to="/admin/orders" className="text-sm text-blush-600 flex items-center gap-1 hover:underline">
            عرض الكل <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-ink-muted border-b border-blush-100">
                <th className="py-3 font-medium">رقم الطلب</th>
                <th className="py-3 font-medium">العميل</th>
                <th className="py-3 font-medium">المحافظة</th>
                <th className="py-3 font-medium">الإجمالي</th>
                <th className="py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent_orders || []).map((o) => (
                <tr key={o.id} className="border-b border-blush-50 last:border-0">
                  <td className="py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="py-3">{o.customer_name}</td>
                  <td className="py-3 text-ink-muted">{o.governorate}</td>
                  <td className="py-3 font-semibold text-blush-600">{formatEGP(o.total)}</td>
                  <td className="py-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.order_status]}`}>
                      {STATUS_LABELS[o.order_status]}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.recent_orders || stats.recent_orders.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-muted">لا توجد طلبات بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blush: "bg-blush-50 text-blush-600",
    champagne: "bg-champagne-50 text-champagne-400",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-3xl p-5 border border-blush-100">
      <div className={`w-10 h-10 rounded-2xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-2xl font-display text-ink mt-1">{value}</p>
    </div>
  );
};

export default AdminDashboard;
