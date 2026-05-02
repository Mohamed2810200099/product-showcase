import { createRouter, useRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-body">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-display font-bold">حصل خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">حاولي تاني بعد لحظات.</p>
        {import.meta.env.DEV && error.message && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left font-mono text-xs text-destructive" dir="ltr">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90"
          >
            حاولي مرة أخرى
          </button>
          <a href="/" className="rounded-full border border-input bg-background px-5 py-2 text-sm hover:bg-accent">
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });
  return router;
};
