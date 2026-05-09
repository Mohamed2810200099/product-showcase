// Centralized analytics layer for GA4 + Meta Pixel (and TikTok Pixel).
// Supports proper ecommerce events, item arrays, and purchase deduplication.
// Future-ready for Meta Conversions API (server-side) — same event names,
// shared event_id can be reused for browser/server dedup.

export type AnalyticsEvent =
  // GA4 / Meta canonical
  | "page_view"
  | "view_item"
  | "view_item_list"
  | "search"
  | "add_to_cart"
  | "view_cart"
  | "begin_checkout"
  | "purchase"
  // Custom
  | "whatsapp_clicked"
  | "beauty_assistant_started"
  | "beauty_assistant_completed"
  | "coupon_applied"
  | "referral_applied"
  // Legacy aliases (kept for backward compatibility — auto-mapped)
  | "product_view"
  | "search_submitted"
  | "cart_view"
  | "checkout_started"
  | "order_created";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

export type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: { track: (name: string, payload?: AnalyticsPayload) => void };
    dataLayer?: unknown[];
  }
}

// Legacy → canonical name mapping
const ALIAS: Partial<Record<AnalyticsEvent, AnalyticsEvent>> = {
  product_view: "view_item",
  search_submitted: "search",
  cart_view: "view_cart",
  checkout_started: "begin_checkout",
  order_created: "purchase",
};

const META_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  search: "Search",
  add_to_cart: "AddToCart",
  view_cart: "ViewCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

const TIKTOK_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  view_item: "ViewContent",
  search: "Search",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "CompletePayment",
};

// Strip potentially sensitive personal fields before sending to third-parties.
const SENSITIVE_KEYS = new Set([
  "phone",
  "phone_number",
  "address",
  "address_line",
  "street",
  "email",
  "name",
  "full_name",
  "customer_name",
]);

function sanitize(payload?: AnalyticsPayload): AnalyticsPayload {
  if (!payload) return {};
  const out: AnalyticsPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(k)) continue;
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

// Purchase deduplication — guarantees we never fire purchase twice for the
// same order_number (e.g. on success page refresh).
function isDuplicatePurchase(orderNumber?: string): boolean {
  if (!orderNumber || typeof window === "undefined") return false;
  try {
    const key = `tgh_tracked_purchase_${orderNumber}`;
    if (sessionStorage.getItem(key) || localStorage.getItem(key)) return true;
    sessionStorage.setItem(key, "1");
    localStorage.setItem(key, String(Date.now()));
    return false;
  } catch {
    return false;
  }
}

export function trackEvent(event: AnalyticsEvent, payload?: AnalyticsPayload) {
  // Resolve legacy aliases
  const canonical = (ALIAS[event] ?? event) as AnalyticsEvent;
  const data = sanitize(payload);

  if (typeof window === "undefined") return;

  // Dedupe purchases by order_number / transaction_id
  if (canonical === "purchase") {
    const orderId =
      (data.transaction_id as string | undefined) ??
      (data.order_number as string | undefined);
    if (isDuplicatePurchase(orderId)) {
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.log(`[analytics] purchase ${orderId} skipped (duplicate)`);
      }
      return;
    }
    // Normalize to GA4-style transaction_id
    if (!data.transaction_id && orderId) data.transaction_id = orderId;
  }

  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${canonical}`, data);
  }

  try {
    // Meta Pixel
    if (typeof window.fbq === "function") {
      const metaName = META_EVENT_MAP[canonical];
      if (metaName) window.fbq("track", metaName, data);
      else window.fbq("trackCustom", canonical, data);
    }

    // Google Analytics (gtag)
    if (typeof window.gtag === "function") {
      window.gtag("event", canonical, data);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: canonical, ...data });
    }

    // TikTok Pixel
    if (window.ttq && typeof window.ttq.track === "function") {
      const tName = TIKTOK_EVENT_MAP[canonical] ?? canonical;
      window.ttq.track(tName, data);
    }
  } catch {
    // Never let analytics break the app.
  }
}

// ---------- Helpers for ecommerce events ----------

export function buildItem(
  p: {
    id: string;
    name: string;
    arabic_title?: string | null;
    brand?: string | null;
    category?: string | null;
    price: number | string;
  },
  quantity = 1,
): AnalyticsItem {
  return {
    item_id: p.id,
    item_name: p.arabic_title || p.name,
    item_brand: p.brand ?? undefined,
    item_category: p.category ?? undefined,
    price: Number(p.price),
    quantity,
  };
}

export function trackViewItem(item: AnalyticsItem, source = "product_page") {
  trackEvent("view_item", {
    currency: "EGP",
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
    source,
  });
}

export function trackViewItemList(items: AnalyticsItem[], list_name: string) {
  trackEvent("view_item_list", {
    item_list_name: list_name,
    items,
  });
}

export function trackAddToCart(item: AnalyticsItem, source: string) {
  trackEvent("add_to_cart", {
    currency: "EGP",
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
    source,
  });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number, coupon?: string | null) {
  trackEvent("begin_checkout", {
    currency: "EGP",
    value,
    coupon: coupon ?? undefined,
    items,
  });
}

export function trackPurchase(args: {
  order_number: string;
  value: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  coupon?: string | null;
  items: AnalyticsItem[];
  city?: string;
  governorate?: string;
}) {
  trackEvent("purchase", {
    currency: "EGP",
    transaction_id: args.order_number,
    order_number: args.order_number,
    value: args.value,
    shipping: args.shipping ?? 0,
    tax: args.tax ?? 0,
    discount: args.discount ?? 0,
    coupon: args.coupon ?? undefined,
    items: args.items,
    city: args.city,
    governorate: args.governorate,
  });
}
