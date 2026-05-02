import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    announcement: "توصيل داخل مصر | منتجات ألمانية مختارة | الكمية محدودة",
    whatsapp_number: "201000000000",
    instagram: "https://instagram.com/thegirlhouse_eg",
    tiktok: "https://tiktok.com/@thegirlhouse_eg",
    facebook: "",
    hero_title: "منتجات عناية ألمانية أصلية وصلت مصر",
    hero_subtitle: "اختاري منتجات DM الألمانية للعناية بالشعر والبشرة.",
    flat_delivery_fee: 70,
    delivery_fees: {},
    payment_methods: { cod: true, whatsapp: true },
    free_delivery_threshold: 2000,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [s, c] = await Promise.all([
        api.get("/settings/public"),
        api.get("/categories"),
      ]);
      setSettings(s.data || settings);
      setCategories(c.data || []);
    } catch (e) {
      console.error("Settings load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const whatsappLink = (text = "") => {
    const msg = encodeURIComponent(text || "السلام عليكم، حابة أستفسر عن منتج");
    return `https://wa.me/${settings.whatsapp_number}?text=${msg}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, categories, loading, refresh, whatsappLink }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
