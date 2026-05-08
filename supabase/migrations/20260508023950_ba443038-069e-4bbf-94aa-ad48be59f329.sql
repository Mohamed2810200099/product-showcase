REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(jsonb) TO service_role;