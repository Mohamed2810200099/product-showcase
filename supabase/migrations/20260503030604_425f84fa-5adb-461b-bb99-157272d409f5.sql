
-- Extend coupons table with advanced fields
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_order_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_uses_per_customer integer,
  ADD COLUMN IF NOT EXISTS can_stack boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';

-- Ensure WELCOME10 exists with proper settings
INSERT INTO public.coupons (code, type, value, min_order, active, first_order_only, max_uses_per_customer, can_stack, source)
VALUES ('WELCOME10', 'percent', 10, 500, true, true, 1, false, 'admin')
ON CONFLICT (code) DO UPDATE SET
  type = 'percent', value = 10, active = true,
  first_order_only = true, max_uses_per_customer = 1, can_stack = false, source = 'admin';

-- Remove categories that have no products
DELETE FROM public.categories
WHERE id NOT IN (SELECT DISTINCT category_id FROM public.products WHERE category_id IS NOT NULL);
