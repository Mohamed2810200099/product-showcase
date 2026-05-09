-- Production-safety probe — READ ONLY.
-- Run with: psql "$SUPABASE_DB_URL" -f docs/safety-tests.sql
-- Each query returns 1 row labelled "PASS" / "FAIL" so output is easy to scan.

\echo '=== 1. Atomic RPCs exist ==='
SELECT
  CASE WHEN count(*) = 4 THEN 'PASS' ELSE 'FAIL' END AS status,
  count(*) AS found,
  array_agg(proname ORDER BY proname) AS functions
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'decrement_product_stock',
    'restore_product_stock',
    'redeem_coupon_atomic',
    'redeem_wallet_atomic'
  );

\echo '=== 2. Safety columns on orders ==='
SELECT
  CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS status,
  array_agg(column_name) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('stock_restored', 'cancelled_at');

\echo '=== 3. RLS enabled on sensitive tables ==='
SELECT
  CASE WHEN bool_and(rowsecurity) THEN 'PASS' ELSE 'FAIL' END AS status,
  array_agg(tablename || '=' || rowsecurity::text) AS tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders','coupons','customer_profiles','wallet_transactions','admin_audit_log','user_roles');

\echo '=== 4. No orphaned stock_restored on non-cancelled orders ==='
SELECT
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
  count(*) AS bad_rows
FROM public.orders
WHERE stock_restored = true AND status <> 'cancelled';

\echo '=== 5. No negative wallet balances ==='
SELECT
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
  count(*) AS negative_profiles
FROM public.customer_profiles
WHERE wallet_balance < 0;

\echo '=== 6. No coupons over their max_uses ==='
SELECT
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
  count(*) AS overused
FROM public.coupons
WHERE max_uses IS NOT NULL AND used_count > max_uses;

\echo '=== 7. admin_audit_log has the expected action keys ==='
SELECT DISTINCT action
FROM public.admin_audit_log
ORDER BY action;
