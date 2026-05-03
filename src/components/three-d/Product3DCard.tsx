import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * Premium 3D tilt wrapper for product cards.
 * - Mouse tracking with rotateX/rotateY (max 4deg / 6deg)
 * - Soft lift on hover
 * - Disabled on touch / reduced motion
 */
export function Product3DCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 150, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 150, damping: 18, mass: 0.4 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [4, -4]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["30%", "70%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["30%", "70%"]);

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
        rotateX: reduce ? 0 : rotateX,
        rotateY: reduce ? 0 : rotateY,
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* mouse-following soft rose glow */}
      {!reduce && <GlowLayer glowX={glowX} glowY={glowY} />}
      <div className="group" style={{ transform: "translateZ(0)" }}>
        {children}
      </div>
    </motion.div>
  );
}

function GlowLayer({ glowX, glowY }: { glowX: any; glowY: any }) {
  const bg = useTransform(
    [glowX, glowY] as any,
    ([x, y]: any) => `radial-gradient(220px circle at ${x} ${y}, rgba(217,108,157,0.28), transparent 70%)`,
  );
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -inset-2 rounded-3xl opacity-60 -z-10"
      style={{ background: bg, filter: "blur(14px)" }}
    />
  );
}
