import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type GlowSettings = {
  enabled: boolean;
  friend_discount_pct: number;
  referrer_reward_pct: number;
  monthly_cap: number;
  min_redemption: number;
  max_wallet_per_order_pct: number;
};

const DEFAULTS: GlowSettings = {
  enabled: true,
  friend_discount_pct: 15,
  referrer_reward_pct: 10,
  monthly_cap: 500,
  min_redemption: 50,
  max_wallet_per_order_pct: 50,
};

export async function getGlowSettings(): Promise<GlowSettings> {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", "share_the_glow")
    .maybeSingle();
  return { ...DEFAULTS, ...((data?.value as Partial<GlowSettings>) ?? {}) };
}
