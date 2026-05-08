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

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [{ data: profile }, { data: orders }] = await Promise.all([
      supabaseAdmin
        .from("customer_profiles")
        .select("display_name, personal_code, wallet_balance, lifetime_credits_earned, phone")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("orders")
        .select("id, order_number, status, created_at, total, items")
        .eq("customer_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return { profile: profile ?? null, orders: orders ?? [] };
  });
