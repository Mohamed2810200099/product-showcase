import { useBrand } from "@/hooks/use-brand";

export function AnnouncementBar() {
  const brand = useBrand();
  return (
    <div className="bg-gradient-blush text-primary-foreground text-center text-xs sm:text-sm py-2 px-4 overflow-hidden">
      <p className="font-medium tracking-wide animate-pulse">{brand.announcement}</p>
    </div>
  );
}
