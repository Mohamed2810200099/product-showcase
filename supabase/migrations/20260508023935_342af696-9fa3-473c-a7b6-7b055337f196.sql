-- Atomic stock decrement function with race-condition protection.
-- For each item, locks the product row and decrements stock only if enough is available.
-- Updates availability_status to 'out_of_stock' when stock reaches 0.
-- Returns the product_id of the first product that doesn't have enough stock, or NULL on success.

CREATE OR REPLACE FUNCTION public.decrement_product_stock(_items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty int;
  current_stock int;
  tracking boolean;
BEGIN
  -- Lock all involved product rows up-front in a stable order to avoid deadlocks
  PERFORM 1 FROM public.products
  WHERE id IN (SELECT (value->>'product_id')::uuid FROM jsonb_array_elements(_items))
  ORDER BY id
  FOR UPDATE;

  FOR item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    pid := (item->>'product_id')::uuid;
    qty := (item->>'qty')::int;

    SELECT stock, stock_tracking_enabled
      INTO current_stock, tracking
    FROM public.products
    WHERE id = pid;

    IF NOT FOUND THEN
      RETURN pid;
    END IF;

    IF tracking IS TRUE THEN
      IF current_stock < qty THEN
        RETURN pid;
      END IF;

      UPDATE public.products
      SET stock = current_stock - qty,
          availability_status = CASE
            WHEN (current_stock - qty) <= 0 THEN 'out_of_stock'
            ELSE availability_status
          END
      WHERE id = pid;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;