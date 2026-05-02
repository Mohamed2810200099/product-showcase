import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Gift, Share2, Sparkles } from "lucide-react";

export function ReferralSection() {
  return (
    <section dir="ltr" className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#FFF8F4] via-[#F9EEF3] to-[#F8DCE5] p-8 sm:p-12 shadow-[0_30px_60px_-30px_rgba(217,108,157,0.35)]"
      >
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#E7A8BF]/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-[#EDE7F6]/60 blur-3xl" />

        <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div className="space-y-5 text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur border border-white px-4 py-1.5 text-xs font-medium text-[#3A2430]">
              <Sparkles className="h-3.5 w-3.5 text-[#D96C9D]" />
              Loved by beauty lovers in Egypt
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3A2430] leading-tight">
              Share the Glow
            </h2>
            <p className="text-[#3A2430]/75 max-w-lg mx-auto md:mx-0 leading-relaxed">
              Give your friend <span className="font-semibold text-[#D96C9D]">10% off</span> their first order
              and get <span className="font-semibold text-[#D96C9D]">10% back</span> when they shop.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[#D96C9D] hover:bg-[#C95588] text-white px-6 py-3 font-medium shadow-[0_12px_30px_-10px_rgba(217,108,157,0.6)] transition"
              >
                <Share2 className="h-4 w-4" /> Share &amp; Save 10%
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-white text-[#3A2430] px-6 py-3 font-medium hover:bg-white transition"
              >
                <Gift className="h-4 w-4" /> Invite a Friend
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_25px_60px_-20px_rgba(58,36,48,0.25)] flex flex-col items-center justify-center text-center p-6"
            >
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white shadow-[0_10px_24px_-8px_rgba(217,108,157,0.6)] mb-4">
                <Gift className="h-7 w-7" />
              </div>
              <div className="font-display text-2xl font-bold text-[#3A2430]">Give 10%</div>
              <div className="text-xs uppercase tracking-[0.3em] text-[#D96C9D] my-1">·  Get 10% ·</div>
              <p className="text-xs text-[#3A2430]/70 mt-2">
                Both you and your friend save on your next order.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
