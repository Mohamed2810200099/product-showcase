import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserFromAccessToken } from "./auth-helpers.server";
import { getGlowSettings } from "./referral.server";
import { normalizePhone, isValidEgyptPhone } from "@/lib/phone";

const itemSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().int().min(1).max(100),
});

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().min(6).max(20).regex(/^[0-9+\-\s()]+$/),
  customer_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  address: z.string().trim().min(3).max(500),
  city: z.string().trim().min(2).max(100),
  governorate: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(500).optional(),
  items: z.array(itemSchema).min(1).max(100),
  coupon_code: z.string().trim().max(50).optional().nullable(),
  referral_code: z.string().trim().max(30).optional().nullable(),
  use_wallet: z.boolean().optional(),
  access_token: z.string().max(4000).optional().nullable(),
});

export type CreateOrderResult =
  | { ok: true; order_number: string; id: string }
  | { ok: false; error: string; code?: "invalid_wallet_session" };

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }): Promise<CreateOrderResult> => {
    // SECURITY: derive user id from a validated token only — never from client payload.
    const authUser = await getUserFromAccessToken(data.access_token);
    const customerUserId = authUser?.userId ?? null;

    // Wallet requests require a validated user. Missing/invalid tokens must
    // not silently become guest orders with different totals.
    if (data.use_wallet && !customerUserId) {
      return {
        ok: false,
        code: "invalid_wallet_session",
        error: "انتهت جلستك. سجّلي دخول مرة تانية لاستخدام رصيد المحفظة",
      };
    }


    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price, images, is_active, stock, stock_tracking_enabled, availability_status")
      .in("id", ids);

    if (pErr || !products) return { ok: false, error: "تعذر جلب بيانات المنتجات" };

    const byId = new Map(products.map((p) => [p.id, p]));
    const orderItems: Array<Record<string, unknown>> = [];
    let subtotal = 0;

    for (const it of data.items) {
      const p = byId.get(it.product_id);
      if (!p || !p.is_active) return { ok: false, error: "أحد المنتجات غير متاح" };
      if (p.availability_status === "out_of_stock") {
        return { ok: false, error: "أحد المنتجات نفد من المخزون" };
      }
      if (p.stock_tracking_enabled && Number(p.stock ?? 0) < it.qty) {
        return { ok: false, error: "الكمية المطلوبة غير متاحة حالياً" };
      }
      const price = Number(p.price);
      subtotal += price * it.qty;
      const imgs = Array.isArray(p.images) ? (p.images as unknown[]) : [];
      orderItems.push({
        product_id: p.id,
        name: p.name,
        slug: p.slug,
        price,
        qty: it.qty,
        image: typeof imgs[0] === "string" ? imgs[0] : null,
      });
    }

    const { data: brandRow } = await supabaseAdmin
      .from("settings").select("value").eq("key", "brand").maybeSingle();
    const brand = (brandRow?.value as Record<string, unknown> | null) ?? {};
    const shippingFee = Number(brand.shipping_fee ?? 50);
    const freeShipThreshold = Number(brand.free_shipping_threshold ?? 1000);
    const shipping = subtotal >= freeShipThreshold ? 0 : shippingFee;

    let discount = 0;
    let couponCode: string | null = null;

    // Coupon
    if (data.coupon_code) {
      const code = data.coupon_code.trim().toUpperCase();
      const { data: row } = await supabaseAdmin.from("coupons").select("*").eq("code", code).maybeSingle();
      if (!row) return { ok: false, error: "كود الخصم غير صالح" };
      if (!row.active) return { ok: false, error: "كود الخصم غير مفعل" };
      const now = new Date();
      if (row.starts_at && new Date(row.starts_at) > now) return { ok: false, error: "كود الخصم غير مفعل بعد" };
      if (row.expires_at && new Date(row.expires_at) < now) return { ok: false, error: "انتهت صلاحية كود الخصم" };
      if (row.max_uses && row.used_count >= row.max_uses) return { ok: false, error: "تم استنفاد كود الخصم" };
      if (Number(row.min_order) > subtotal) return { ok: false, error: "لم يتحقق الحد الأدنى للكوبون" };
      const { data: usedSame } = await supabaseAdmin.rpc("has_used_coupon", { _code: code, _phone: data.customer_phone });
      if (usedSame) return { ok: false, error: "هذا الرقم استخدم الكوبون من قبل" };
      if (row.first_order_only) {
        const { count } = await supabaseAdmin.from("orders").select("id", { count: "exact", head: true })
          .eq("customer_phone", data.customer_phone).neq("status", "cancelled");
        if ((count ?? 0) > 0) return { ok: false, error: "هذا الكود مخصص لأول طلب فقط" };
      }
      discount = row.type === "percent" ? Math.round((subtotal * Number(row.value)) / 100) : Number(row.value);
      if (discount > subtotal) discount = subtotal;
      couponCode = row.code;
    }

    // Personal referral code (mutually exclusive with coupon)
    let referralCode: string | null = null;
    let referralDiscount = 0;
    let referrerUserId: string | null = null;
    const glow = await getGlowSettings();

    if (data.referral_code && glow.enabled && !couponCode) {
      const code = data.referral_code.trim().toUpperCase();
      const { data: ownerId } = await supabaseAdmin.rpc("lookup_referral_owner", { _code: code });
      const owner = ownerId as unknown as string | null;
      if (!owner) return { ok: false, error: "كود الإحالة غير موجود" };
      if (customerUserId && owner === customerUserId)
        return { ok: false, error: "ميصحش تستخدمي كودك بنفسك" };
      // first-order-only for friend
      if (customerUserId) {
        const { count } = await supabaseAdmin.from("orders").select("id", { count: "exact", head: true })
          .eq("customer_user_id", customerUserId).neq("status", "cancelled");
        if ((count ?? 0) > 0) return { ok: false, error: "كود الإحالة لأول طلب فقط" };
      } else {
        const { count } = await supabaseAdmin.from("orders").select("id", { count: "exact", head: true })
          .eq("customer_phone", data.customer_phone).neq("status", "cancelled");
        if ((count ?? 0) > 0) return { ok: false, error: "كود الإحالة لأول طلب فقط" };
      }
      referralDiscount = Math.round((subtotal * glow.friend_discount_pct) / 100);
      discount += referralDiscount;
      if (discount > subtotal) discount = subtotal;
      referralCode = code;
      referrerUserId = owner;
    }

    // Wallet redemption (logged-in customers only)
    let walletRedeemed = 0;
    if (data.use_wallet && customerUserId) {
      const { data: cp } = await supabaseAdmin
        .from("customer_profiles").select("wallet_balance").eq("user_id", customerUserId).maybeSingle();
      const balance = Number(cp?.wallet_balance ?? 0);
      const remaining = Math.max(0, subtotal - discount);
      const maxByOrder = Math.floor((subtotal * glow.max_wallet_per_order_pct) / 100);
      walletRedeemed = Math.min(balance, remaining, maxByOrder);
      if (walletRedeemed > 0 && walletRedeemed < glow.min_redemption && balance >= glow.min_redemption) {
        // enforce min only when balance allows
        walletRedeemed = 0;
      }
    }

    const total = Math.max(0, subtotal - discount - walletRedeemed + shipping);

    const { data: inserted, error: iErr } = await supabaseAdmin
      .from("orders")
      .insert([{
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        address: data.address,
        city: data.city,
        governorate: data.governorate,
        notes: data.notes || null,
        items: orderItems as unknown as never,
        subtotal,
        discount,
        shipping,
        total,
        coupon_code: couponCode,
        payment_method: "cod",
        status: "pending",
        customer_user_id: customerUserId ?? null,
        referral_code_used: referralCode,
        wallet_redeemed: walletRedeemed,
        referrer_credit_status: referralCode ? "pending" : "none",
      }])
      .select("id, order_number")
      .single();

    if (iErr || !inserted) return { ok: false, error: "تعذر إنشاء الطلب" };

    // Atomically decrement stock for stock-tracked products. If insufficient,
    // roll back the order and surface a friendly error.
    const stockItems = data.items
      .filter((it) => {
        const p = byId.get(it.product_id);
        return p?.stock_tracking_enabled === true;
      })
      .map((it) => ({ product_id: it.product_id, qty: it.qty }));

    if (stockItems.length > 0) {
      const { data: failedPid, error: stockErr } = await supabaseAdmin.rpc(
        "decrement_product_stock",
        { _items: stockItems as unknown as never },
      );
      if (stockErr || failedPid) {
        // roll back the order to keep state consistent
        await supabaseAdmin.from("orders").delete().eq("id", inserted.id);
        return { ok: false, error: "الكمية المطلوبة غير متاحة حالياً" };
      }
    }


    // increment coupon usage and auto-deactivate when usage limit reached
    if (couponCode) {
      const { data: cRow } = await supabaseAdmin
        .from("coupons").select("id, used_count, max_uses").eq("code", couponCode).maybeSingle();
      if (cRow) {
        const newUsed = (cRow.used_count ?? 0) + 1;
        const shouldDeactivate = cRow.max_uses != null && newUsed >= cRow.max_uses;
        await supabaseAdmin.from("coupons")
          .update({ used_count: newUsed, ...(shouldDeactivate ? { active: false } : {}) })
          .eq("id", cRow.id);
      }
    }

    // Referral use ledger
    if (referralCode) {
      await supabaseAdmin.from("referral_uses").insert({
        code: referralCode,
        referrer_user_id: referrerUserId,
        friend_user_id: customerUserId ?? null,
        friend_phone: data.customer_phone,
        order_id: inserted.id,
        discount_amount: referralDiscount,
        status: "pending",
      });
    }

    // Wallet redemption debit
    if (walletRedeemed > 0 && customerUserId) {
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: customerUserId,
        amount: -walletRedeemed,
        kind: "redemption",
        order_id: inserted.id,
        note: `استخدام رصيد في طلب ${inserted.order_number}`,
      });
      const { data: cp } = await supabaseAdmin
        .from("customer_profiles").select("wallet_balance").eq("user_id", customerUserId).single();
      if (cp) {
        await supabaseAdmin.from("customer_profiles")
          .update({ wallet_balance: Math.max(0, Number(cp.wallet_balance) - walletRedeemed) })
          .eq("user_id", customerUserId);
      }
    }

    return { ok: true, id: inserted.id, order_number: inserted.order_number };
  });
