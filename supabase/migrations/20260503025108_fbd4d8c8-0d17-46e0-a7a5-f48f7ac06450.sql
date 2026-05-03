-- Add availability fields to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS stock_tracking_enabled boolean NOT NULL DEFAULT false;

-- Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  referrer_name text NOT NULL,
  referrer_contact text NOT NULL,
  friend_discount_pct integer NOT NULL DEFAULT 10,
  referrer_reward_pct integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending',
  uses_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a referral"
  ON public.referrals FOR INSERT
  WITH CHECK (
    length(referrer_name) BETWEEN 2 AND 100
    AND length(referrer_contact) BETWEEN 3 AND 200
    AND length(code) BETWEEN 4 AND 30
    AND status = 'pending'
  );

CREATE POLICY "Admins manage referrals"
  ON public.referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER referrals_set_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();