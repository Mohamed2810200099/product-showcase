import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

/**
 * Global, fixed, full-viewport animated smoke background.
 * Sits at the very back of the page (z-0). All content should be wrapped
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
          "radial-gradient(120% 80% at 80% 10%, #FFF8F4 0%, #FDF4EF 28%, #F8DCE5 70%, #F9EEF3 100%)",
      }}
    >
      <SmokeBackground variant="subtle" className="absolute inset-0 h-full w-full" />
    </div>
  );
}
