import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "سياسة الخصوصية — The Girl House" }] }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl" dir="rtl">
        <h1 className="font-display text-3xl font-bold mb-6 text-primary">سياسة الخصوصية</h1>
        <p className="text-muted-foreground leading-loose mb-4">
          في The Girl House بنحترم خصوصيتك ونحمي بياناتك. الصفحة دي بتوضح إزاي
          بنجمع ونستخدم ونحمي بياناتك الشخصية.
        </p>
        <h2 className="font-display text-xl font-semibold mt-6 mb-2">البيانات اللي بنجمعها</h2>
        <ul className="list-disc pr-5 space-y-2 text-muted-foreground">
          <li>الاسم ورقم الموبايل والإيميل لإتمام الطلبات.</li>
          <li>عنوان الشحن لتوصيل الطلبات.</li>
          <li>بيانات تصفّح الموقع لتحسين تجربة المستخدم.</li>
        </ul>
        <h2 className="font-display text-xl font-semibold mt-6 mb-2">استخدام البيانات</h2>
        <p className="text-muted-foreground leading-loose">
          بنستخدم بياناتك فقط لإتمام طلباتك والتواصل معاكي بخصوصها وإرسال عروض
          خاصة (لو وافقتي). مش بنشارك بياناتك مع أي طرف ثالث غير شركات الشحن
          المعتمدة لإيصال الطلب لباب بيتك.
        </p>
        <h2 className="font-display text-xl font-semibold mt-6 mb-2">حقوقك</h2>
        <p className="text-muted-foreground leading-loose">
          تقدري في أي وقت تطلبي حذف بياناتك أو تعديلها أو إلغاء الاشتراك في
          النشرة البريدية بمراسلتنا.
        </p>
      </div>
    </PublicLayout>
  );
}
