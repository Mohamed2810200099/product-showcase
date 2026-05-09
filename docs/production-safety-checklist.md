# Production Safety Checklist

This document is the canonical reference for verifying that order, coupon, wallet, and admin flows in The Girl House are production-safe. Run through it after any change to:

- `src/server/orders.create.functions.ts`
- `src/server/orders.functions.ts`
- `src/server/coupons.functions.ts`
- `src/server/referral.functions.ts`
- the atomic Postgres RPCs (`decrement_product_stock`, `restore_product_stock`, `redeem_coupon_atomic`, `redeem_wallet_atomic`)
- the admin orders UI (`src/routes/admin.orders.tsx`)

---

## 1. Architecture invariants (must always hold)

| Concern | Guarantee | Where it lives |
|---|---|---|
| Stock decrement | Atomic, row-locked (`FOR UPDATE`), rejects on insufficient stock | RPC `public.decrement_product_stock` |
| Stock restore on cancel | Idempotent — guarded by `orders.stock_restored` flag | RPC `public.restore_product_stock` + `updateOrderStatus` |
| Coupon redemption | Atomic, locks coupon row, enforces `max_uses`, expiry, first-order-only, per-phone | RPC `public.redeem_coupon_atomic` |
| Wallet redemption | Atomic, locks profile row, clamped to `LEAST(balance, amount)`, never negative | RPC `public.redeem_wallet_atomic` |
| Order cancellation | Reverses stock + referral exactly once; cancelled orders cannot be reopened | `updateOrderStatus` in `orders.functions.ts` |
| Hard delete | Only allowed on already-cancelled orders; requires `confirm: "DELETE"` | `hardDeleteOrder` |
| Admin mutations | Verified server-side with `has_role(auth.uid(), 'admin')`; client UI never calls `from('orders').delete()` | `isAdminAccess` + RLS policies |
| Audit trail | Every status change, stock restore, hard delete writes to `admin_audit_log` | `logAdminAction` |

---

## 2. Manual test checklist

Run each scenario in a Test Cloud environment. ✅ = pass.

### Orders & stock
1. **Normal order** — Place a COD order with a stock-tracked product. Order is `pending`, total/discount/shipping match UI.
2. **Stock decrement** — `products.stock` decreases by ordered qty. When stock hits 0, `availability_status` flips to `out_of_stock`.
3. **Over-stock rejected** — Try qty greater than current stock. `createOrder` returns `out_of_stock` and no order row is created.

### Coupons
4. **First use** — Apply `WELCOME10` (or any active coupon) on checkout. `coupons.used_count` increments by 1 inside the same transaction as order insert.
5. **Same-phone reuse blocked** — Same phone, same coupon → `redeem_coupon_atomic` returns `هذا الرقم استخدم الكوبون من قبل`.
6. **`max_uses` cap respected** — Set a coupon with `max_uses = 1`. Two parallel checkouts: only one succeeds; the second sees `تم استنفاد كود الخصم` and the coupon flips to `active = false`.

### Wallet
7. **Wallet redemption** — Logged-in customer with positive `wallet_balance` checks out using wallet. Balance drops by exactly the redeemed amount; a `wallet_transactions` row is written with negative amount and `kind = 'redemption'`.
8. **No double-spend** — Two near-simultaneous orders larger than balance: total redeemed across both ≤ original balance. Balance never goes negative.

### Cancellation
9. **Cancel reverses safely** — Cancel a confirmed order. Stock is restored, referral (if any) is reversed, `stock_restored = true`, `cancelled_at` is set.
10. **No double reversal** — Re-cancel the same order. `updateOrderStatus` short-circuits because `previousStatus === 'cancelled'` and returns `لا يمكن إعادة فتح طلب ملغي`.

### Admin
11. **Admin panel safe** — Admin can change status, cancel, and (only on cancelled orders) hard-delete via UI. No raw `supabase.from('orders').delete()` exists in the client. Every action shows up in `/admin/audit`.

---

## 3. Repeatable SQL safety probe

Use `docs/safety-tests.sql` for a quick, read-only health probe of the architecture invariants (no test data inserted). Run with:

```bash
psql "$SUPABASE_DB_URL" -f docs/safety-tests.sql
```

It checks: presence of all atomic RPCs, presence of safety columns on `orders`, RLS enabled on sensitive tables, and no orphaned `stock_restored = true` orders on non-cancelled status.

---

## 4. Test data hygiene

- Use phones `010XXXXXXXX` you control. Never reuse `01099999999` / `01055555555` — those are reserved for past safety runs and may conflict with cleanup migrations.
- Test products should have a `__test_` prefix in `slug` so they are easy to filter and clean.
- After running destructive tests, check `WELCOME10.used_count` and reset via a scoped migration if it was bumped purely by the test.

---

## 5. Audit visibility

Admins see `/admin/audit` (sidebar: **سجل الأمان**) which lists the last 200 entries from `admin_audit_log`. Every cancellation, stock restore, hard delete, and referral hook outcome appears there with actor email, action key, target id, and JSON details.
