import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "دخول الإدارة — The Girl House" }] }),
  component: AdminLoginPlaceholder,
});

function AdminLoginPlaceholder() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h1 className="font-display text-3xl font-bold mb-3">لوحة الإدارة</h1>
        <p className="text-muted-foreground mb-6">
          لوحة إدارة المنتجات والطلبات والكوبونات والتقييمات قادمة في المرحلة التالية 💕
        </p>
        <Link to="/" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full inline-block">
          العودة للرئيسية
        </Link>
      </div>
    </PublicLayout>
  );
}
