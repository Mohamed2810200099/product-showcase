import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { CartProvider } from "@/context/CartContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

function NotFoundComponent() {
  return (
    <PublicLayout>
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-4 font-body">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-display font-bold text-primary">٤٠٤</h1>
          <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            الصفحة اللي بتدوّري عليها مش موجودة أو اتنقلت.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Girl House — منتجات DM الألمانية في مصر" },
      {
        name: "description",
        content:
          "متجر The Girl House — منتجات تجميل وعناية ألمانية أصلية من DM، توصيل لكل محافظات مصر. شامبو، كريمات، مكياج، عناية بالشعر والبشرة.",
      },
      { name: "author", content: "The Girl House" },
      { property: "og:title", content: "The Girl House — منتجات DM الألمانية في مصر" },
      {
        property: "og:description",
        content: "منتجات DM الألمانية الأصلية وصلت مصر. تسوقي شامبو، كريمات، مكياج، عناية متكاملة.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_EG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The Girl House — منتجات DM الألمانية في مصر" },
      { name: "description", content: "اكتشفي منتجات عناية ألمانية أصلية للشعر والبشرة من dm وBalea وSchaebens. اختيارات مختارة بعناية، متاحة في مصر بأسعار مناسبة مع طلب سريع عبر The Girl House." },
      { property: "og:description", content: "اكتشفي منتجات عناية ألمانية أصلية للشعر والبشرة من dm وBalea وSchaebens. اختيارات مختارة بعناية، متاحة في مصر بأسعار مناسبة مع طلب سريع عبر The Girl House." },
      { name: "twitter:description", content: "اكتشفي منتجات عناية ألمانية أصلية للشعر والبشرة من dm وBalea وSchaebens. اختيارات مختارة بعناية، متاحة في مصر بأسعار مناسبة مع طلب سريع عبر The Girl House." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5e9aef60-4088-461c-aa76-bfd245ca45d2/id-preview-e1a1a7c8--3b6d57ab-7e55-4ba3-86fd-fa7d54c274cf.lovable.app-1777846557956.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5e9aef60-4088-461c-aa76-bfd245ca45d2/id-preview-e1a1a7c8--3b6d57ab-7e55-4ba3-86fd-fa7d54c274cf.lovable.app-1777846557956.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700&family=Cormorant+Garamond:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
          <SmokeBackground smokeColor="#F5A8C4" />
        </div>
        <Outlet />
        <Toaster position="top-center" richColors closeButton dir="rtl" />
      </CartProvider>
    </QueryClientProvider>
  );
}
