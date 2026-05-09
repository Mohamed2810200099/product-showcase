import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserFromAccessToken } from "./auth-helpers.server";
import { normalizePhone } from "@/lib/phone";

const ALLOWED_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

async function isAdminAccess(accessToken?: string | null) {
  const authUser = await getUserFromAccessToken(accessToken);
  if (!authUser) return null;
  const { data } = await supabaseAdmin.rpc("has_role", {
    _user_id: authUser.userId,
    _role: "admin",
  });
  return data === true ? authUser : null;
}

const updateOrderStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(ALLOWED_STATUSES),
  access_token: z.string().max(4000).optional().nullable(),
});

type OrderItemRow = { product_id?: string; qty?: number };

async function logAdminAction(
  actorUserId: string,
  actorEmail: string | null,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) {
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_user_id: actorUserId,
      actor_email: actorEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details as unknown as never,
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => updateOrderStatusSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await isAdminAccess(data.access_token);
    if (!admin) {
      return { ok: false as const, code: "unauthorized", error: "صلاحيات غير كافية" };
    }

    const { data: existing, error: loadErr } = await supabaseAdmin
      .from("orders")
      .select("id, status, items, stock_restored, wallet_redeemed, referrer_credit_status, order_number")
      .eq("id", data.order_id)
      .maybeSingle();
    if (loadErr || !existing) {
      return { ok: false as const, code: "not_found", error: "الطلب غير موجود" };
    }
    const previousStatus = existing.status;

    if (previousStatus === data.status) {
      return { ok: true as const, previousStatus, status: data.status, referral: { ran: false as const } };
    }

    // Block re-opening cancelled orders to avoid undoing reversals.
    if (previousStatus === "cancelled") {
      return { ok: false as const, code: "locked", error: "لا يمكن إعادة فتح طلب ملغي" };
    }

    const { error: updErr } = data.status === "cancelled"
      ? await supabaseAdmin
          .from("orders")
          .update({ status: data.status, cancelled_at: new Date().toISOString() })
          .eq("id", data.order_id)
      : await supabaseAdmin
          .from("orders")
          .update({ status: data.status })
          .eq("id", data.order_id);
    if (updErr) {
      return { ok: false as const, code: "update_failed", error: "فشل تحديث حالة الطلب" };
    }

    // On cancellation, restore stock once (idempotent via stock_restored flag).
    if (data.status === "cancelled" && previousStatus !== "cancelled" && !existing.stock_restored) {
      const items = Array.isArray(existing.items) ? (existing.items as OrderItemRow[]) : [];
      const stockItems = items
        .filter((it) => it && typeof it.product_id === "string" && Number(it.qty) > 0)
        .map((it) => ({ product_id: it.product_id as string, qty: Number(it.qty) }));
      if (stockItems.length > 0) {
        try {
          await supabaseAdmin.rpc("restore_product_stock", { _items: stockItems as unknown as never });
        } catch (e) {
          console.error("restore_product_stock failed", e);
        }
      }
      await supabaseAdmin.from("orders").update({ stock_restored: true }).eq("id", data.order_id);
      await logAdminAction(admin.userId, admin.email, "order.stock_restored", "order", data.order_id, {
        order_number: existing.order_number,
      });
    }

    let referral: {
      ran: boolean;
      kind?: "award" | "reverse";
      ok?: boolean;
      error?: string;
    } = { ran: false };

    try {
      if (data.status === "delivered" && previousStatus !== "delivered") {
        const { awardReferralForOrder } = await import("./referral.functions");
        const r = await awardReferralForOrder({
          data: { order_id: data.order_id, access_token: data.access_token ?? null },
        });
        referral = { ran: true, kind: "award", ok: !!r?.ok, error: r?.ok ? undefined : (r as { error?: string })?.error };
      } else if (data.status === "cancelled" && previousStatus !== "cancelled") {
        const { reverseReferralForOrder } = await import("./referral.functions");
        const r = await reverseReferralForOrder({
          data: { order_id: data.order_id, access_token: data.access_token ?? null },
        });
        referral = { ran: true, kind: "reverse", ok: !!r?.ok, error: r?.ok ? undefined : (r as { error?: string })?.error };
      }
    } catch (e) {
      console.error("Referral hook failed", e);
      referral = {
        ran: true,
        kind: data.status === "delivered" ? "award" : "reverse",
        ok: false,
        error: e instanceof Error ? e.message : "referral_failed",
      };
    }

    await logAdminAction(admin.userId, admin.email, `order.status.${data.status}`, "order", data.order_id, {
      order_number: existing.order_number,
      from: previousStatus,
      to: data.status,
      referral,
    });

    return { ok: true as const, previousStatus, status: data.status, referral };
  });

