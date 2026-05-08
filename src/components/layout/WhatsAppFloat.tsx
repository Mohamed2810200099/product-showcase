import { useBrand } from "@/hooks/use-brand";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function WhatsAppFloat() {
  const brand = useBrand();
  if (!brand.whatsapp) return null;
  const url = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("مرحباً، عايزة استفسر عن منتج")}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      className="hidden md:flex fixed bottom-6 left-6 z-30 h-14 w-14 rounded-full bg-[#25D366] text-white items-center justify-center shadow-elegant hover:scale-110 transition-transform animate-float-soft"
      aria-label="تواصلي عبر واتساب"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
