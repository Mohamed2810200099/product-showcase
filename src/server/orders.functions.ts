import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rows, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, created_at, total, items")
      .eq("customer_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const accountSchema = z.object({
  access_token: z.string().min(10).max(4000),
});

export const getMyAccount = createServerFn({ method: "POST" })
  .inputValidator((data) => accountSchema.parse(data))
  .handler(async ({ data }) => {
    // Validate the token server-side; never trust a client-supplied user id.
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(data.access_token);
    if (authError || !userData?.user) {
      return { ok: false as const, error: "unauthorized", profile: null, orders: [] };
    }
    const user = userData.user;
    const userId = user.id;
    const claims = { user_metadata: user.user_metadata, email: user.email } as {
      user_metadata?: { full_name?: string; name?: string };
      email?: string;
    };

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
      const meta = claims.user_metadata ?? {};
      const email = claims.email ?? "";
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


