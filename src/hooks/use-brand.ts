import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Brand = {
  whatsapp: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  announcement: string;
  shipping_fee: number;
  free_shipping_threshold: number;
  contact_email: string;
};

const FALLBACK: Brand = {
  whatsapp: "201554087371",
  instagram: "https://www.instagram.com/thegirlhouse_eg",
  tiktok: "https://www.tiktok.com/@thegirlhouse_eg",
  facebook: "https://www.facebook.com/share/18hzaYDPkr/",
  announcement: "منتجات DM الألمانية وصلت مصر أخيرًا 🇩🇪✨ الكمية محدودة — اطلبي قبل النفاد",
  shipping_fee: 60,
  free_shipping_threshold: 1500,
  contact_email: "thegirlhouseeg@yahoo.com",
};

let cache: Brand | null = null;

export function useBrand(): Brand {
  const [brand, setBrand] = useState<Brand>(cache ?? FALLBACK);
  useEffect(() => {
    if (cache) return;
    supabase
      .from("settings")
      .select("value")
      .eq("key", "brand")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const merged = { ...FALLBACK, ...(data.value as Partial<Brand>) };
          cache = merged;
          setBrand(merged);
        }
      });
  }, []);
  return brand;
}
