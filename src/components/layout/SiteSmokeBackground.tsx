import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

/**
 * Global, fixed, full-viewport animated smoke background.
 * Sits at the very back of the page (z-0). Page content should be wrapped
 * in a `relative z-10` container so it renders above this layer.
 */
export function SiteSmokeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{
        zIndex: 0,
        background:
          "radial-gradient(120% 80% at 80% 10%, #FFF8F4 0%, #FDEBF1 30%, #F8DCE5 70%, #F4D2DF 100%)",
      }}
    >
      <SmokeBackground
        variant="hero"
        opacity={0.85}
        speed={0.09}
        scale={1.7}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
