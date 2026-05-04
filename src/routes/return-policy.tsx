import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/return-policy")({
  head: () => ({ meta: [{ title: "سياسة الإرجاع والاستبدال — The Girl House" }] }),
  component: ReturnPolicy,
});

function ReturnPolicy() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm" dir="rtl">
        <h1 className="font-display text-3xl font-bold mb-6 text-primary">سياسة الإرجاع والاستبدال</h1>
        <p className="text-muted-foreground leading-loose">
          في The Girl House راحتك أولويتنا. لو وصلك المنتج تالف أو مش زي ما طلبتي،
          تقدري تتواصلي معانا خلال ٧٢ ساعة من استلام الطلب على الواتساب أو الإيميل
          وهنرتب عملية الاستبدال أو الإرجاع.
        </p>
        <h2 className="font-display text-xl font-semibold mt-8 mb-2">شروط الإرجاع</h2>
        <ul className="list-disc pr-5 space-y-2 text-muted-foreground">
          <li>المنتج لازم يكون بحالته الأصلية وغير مستخدم وفي العبوة الأصلية.</li>
          <li>منتجات العناية الشخصية المفتوحة لا تُرد لأسباب صحية.</li>
          <li>التواصل معانا خلال ٧٢ ساعة من الاستلام.</li>
          <li>المنتجات اللي عليها خصم أو ضمن عرض لا تُرد إلا في حالة العيب.</li>
        </ul>
        <h2 className="font-display text-xl font-semibold mt-8 mb-2">طريقة الإرجاع</h2>
        <p className="text-muted-foreground leading-loose">
          راسلينا على الواتساب أو الإيميل ومعاكي رقم الطلب وصور للمنتج، وفريقنا
          هيتواصل معاكي خلال ٢٤ ساعة لترتيب استلام المنتج.
        </p>
      </div>
    </PublicLayout>
  );
}
