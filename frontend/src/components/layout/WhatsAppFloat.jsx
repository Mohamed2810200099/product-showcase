import React from "react";
import { MessageCircle } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { motion } from "framer-motion";

const WhatsAppFloat = () => {
  const { settings, whatsappLink } = useSettings();
  return (
    <motion.a
      href={whatsappLink("السلام عليكم، حابة أستفسر عن منتج من The Girl House")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 lg:bottom-8 left-5 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-glow hover:scale-110 transition-transform"
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1, type: "spring" }}
      data-testid="whatsapp-float-button"
      aria-label="تواصلي عبر واتساب"
    >
      <MessageCircle className="w-6 h-6 fill-white" />
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
    </motion.a>
  );
};

export default WhatsAppFloat;
