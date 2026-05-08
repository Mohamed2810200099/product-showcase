import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  words: string[];
  interval?: number;
  className?: string;
};

export function AnimatedHeroWords({ words, interval = 2000, className }: Props) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || words.length <= 1) return;
    const id = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [reduce, interval, words.length]);

  return (
    <motion.span
      layout
      transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      className={cn("inline-flex w-fit items-center align-bottom", className)}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[i]}
          layout
          initial={reduce ? { opacity: 0 } : { y: 35, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: -35, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex whitespace-nowrap rounded-2xl bg-[#FFF8F4]/65 px-3 py-1 text-center bg-gradient-to-r from-[#D96C9D] via-[#E7A8BF] to-[#C95588] bg-clip-text text-transparent shadow-[0_4px_18px_-8px_rgba(217,108,157,0.25)] ring-1 ring-white/60 backdrop-blur-sm sm:px-4"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