// Hard delete is intentionally separated and meant for test data only.
// The UI must double-confirm; the action is verified server-side and audited.
const hardDeleteSchema = z.object({
  order_id: z.string().uuid(),
  access_token: z.string().max(4000).optional().nullable(),
  confirm: z.literal("DELETE"),
});

export const hardDeleteOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => hardDeleteSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await isAdminAccess(data.access_token);
    if (!admin) return { ok: false as const, error: "صلاحيات غير كافية" };

    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!existing) return { ok: false as const, error: "الطلب غير موجود" };

    // Only allow hard-delete on cancelled orders (so financial reversals
    // already ran). This protects against losing live orders.
    if (existing.status !== "cancelled") {
      return { ok: false as const, error: "ألغي الطلب أولاً قبل الحذف النهائي" };
    }

    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.order_id);
    if (error) return { ok: false as const, error: "فشل الحذف" };

    await logAdminAction(admin.userId, admin.email, "order.hard_deleted", "order", data.order_id, {
      order_number: existing.order_number,
    });
    return { ok: true as const };
  });



const lookupSchema = z.object({
  phone: z.string().trim().min(6).max(20),
  order_number: z.string().trim().min(4).max(40),
});



export const lookupOrderByPhoneAndNumber = createServerFn({ method: "POST" })
  .inputValidator((data) => lookupSchema.parse(data))
  .handler(async ({ data }) => {
    const phoneNorm = normalizePhone(data.phone);
    const orderNumber = data.order_number.trim().toUpperCase();
    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, created_at, total, items, customer_phone")
      .eq("order_number", orderNumber)
      .limit(1);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) return null;
    if (normalizePhone(row.customer_phone ?? "") !== phoneNorm) return null;
    const { customer_phone: _omit, ...safe } = row;
    void _omit;
    return safe;
  });

const authInputSchema = z.object({
  access_token: z.string().max(4000).optional().nullable(),
});

const parseAuthInput = (data: unknown) => {
  const parsed = authInputSchema.safeParse(data ?? {});
  return parsed.success ? parsed.data : { access_token: null };
};

export const getMyOrders = createServerFn({ method: "POST" })
  .inputValidator(parseAuthInput)
  .handler(async ({ data }) => {
    const authUser = await getUserFromAccessToken(data.access_token);
    if (!authUser) return [];

    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, created_at, total, items")
      .eq("customer_user_id", authUser.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyAccount = createServerFn({ method: "POST" })
  .inputValidator(parseAuthInput)
  .handler(async ({ data }) => {
    try {
      const authUser = await getUserFromAccessToken(data.access_token);
      if (!authUser) {
        return { ok: false as const, error: "unauthorized", profile: null, orders: [] };
      }
      const { user, userId, email } = authUser;
      const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };

      const loadProfile = () =>
        supabaseAdmin
          .from("customer_profiles")
          .select("display_name, personal_code, wallet_balance, lifetime_credits_earned, phone")
          .eq("user_id", userId)
          .maybeSingle();

      const profileRes = await loadProfile();
      if (profileRes.error) {
        return { ok: false as const, error: "profile_load_failed", profile: null, orders: [] };
      }

      let profile = profileRes.data;

      if (!profile) {
        const seed = meta.full_name || meta.name || (email ? email.split("@")[0] : "Glow");
        const displayName = seed || "Glow";

        const { data: codeRpc } = await supabaseAdmin.rpc("generate_personal_code", { _seed: seed });
        const personalCode = codeRpc ?? `GLOW${Math.floor(10 + Math.random() * 90)}`;

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from("customer_profiles")
          .upsert(
            {
              user_id: userId,
              display_name: displayName,
              personal_code: personalCode,
              wallet_balance: 0,
            },
            { onConflict: "user_id" }
          )
          .select("display_name, personal_code, wallet_balance, lifetime_credits_earned, phone")
          .maybeSingle();

        if (insertErr) {
          const refetch = await loadProfile();
          if (refetch.error || !refetch.data) {
            return { ok: false as const, error: "profile_create_failed", profile: null, orders: [] };
          }
          profile = refetch.data;
        } else {
          profile = inserted;
        }
      }

      const { data: orders, error: ordersError } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, status, created_at, total, items")
        .eq("customer_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (ordersError) {
        return { ok: false as const, error: "orders_load_failed", profile: profile ?? null, orders: [] };
      }

      return {
        ok: true as const,
        error: null,
        profile: profile ?? null,
        orders: orders ?? [],
      };
    } catch {
      return { ok: false as const, error: "account_load_failed", profile: null, orders: [] };
    }
  });


