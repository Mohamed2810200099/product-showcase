import { motion, useReducedMotion } from "framer-motion";

type Variant = "pearls" | "ribbons" | "leaves" | "sparkles";

/**
 * Decorative pseudo-3D floating elements. Pointer-events disabled.
 * Variant tunes the vibe: pearls/ribbons (haircare), leaves (skincare), sparkles (default).
 */
export function FloatingBeautyElements({ variant = "sparkles", density = 6 }: { variant?: Variant; density?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  const items = Array.from({ length: density }).map((_, i) => ({
    id: i,
    top: `${(i * 73) % 95}%`,
    left: `${(i * 41 + 7) % 95}%`,
    size: 10 + ((i * 7) % 22),
    delay: (i % 5) * 0.6,
    duration: 8 + (i % 4) * 1.5,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {items.map((it) => (
        <motion.span
          key={it.id}
          className="absolute"
          style={{ top: it.top, left: it.left, width: it.size, height: it.size }}
          animate={{
            y: [0, -18, 0],
            x: [0, 6, 0],
            opacity: [0.35, 0.85, 0.35],
            rotate: [0, 8, 0],
          }}
          transition={{ duration: it.duration, repeat: Infinity, ease: "easeInOut", delay: it.delay }}
        >
          <Shape variant={variant} />
        </motion.span>
      ))}
    </div>
  );
}

function Shape({ variant }: { variant: Variant }) {
  if (variant === "pearls") {
    return (
      <span
        className="block w-full h-full rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #fff, #fde6ef 45%, #e7a8bf 100%)",
          boxShadow: "0 6px 18px -6px rgba(217,108,157,0.4), inset -2px -3px 6px rgba(217,108,157,0.25)",
        }}
      />
    );
  }
  if (variant === "ribbons") {
    return (
      <span
        className="block w-full h-1.5 rounded-full"
        style={{
          background: "linear-gradient(90deg, #f8c8d8, #e7a8bf, #d96c9d)",
          transform: "rotate(20deg)",
          opacity: 0.6,
        }}
      />
    );
  }
  if (variant === "leaves") {
    return (
      <span
        className="block w-full h-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, #c8e6c9, #81c784)",
          borderRadius: "0 100% 0 100%",
          opacity: 0.45,
          boxShadow: "0 4px 14px -4px rgba(129,199,132,0.5)",
        }}
      />
    );
  }
  return (
    <span
      className="block w-full h-full rounded-full"
      style={{
        background: "radial-gradient(circle, #fff 0%, rgba(255,255,255,0) 60%)",
        boxShadow: "0 0 12px 2px rgba(255,255,255,0.85)",
      }}
    />
  );
}
