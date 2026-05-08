import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserFromAccessToken } from "./auth-helpers";

const lookupSchema = z.object({
  phone: z.string().trim().min(6).max(20),
});

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

    const [profileRes, ordersRes] = await Promise.all([
      loadProfile(),
      supabaseAdmin
        .from("orders")
        .select("id, order_number, status, created_at, total, items")
        .eq("customer_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

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
        profile = refetch.data;
      } else {
        profile = inserted;
      }
    }

    return {
      ok: true as const,
      error: null,
      profile: profile ?? null,
      orders: ordersRes.data ?? [],
    };
  });


