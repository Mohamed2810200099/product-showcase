import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const Footer = () => {
  const { settings } = useSettings();
  return (
    <footer className="bg-ink text-white mt-16 pb-24 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="font-brand text-4xl mb-3">
              The Girl <span className="italic text-champagne-200">House</span>
            </div>
            <p className="text-white/70 text-sm leading-loose max-w-md">
              متجر متخصص في منتجات العناية والتجميل الألمانية الأصلية من DM. نوصل لكل محافظات مصر بتغليف فاخر وخدمة دعم سريعة.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href={settings.instagram || "#"}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-blush-500 transition-colors flex items-center justify-center"
                data-testid="footer-instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-emerald-500 transition-colors flex items-center justify-center"
                data-testid="footer-whatsapp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              {settings.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-blue-500 transition-colors flex items-center justify-center"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-champagne-200 font-display text-lg mb-4">تسوقي</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/shop">كل المنتجات</Link></li>
              <li><Link to="/shop?category=haircare">العناية بالشعر</Link></li>
              <li><Link to="/shop?category=skincare">العناية بالبشرة</Link></li>
              <li><Link to="/shop?is_offer=true">العروض</Link></li>
              <li><Link to="/shop?is_new_arrival=true">وصل حديثًا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-champagne-200 font-display text-lg mb-4">تواصلي معنا</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>واتساب: {settings.whatsapp_number}</li>
              <li>توصيل لكل مصر</li>
              <li>دعم متواصل يوميًا</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-white/50">
          © {new Date().getFullYear()} The Girl House — جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
};

export default Footer;
