import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserFromAccessToken } from "./auth-helpers";
import { getGlowSettings } from "./referral.server";

const authInputSchema = z.object({
  access_token: z.string().max(4000).optional().nullable(),
});

const parseAuthInput = (data: unknown) => {
  const parsed = authInputSchema.safeParse(data ?? {});
  return parsed.success ? parsed.data : { access_token: null };
};

/** Get the current customer's referral profile + wallet + recent transactions. */
export const getMyGlowProfile = createServerFn({ method: "POST" })
  .inputValidator(parseAuthInput)
  .handler(async ({ data }) => {
    try {
      const settings = await getGlowSettings().catch(() => null);
      const authUser = await getUserFromAccessToken(data.access_token);
      if (!authUser) return { profile: null, settings, transactions: [] as any[] };
      const { user, userId, email } = authUser;

      let { data: profile } = await supabaseAdmin
        .from("customer_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!profile) {
        const seed =
          (user.user_metadata?.full_name as string | undefined) ??
          email?.split("@")[0] ??
          "Glow";
        const { data: code } = await supabaseAdmin.rpc("generate_personal_code", { _seed: seed });
        const { data: created } = await supabaseAdmin
          .from("customer_profiles")
          .insert({ user_id: userId, display_name: seed, personal_code: code as unknown as string })
          .select("*")
          .maybeSingle();
        profile = created ?? null;
      }

      const { data: tx } = await supabaseAdmin
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      return { profile, settings, transactions: tx ?? [] };
    } catch (err) {
      console.error("getMyGlowProfile failed:", err);
      return { profile: null, settings: null, transactions: [] as any[], error: "unavailable" };
    }
  });

/** Award referrer credit when an order is marked delivered. Admin-only. */
export const awardReferralForOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) return { ok: false, error: "Order not found" };
    if (!order.referral_code_used) return { ok: true, skipped: "no_referral" };
    if (order.referrer_credit_status === "granted") return { ok: true, skipped: "already_granted" };

    const settings = await getGlowSettings();
    const { data: refOwner } = await supabaseAdmin.rpc("lookup_referral_owner", {
      _code: order.referral_code_used,
    });
    const referrerId = refOwner as unknown as string | null;
    if (!referrerId) return { ok: false, error: "Referrer not found" };
    if (referrerId === order.customer_user_id) return { ok: false, error: "Self-referral" };

    const { data: refProfile } = await supabaseAdmin
      .from("customer_profiles")
      .select("*")
      .eq("user_id", referrerId)
      .single();
    if (!refProfile) return { ok: false, error: "Referrer profile missing" };

    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthCredits =
      refProfile.current_month_key === monthKey ? Number(refProfile.current_month_credits) : 0;

    const baseAmount = Number(order.subtotal) - Number(order.discount);
    let reward = Math.round((baseAmount * settings.referrer_reward_pct) / 100);
    const remainingCap = Math.max(0, settings.monthly_cap - monthCredits);
    if (reward > remainingCap) reward = remainingCap;

    if (reward <= 0) {
      await supabaseAdmin
        .from("orders")
        .update({ referrer_credit_status: "granted", referrer_credit_amount: 0 })
        .eq("id", order.id);
      return { ok: true, capped: true };
    }

    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: referrerId,
      amount: reward,
      kind: "referral_reward",
      order_id: order.id,
      note: `مكافأة إحالة من طلب ${order.order_number}`,
    });

    await supabaseAdmin
      .from("customer_profiles")
      .update({
        wallet_balance: Number(refProfile.wallet_balance) + reward,
        lifetime_credits_earned: Number(refProfile.lifetime_credits_earned) + reward,
        current_month_key: monthKey,
        current_month_credits: monthCredits + reward,
      })
      .eq("user_id", referrerId);

    await supabaseAdmin
      .from("orders")
      .update({ referrer_credit_status: "granted", referrer_credit_amount: reward })
      .eq("id", order.id);

    await supabaseAdmin
      .from("referral_uses")
      .update({ status: "rewarded", reward_amount: reward })
      .eq("order_id", order.id);

    return { ok: true, reward };
  });

/** Reverse referral credit if an order is cancelled after being granted. Admin-only. */
export const reverseReferralForOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) return { ok: false, error: "Order not found" };

    // Reverse wallet redemption if any
    if (Number(order.wallet_redeemed) > 0 && order.customer_user_id) {
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: order.customer_user_id,
        amount: Number(order.wallet_redeemed),
        kind: "reversal",
        order_id: order.id,
        note: `إرجاع رصيد من طلب ${order.order_number}`,
      });
      const { data: cp } = await supabaseAdmin
        .from("customer_profiles")
        .select("wallet_balance")
        .eq("user_id", order.customer_user_id)
        .maybeSingle();
      if (cp) {
        await supabaseAdmin
          .from("customer_profiles")
          .update({ wallet_balance: Number(cp.wallet_balance) + Number(order.wallet_redeemed) })
          .eq("user_id", order.customer_user_id);
      }
      await supabaseAdmin.from("orders").update({ wallet_redeemed: 0 }).eq("id", order.id);
    }

    // Reverse referrer credit if granted
    if (order.referrer_credit_status === "granted" && Number(order.referrer_credit_amount) > 0) {
      const { data: refOwner } = await supabaseAdmin.rpc("lookup_referral_owner", {
        _code: order.referral_code_used ?? "",
      });
      const referrerId = refOwner as unknown as string | null;
      if (referrerId) {
        const amt = Number(order.referrer_credit_amount);
        await supabaseAdmin.from("wallet_transactions").insert({
          user_id: referrerId,
          amount: -amt,
          kind: "reversal",
          order_id: order.id,
          note: `إلغاء مكافأة إحالة من طلب ${order.order_number}`,
        });
        const { data: rp } = await supabaseAdmin
          .from("customer_profiles")
          .select("wallet_balance, current_month_credits, current_month_key")
          .eq("user_id", referrerId)
          .single();
        if (rp) {
          const monthKey = new Date().toISOString().slice(0, 7);
          await supabaseAdmin
            .from("customer_profiles")
            .update({
              wallet_balance: Math.max(0, Number(rp.wallet_balance) - amt),
              current_month_credits:
                rp.current_month_key === monthKey
                  ? Math.max(0, Number(rp.current_month_credits) - amt)
                  : Number(rp.current_month_credits),
            })
            .eq("user_id", referrerId);
        }
      }
      await supabaseAdmin
        .from("orders")
        .update({ referrer_credit_status: "reversed" })
        .eq("id", order.id);
      await supabaseAdmin
        .from("referral_uses")
        .update({ status: "reversed" })
        .eq("order_id", order.id);
    }

    return { ok: true };
  });
