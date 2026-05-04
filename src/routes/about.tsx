import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useBrand } from "@/hooks/use-brand";
import { Sparkles, Heart, ShieldCheck, Truck, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — The Girl House" },
      { name: "description", content: "تعرّفي على The Girl House — وجهتك لمنتجات DM الألمانية الأصلية في مصر بأسعار مناسبة وتوصيل سريع." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const brand = useBrand();
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl" dir="rtl">
        <h1 className="font-display text-4xl font-bold mb-4 text-primary">من نحن</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          The Girl House هي وجهتك الأولى لمنتجات DM الألمانية الأصلية في مصر. بدأنا
          من شغف حقيقي بمنتجات العناية الألمانية المعروفة بجودتها العالية وأسعارها
          الصديقة، وقررنا نوفرها لكل بنت في مصر بدون ما تحتاج تسافر أو تدفع تكاليف
          شحن دولي مكلفة.
        </p>

        <h2 className="font-display text-2xl font-semibold mb-3">رسالتنا</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          نوفّرلك أصلي ١٠٠٪ من ماركات Balea، Schaebens، Nivea، وغيرهم من ماركات DM
          الألمانية، ونوصّلهملك لحد باب بيتك في كل محافظات مصر.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: ShieldCheck, t: "أصلية ١٠٠٪", d: "كل المنتجات مستوردة مباشرة من DM ألمانيا" },
            { icon: Truck, t: "توصيل لكل مصر", d: "خدمة سريعة لكل المحافظات" },
            { icon: Heart, t: "خدمة راقية", d: "فريق دعم بيرد عليكي بسرعة وحب" },
            { icon: Sparkles, t: "تشكيلة منتقاة", d: "بنختار بعناية المنتجات اللي تناسب البنت المصرية" },
          ].map((b, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 flex gap-3">
              <b.icon className="h-6 w-6 text-primary shrink-0" />
              <div>
                <div className="font-semibold mb-1">{b.t}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.d}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl font-semibold mb-3">تواصلي معانا</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> <a className="hover:text-primary" href={`mailto:${brand.contact_email}`}>{brand.contact_email}</a></li>
          {brand.whatsapp && (
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> <a className="hover:text-primary" href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noreferrer">+{brand.whatsapp}</a></li>
          )}
        </ul>
      </div>
    </PublicLayout>
  );
}
