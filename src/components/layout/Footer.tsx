import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Music2, MessageCircle, Mail, MapPin } from "lucide-react";
import { useBrand } from "@/hooks/use-brand";

export function Footer() {
  const brand = useBrand();
  return (
    <footer className="bg-secondary mt-20 border-t border-border">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <h3 className="font-display text-2xl text-primary font-semibold mb-3">The Girl House</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            وجهتك الأولى لمنتجات DM الألمانية الأصلية في مصر — أصلية ١٠٠٪، أسعار صديقة، توصيل لكل المحافظات.
          </p>
          <div className="flex gap-2 mt-4">
            <a href={brand.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="p-2 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={brand.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="p-2 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition">
              <Music2 className="h-4 w-4" />
            </a>
            <a href={brand.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="p-2 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition">
              <Facebook className="h-4 w-4" />
            </a>
            <a href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-2 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-muted-foreground hover:text-primary">الرئيسية</Link></li>
            <li><Link to="/shop" className="text-muted-foreground hover:text-primary">المتجر</Link></li>
            <li><Link to="/cart" className="text-muted-foreground hover:text-primary">سلة التسوق</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">خدمة العملاء</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="h-4 w-4" /> +{brand.whatsapp}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> <a href={`mailto:${brand.contact_email}`} className="hover:text-primary">{brand.contact_email}</a></li>
            <li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> القاهرة، مصر</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">عرضنا</h4>
          <p className="text-sm text-muted-foreground mb-3">
            استخدمي كود <span className="font-bold text-primary">WELCOME10</span> واحصلي على خصم ١٠٪ على أول طلب فوق ٥٠٠ ج.م
          </p>
          <Link to="/shop" className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition shadow-soft">
            تسوقي الآن
          </Link>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Girl House — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
