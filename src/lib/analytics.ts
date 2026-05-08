// Centralized analytics utility.
// Logs to console in development; ready to wire into Meta Pixel / GA / TikTok Pixel later.

export type AnalyticsEvent =
  | "product_view"
  | "search_submitted"
  | "add_to_cart"
  | "cart_view"
  | "checkout_started"
  | "coupon_applied"
  | "referral_applied"
  | "order_created"
  | "whatsapp_clicked";

export type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: { track: (name: string, payload?: AnalyticsPayload) => void };
    dataLayer?: unknown[];
  }
}

// Map our internal event names to standard pixel event names
const META_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  product_view: "ViewContent",
  search_submitted: "Search",
  add_to_cart: "AddToCart",
  cart_view: "ViewCart",
  checkout_started: "InitiateCheckout",
  order_created: "Purchase",
};

const TIKTOK_EVENT_MAP: Partial<Record<AnalyticsEvent, string>> = {
  product_view: "ViewContent",
  search_submitted: "Search",
  add_to_cart: "AddToCart",
  checkout_started: "InitiateCheckout",
  order_created: "CompletePayment",
};

// Strip any potentially sensitive personal fields before sending.
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

export function trackEvent(event: AnalyticsEvent, payload?: AnalyticsPayload) {
  const data = sanitize(payload);

  if (typeof window === "undefined") return;

  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, data);
  }

  try {
    // Meta Pixel
    if (typeof window.fbq === "function") {
      const metaName = META_EVENT_MAP[event];
      if (metaName) window.fbq("track", metaName, data);
      else window.fbq("trackCustom", event, data);
    }

    // Google Analytics (gtag)
    if (typeof window.gtag === "function") {
      window.gtag("event", event, data);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...data });
    }

    // TikTok Pixel
    if (window.ttq && typeof window.ttq.track === "function") {
      const tName = TIKTOK_EVENT_MAP[event] ?? event;
      window.ttq.track(tName, data);
    }
  } catch {
    // Never let analytics break the app.
  }
}
