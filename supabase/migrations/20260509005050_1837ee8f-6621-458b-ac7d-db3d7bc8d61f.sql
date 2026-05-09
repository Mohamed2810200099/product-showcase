
REVOKE EXECUTE ON FUNCTION public.redeem_coupon_atomic(text, numeric, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.redeem_wallet_atomic(uuid, numeric, uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.restore_product_stock(jsonb) FROM anon, authenticated, public;
