import React from "react";
import { useSettings } from "@/context/SettingsContext";
import { motion } from "framer-motion";

const AnnouncementBar = () => {
  const { settings } = useSettings();
  const msg = settings?.announcement || "توصيل داخل مصر | منتجات ألمانية مختارة";
  const items = Array(3).fill(msg);
  return (
    <div
      className="relative overflow-hidden bg-ink text-white text-xs sm:text-sm py-2"
      data-testid="announcement-bar"
    >
      <motion.div
        className="flex items-center gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-3 font-light tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-champagne-400" />
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default AnnouncementBar;
