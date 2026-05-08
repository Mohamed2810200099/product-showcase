import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizePhone } from "@/lib/phone";

const schema = z.object({
  code: z.string().trim().min(1).max(50).transform((s) => s.toUpperCase()),
  subtotal: z.number().nonnegative(),
  phone: z.string().trim().max(20).optional(),
});

export type CouponValidation =
  | { ok: true; code: string; discount: number }
  | { ok: false; error: string };

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }): Promise<CouponValidation> => {
    const { data: row } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", data.code)
      .maybeSingle();

    if (!row) return { ok: false, error: "هذا الكود غير صالح" };
    if (!row.active) return { ok: false, error: "هذا الكود غير مفعل" };

    const now = new Date();
    if (row.starts_at && new Date(row.starts_at) > now) return { ok: false, error: "هذا الكود غير مفعل" };
    if (row.expires_at && new Date(row.expires_at) < now) return { ok: false, error: "انتهت صلاحية هذا الكود" };
    if (row.max_uses && row.used_count >= row.max_uses) return { ok: false, error: "تم استخدام هذا الكود من قبل" };
    if (Number(row.min_order) > data.subtotal) {
      return { ok: false, error: `الحد الأدنى لاستخدام هذا الكود هو ${Number(row.min_order)} ج.م` };
    }

    const phoneNorm = normalizePhone(data.phone ?? "");
    const phoneRaw = (data.phone ?? "").trim();

    if (phoneNorm.length >= 6) {
      const candidates = Array.from(new Set([phoneNorm, phoneRaw].filter(Boolean)));
      for (const p of candidates) {
        const { data: used } = await supabaseAdmin.rpc("has_used_coupon", {
          _code: data.code,
          _phone: p,
        });
        if (used) return { ok: false, error: "هذا الرقم استخدم الكوبون من قبل" };
      }
    }

    if (row.first_order_only && phoneNorm.length >= 6) {
      const candidates = Array.from(new Set([phoneNorm, phoneRaw].filter(Boolean)));
      const { count } = await supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("customer_phone", candidates)
        .neq("status", "cancelled");
      if ((count ?? 0) > 0) return { ok: false, error: "هذا الكود مخصص لأول طلب فقط" };
    }

    // NOTE: This calculation MUST mirror createOrder's coupon logic so the
    // checkout UI total equals the backend-saved order total. Always cap to
    // subtotal and clamp to >= 0 — fixed coupons can exceed subtotal.
    const raw = row.type === "percent" ? (data.subtotal * Number(row.value)) / 100 : Number(row.value);
    const discount = Math.max(0, Math.min(Math.round(raw), data.subtotal));
    return { ok: true, code: row.code, discount };
  });
