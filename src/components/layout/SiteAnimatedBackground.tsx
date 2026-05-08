import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

export function SiteAnimatedBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 0,
        background:
          "radial-gradient(circle at 20% 20%, rgba(217,108,157,0.18), transparent 35%), radial-gradient(circle at 80% 10%, rgba(231,168,191,0.18), transparent 30%), linear-gradient(135deg, #FFF8F4, #FCEBF2, #FFF8F4)",
      }}
    >
      <SmokeBackground smokeColor="#E7A8BF" opacity={0.3} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
