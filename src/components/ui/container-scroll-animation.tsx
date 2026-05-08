import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";

type HeightVariant = "hero" | "section" | "compact";
type Theme = "rose" | "ivory" | "champagne";

interface ContainerScrollProps {
  titleComponent: ReactNode;
  children: ReactNode;
  className?: string;
  cardClassName?: string;
  heightVariant?: HeightVariant;
  theme?: Theme;
}

const HEIGHTS: Record<HeightVariant, string> = {
  hero: "h-[48rem] md:h-[68rem]",
  section: "h-[42rem] md:h-[58rem]",
  compact: "h-[34rem] md:h-[44rem]",
};

const THEMES: Record<Theme, { bg: string; border: string; shadow: string }> = {
  rose: {
    bg: "rgba(255, 248, 244, 0.78)",
    border: "1px solid rgba(217,108,157,0.18)",
    shadow: "0 30px 80px -30px rgba(217,108,157,0.45), 0 10px 30px -15px rgba(246,231,216,0.6)",
  },
  ivory: {
    bg: "rgba(255, 248, 244, 0.85)",
    border: "1px solid rgba(231,168,191,0.22)",
    shadow: "0 30px 80px -30px rgba(58,36,48,0.25)",
  },
  champagne: {
    bg: "rgba(252, 235, 242, 0.78)",
    border: "1px solid rgba(246,231,216,0.6)",
    shadow: "0 30px 80px -30px rgba(217,108,157,0.35)",
  },
};

function useIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}

export function ContainerScroll({
  titleComponent,
  children,
  className = "",
  cardClassName = "",
  heightVariant = "section",
  theme = "rose",
}: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: containerRef });
  const isMobile = useIsMobile();
  const t = THEMES[theme];

  const rotateRange = isMobile ? [8, 0] : [14, 0];
  const scaleRange = isMobile ? [0.92, 1] : [0.94, 1];
  const translateRange = isMobile ? [0, -40] : [0, -80];

  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : rotateRange);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [0.98, 1] : scaleRange);
  const translate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : translateRange);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center p-4 md:p-10 ${HEIGHTS[heightVariant]} ${className}`}
    >
      <div className="w-full relative" style={{ perspective: "1000px" }}>
        <Header translate={translate}>{titleComponent}</Header>
        <Card rotate={rotate} scale={scale} cardClassName={cardClassName} theme={t}>
          {children}
        </Card>
      </div>
    </div>
  );
}

function Header({ translate, children }: { translate: MotionValue<number>; children: ReactNode }) {
  return (
    <motion.div style={{ translateY: translate }} className="div max-w-5xl mx-auto text-center">
      {children}
    </motion.div>
  );
}

function Card({
  rotate,
  scale,
  cardClassName,
  theme,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  cardClassName: string;
  theme: { bg: string; border: string; shadow: string };
  children: ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow: theme.shadow,
        background: theme.bg,
        border: theme.border,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
      className={`max-w-6xl -mt-6 mx-auto h-[28rem] md:h-[42rem] w-full rounded-[32px] p-3 md:p-5 ${cardClassName}`}
    >
      <div className="h-full w-full overflow-hidden rounded-[24px] md:rounded-[28px] bg-gradient-to-br from-[#FFF8F4] via-[#FCEBF2] to-[#F7D6E4]">
        {children}
      </div>
    </motion.div>
  );
}
