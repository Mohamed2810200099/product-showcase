import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Music2, MessageCircle, Mail, MapPin } from "lucide-react";
import { useBrand } from "@/hooks/use-brand";

export function Footer() {
  const brand = useBrand();
  const socials: { url: string; label: string; icon: any }[] = [
    { url: brand.instagram, label: "Instagram", icon: Instagram },
    { url: brand.tiktok, label: "TikTok", icon: Music2 },
    { url: brand.facebook, label: "Facebook", icon: Facebook },
    ...(brand.whatsapp ? [{ url: `https://wa.me/${brand.whatsapp}`, label: "WhatsApp", icon: MessageCircle }] : []),
  ].filter((s) => s.url && /^https?:\/\//i.test(s.url.trim()));

  return (
    <footer className="bg-secondary mt-20 border-t border-border">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl text-primary font-semibold mb-3">The Girl House</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            وجهتك الأولى لمنتجات DM الألمانية الأصلية في مصر — أصلية ١٠٠٪، أسعار صديقة، توصيل لكل المحافظات.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-2 mt-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(s.url, "_blank", "noopener,noreferrer");
                  }}
                  className="p-2 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-muted-foreground hover:text-primary">الرئيسية</Link></li>
            <li><Link to="/shop" className="text-muted-foreground hover:text-primary">المتجر</Link></li>
            <li><Link to="/offers" className="text-muted-foreground hover:text-primary">العروض</Link></li>
            <li><Link to="/about" className="text-muted-foreground hover:text-primary">من نحن</Link></li>
            <li><Link to="/cart" className="text-muted-foreground hover:text-primary">سلة التسوق</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">سياسات المتجر</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/return-policy" className="text-muted-foreground hover:text-primary">سياسة الإرجاع والاستبدال</Link></li>
            <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-primary">سياسة الخصوصية</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">خدمة العملاء</h4>
          <ul className="space-y-2 text-sm">
            {brand.whatsapp && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <a
                  href={`https://wa.me/${brand.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`https://wa.me/${brand.whatsapp}`, "_blank", "noopener,noreferrer");
                  }}
                  className="hover:text-primary"
                >
                  +{brand.whatsapp}
                </a>
              </li>
            )}
            <li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> <a href={`mailto:${brand.contact_email}`} className="hover:text-primary">{brand.contact_email}</a></li>
            <li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> القاهرة، مصر</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Girl House — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
