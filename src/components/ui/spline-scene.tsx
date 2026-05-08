import { lazy, Suspense, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const Spline = lazy(() => import("@splinetool/react-spline"));

type Props = {
  scene?: string;
  className?: string;
  fallbackImage?: string;
  title?: string;
};

function Fallback({ className, fallbackImage, title }: Omit<Props, "scene">) {
  return (
    <div
      className={cn(
        "relative w-full h-full rounded-3xl overflow-hidden",
        className
      )}
      style={{
        background:
          "radial-gradient(120% 80% at 30% 20%, #FFF8F4 0%, #F7D6E4 55%, #E7A8BF 100%)",
      }}
      aria-label={title ?? "Beauty 3D scene"}
    >
      {fallbackImage && (
        <img
          src={fallbackImage}
          alt={title ?? ""}
          className="absolute inset-0 w-full h-full object-contain p-6"
        />
      )}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/30 via-transparent to-[#F6E7D8]/40" />
    </div>
  );
}

export function SplineScene({ scene, className, fallbackImage, title }: Props) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [scene]);

  if (!scene || reduce || failed) {
    return <Fallback className={className} fallbackImage={fallbackImage} title={title} />;
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Suspense fallback={<Fallback className={className} fallbackImage={fallbackImage} title={title} />}>
        <ErrorBoundary onError={() => setFailed(true)}>
          <Spline scene={scene} className="!w-full !h-full" />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

import { Component, type ReactNode } from "react";
class ErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
