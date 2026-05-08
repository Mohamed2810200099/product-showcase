import { toast } from "sonner";

/**
 * Defense-in-depth helper for admin client-side mutations.
 *
 * SECURITY MODEL:
 *  - The real authority is Row-Level Security in Postgres. Every admin-managed
 *    table (orders, products, categories, coupons, reviews, settings,
 *    testimonials, user_roles) carries an "Admins manage X" policy that uses
 *    `has_role(auth.uid(), 'admin')`. A non-admin session — even if it bypasses
 *    <AdminGuard> — cannot insert / update / delete those rows: Postgres rejects
 *    the statement with a 401/403/permission error.
 *  - <AdminGuard> + useAdmin() are UX-only. They hide the UI from non-admins
 *    but never grant access on their own.
 *  - Sensitive flows that need extra logic (order status changes, referral
 *    payout) already run inside server functions (see src/server/orders.functions.ts)
 *    that re-verify the bearer token server-side.
 *
 * This helper turns RLS denial errors into a clear Arabic toast so an attacker
 * who pokes the UI sees an unmistakable "unauthorized" message.
 */
export function handleAdminError(
  error: { message?: string; code?: string; status?: number } | null | undefined,
  fallback = "حصلت مشكلة، حاولي تاني",
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  const status = error.status ?? 0;
  const isAuth =
    status === 401 ||
    status === 403 ||
    code === "42501" || // insufficient_privilege
    code === "PGRST301" ||
    msg.includes("row-level security") ||
    msg.includes("permission denied") ||
    msg.includes("not authorized") ||
    msg.includes("jwt");
  toast.error(isAuth ? "ليس لديكِ صلاحية لتنفيذ هذه العملية 🚫" : (error.message || fallback));
  return true;
}
