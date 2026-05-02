import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAdmin } from "@/hooks/use-admin";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, isAdmin, userId } = useAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) return <Navigate to="/admin/login" />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl font-bold mb-2">صلاحيات غير كافية 🚫</h1>
          <p className="text-muted-foreground">حسابك مش معاه صلاحية الدخول للوحة الإدارة.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
