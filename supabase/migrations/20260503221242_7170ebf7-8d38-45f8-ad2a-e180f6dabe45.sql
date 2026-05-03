
-- 1) Revoke EXECUTE from anon/authenticated on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recompute_product_rating() FROM anon, authenticated, public;

-- 2) Coupons: restrict public SELECT to safe columns via a view; drop public read on the table
DROP POLICY IF EXISTS "Active coupons readable by anyone" ON public.coupons;

CREATE OR REPLACE VIEW public.coupons_public
WITH (security_invoker = true) AS
SELECT id, code, type, value, min_order, active
FROM public.coupons
WHERE active = true;

GRANT SELECT ON public.coupons_public TO anon, authenticated;

-- Re-add a SELECT policy that admins can use; non-admins use the view
CREATE POLICY "Admins can read coupons"
  ON public.coupons
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Settings: restrict public SELECT to allow-listed keys only
DROP POLICY IF EXISTS "Settings readable by anyone" ON public.settings;

CREATE POLICY "Public settings readable by anyone"
  ON public.settings
  FOR SELECT
  USING (key IN ('brand'));

CREATE POLICY "Admins read all settings"
  ON public.settings
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
