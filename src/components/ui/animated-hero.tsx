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

  // reserve height with an invisible widest word
  const widest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center md:justify-start align-bottom overflow-hidden",
        className
      )}
      aria-live="polite"
    >
      {/* spacer to keep line height stable */}
      <span className="invisible whitespace-nowrap" aria-hidden>
        {widest}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[i]}
          initial={reduce ? { opacity: 0 } : { y: 35, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: -35, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center md:justify-start whitespace-nowrap bg-gradient-to-r from-[#D96C9D] via-[#E7A8BF] to-[#C95588] bg-clip-text text-transparent"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
