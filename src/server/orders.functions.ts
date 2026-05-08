import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserFromAccessToken } from "./auth-helpers.server";

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

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => updateOrderStatusSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await isAdminAccess(data.access_token);
    if (!admin) {
      return { ok: false as const, code: "unauthorized", error: "صلاحيات غير كافية" };
    }

    const { data: existing, error: loadErr } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (loadErr || !existing) {
      return { ok: false as const, code: "not_found", error: "الطلب غير موجود" };
    }
    const previousStatus = existing.status;

    if (previousStatus === data.status) {
      return { ok: true as const, previousStatus, status: data.status, referral: { ran: false as const } };
    }

    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.order_id);
    if (updErr) {
      return { ok: false as const, code: "update_failed", error: "فشل تحديث حالة الطلب" };
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

    return { ok: true as const, previousStatus, status: data.status, referral };
  });



const lookupSchema = z.object({
  phone: z.string().trim().min(6).max(20),
  order_number: z.string().trim().min(4).max(40),
});

const normalizePhone = (p: string) => p.replace(/[\s\-+]/g, "").trim();

export const lookupOrdersByPhone = createServerFn({ method: "POST" })
  .inputValidator((data) => lookupSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, created_at, total, items")
      .eq("customer_phone", data.phone)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
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


