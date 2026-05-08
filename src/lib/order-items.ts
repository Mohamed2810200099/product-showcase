// Shared helpers for reading order item fields. Orders may store either
// `qty` (current shape) or legacy `quantity`. Always read via these helpers.

export type OrderItemLike = {
  name?: string;
  price?: number;
  qty?: number;
  quantity?: number;
  image?: string | null;
  product_id?: string;
  slug?: string;
};

export function getItemQty(item: OrderItemLike | null | undefined): number {
  if (!item) return 1;
  const q = item.qty ?? item.quantity ?? 1;
  const n = Number(q);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function getItemPrice(item: OrderItemLike | null | undefined): number {
  const p = Number(item?.price ?? 0);
  return Number.isFinite(p) ? p : 0;
}
