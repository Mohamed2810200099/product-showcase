-- Restrict direct order inserts; require server-function path
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;