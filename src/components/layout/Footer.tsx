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
    <footer className="relative z-10 mt-20 border-t border-white/10 bg-[#3A2430] text-[#F8DCE5]">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl text-white font-semibold mb-3">The Girl House</h3>
          <p className="text-sm text-[#F8DCE5]/75 leading-relaxed">
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
                  className="p-2 rounded-full bg-white/10 hover:bg-[#D96C9D] hover:text-white text-[#F8DCE5] transition"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-white">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-[#F8DCE5]/75 hover:text-white">الرئيسية</Link></li>
            <li><Link to="/shop" className="text-[#F8DCE5]/75 hover:text-white">المتجر</Link></li>
            <li><Link to="/offers" className="text-[#F8DCE5]/75 hover:text-white">العروض</Link></li>
            <li><Link to="/about" className="text-[#F8DCE5]/75 hover:text-white">من نحن</Link></li>
            <li><Link to="/cart" className="text-[#F8DCE5]/75 hover:text-white">سلة التسوق</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-white">سياسات المتجر</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/return-policy" className="text-[#F8DCE5]/75 hover:text-white">سياسة الإرجاع والاستبدال</Link></li>
            <li><Link to="/privacy-policy" className="text-[#F8DCE5]/75 hover:text-white">سياسة الخصوصية</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3 text-white">خدمة العملاء</h4>
          <ul className="space-y-2 text-sm">
            {brand.whatsapp && (
              <li className="flex items-center gap-2 text-[#F8DCE5]/75">
                <MessageCircle className="h-4 w-4" />
                <a
                  href={`https://wa.me/${brand.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`https://wa.me/${brand.whatsapp}`, "_blank", "noopener,noreferrer");
                  }}
                  className="hover:text-white"
                >
                  +{brand.whatsapp}
                </a>
              </li>
            )}
            <li className="flex items-center gap-2 text-[#F8DCE5]/75"><Mail className="h-4 w-4" /> <a href={`mailto:${brand.contact_email}`} className="hover:text-white">{brand.contact_email}</a></li>
            <li className="flex items-center gap-2 text-[#F8DCE5]/75"><MapPin className="h-4 w-4" /> القاهرة، مصر</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-[#F8DCE5]/60">
        © {new Date().getFullYear()} The Girl House — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
