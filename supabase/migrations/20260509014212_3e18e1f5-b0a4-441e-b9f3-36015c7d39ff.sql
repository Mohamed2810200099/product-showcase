
-- Cleanup of safety-test artifacts. Each statement is scoped to exact known IDs.

DELETE FROM public.orders
WHERE id IN (
  'b22e3f38-0316-4e78-bd69-afaee1581e10',
  'c2c46a68-4814-45b4-9f39-0a3c6956c525'
)
AND customer_phone IN ('01099999999','01055555555')
AND status = 'pending';

DELETE FROM public.products
WHERE id = '00000000-0000-0000-0000-000000000099'
  AND slug = '__test_safety__';

UPDATE public.coupons
SET used_count = GREATEST(used_count - 1, 0),
    active = true
WHERE code = 'WELCOME10'
  AND used_count >= 1;
