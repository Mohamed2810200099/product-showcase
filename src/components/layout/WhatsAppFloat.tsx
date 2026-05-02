import { useBrand } from "@/hooks/use-brand";
import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  const brand = useBrand();
  return (
    <a
      href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent("مرحباً، عايزة استفسر عن منتج")}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-20 md:bottom-6 left-4 z-30 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-elegant hover:scale-110 transition-transform animate-float-soft"
      aria-label="تواصلي عبر واتساب"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
