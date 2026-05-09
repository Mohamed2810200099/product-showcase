
-- Idempotency / tracking columns on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log" ON public.admin_audit_log
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);

-- Atomic coupon redemption: locks the row, validates, increments used_count,
-- auto-deactivates when exhausted. Prevents overuse under concurrent orders.
CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(
  _code text,
  _subtotal numeric,
  _phone text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  d numeric;
  used_phone boolean;
  first_only_count int;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(_code) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'كود الخصم غير صالح');
  END IF;
  IF NOT c.active THEN
    RETURN jsonb_build_object('ok', false, 'error', 'كود الخصم غير مفعل');
  END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'كود الخصم غير مفعل بعد');
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'انتهت صلاحية كود الخصم');
  END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    UPDATE public.coupons SET active = false WHERE id = c.id AND active = true;
    RETURN jsonb_build_object('ok', false, 'error', 'تم استنفاد كود الخصم');
  END IF;
  IF c.min_order > _subtotal THEN
    RETURN jsonb_build_object('ok', false, 'error', 'لم يتحقق الحد الأدنى للكوبون');
  END IF;

  IF _phone IS NOT NULL AND length(_phone) > 0 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.orders
      WHERE upper(coupon_code) = upper(c.code)
        AND customer_phone = _phone
        AND status <> 'cancelled'
    ) INTO used_phone;
    IF used_phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'هذا الرقم استخدم الكوبون من قبل');
    END IF;
    IF c.first_order_only THEN
      SELECT count(*) INTO first_only_count
      FROM public.orders
      WHERE customer_phone = _phone AND status <> 'cancelled';
      IF first_only_count > 0 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'هذا الكود مخصص لأول طلب فقط');
      END IF;
    END IF;
  END IF;

  IF c.type = 'percent' THEN
    d := round((_subtotal * c.value) / 100);
  ELSE
    d := c.value;
  END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  IF d < 0 THEN d := 0; END IF;

  UPDATE public.coupons
    SET used_count = used_count + 1,
        active = CASE
          WHEN max_uses IS NOT NULL AND used_count + 1 >= max_uses THEN false
          ELSE active
        END
    WHERE id = c.id;

  RETURN jsonb_build_object('ok', true, 'code', c.code, 'discount', d);
END;
$$;

-- Atomic wallet redemption: locks the profile, deducts safely, records tx.
-- Returns the actual amount redeemed (may be less than requested).
CREATE OR REPLACE FUNCTION public.redeem_wallet_atomic(
  _user_id uuid,
  _amount numeric,
  _order_id uuid,
  _order_number text
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bal numeric;
  redeem numeric;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RETURN 0; END IF;

  SELECT wallet_balance INTO bal
  FROM public.customer_profiles
  WHERE user_id = _user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN 0; END IF;

  redeem := LEAST(bal, _amount);
  IF redeem <= 0 THEN RETURN 0; END IF;

  UPDATE public.customer_profiles
    SET wallet_balance = wallet_balance - redeem
    WHERE user_id = _user_id;

  INSERT INTO public.wallet_transactions(user_id, amount, kind, order_id, note)
  VALUES (_user_id, -redeem, 'redemption', _order_id,
          'استخدام رصيد في طلب ' || coalesce(_order_number, ''));

  RETURN redeem;
END;
$$;

-- Restore stock for cancelled orders. Caller must ensure idempotency
-- via the orders.stock_restored flag.
CREATE OR REPLACE FUNCTION public.restore_product_stock(_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty int;
BEGIN
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN RETURN; END IF;

  PERFORM 1 FROM public.products
  WHERE id IN (SELECT (value->>'product_id')::uuid FROM jsonb_array_elements(_items))
  ORDER BY id
  FOR UPDATE;

  FOR item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    pid := (item->>'product_id')::uuid;
    qty := (item->>'qty')::int;

    UPDATE public.products
      SET stock = stock + qty,
          availability_status = CASE
            WHEN availability_status = 'out_of_stock' AND (stock + qty) > 0 THEN 'available'
            ELSE availability_status
          END
      WHERE id = pid AND stock_tracking_enabled = true;
  END LOOP;
END;
$$;
