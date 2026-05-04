
-- =========================================
-- Customer profiles (per-user referral data)
-- =========================================
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  personal_code TEXT NOT NULL UNIQUE,
  wallet_balance NUMERIC NOT NULL DEFAULT 0,
  lifetime_credits_earned NUMERIC NOT NULL DEFAULT 0,
  current_month_key TEXT,
  current_month_credits NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own customer profile"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own customer profile"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage customer profiles"
  ON public.customer_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public lookup function so checkout can validate a referral code
-- without exposing the full table to anonymous readers.
CREATE OR REPLACE FUNCTION public.lookup_referral_owner(_code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.customer_profiles
  WHERE upper(personal_code) = upper(_code)
  LIMIT 1
$$;

-- =========================================
-- Wallet transactions (credit ledger)
-- =========================================
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL, -- positive = credit, negative = debit
  kind TEXT NOT NULL, -- 'referral_reward' | 'redemption' | 'reversal' | 'adjustment'
  order_id UUID,
  related_order_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet tx"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage wallet tx"
  ON public.wallet_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);

-- =========================================
-- Referral uses (track each redemption)
-- =========================================
CREATE TABLE public.referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  friend_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  friend_phone TEXT,
  order_id UUID,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | rewarded | reversed | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referral uses"
  ON public.referral_uses FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = friend_user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage referral uses"
  ON public.referral_uses FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER referral_uses_updated_at
  BEFORE UPDATE ON public.referral_uses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_referral_uses_code ON public.referral_uses(code);
CREATE INDEX idx_referral_uses_referrer ON public.referral_uses(referrer_user_id);
CREATE INDEX idx_referral_uses_friend ON public.referral_uses(friend_user_id);

-- =========================================
-- Orders extensions
-- =========================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_user_id UUID,
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
  ADD COLUMN IF NOT EXISTS wallet_redeemed NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrer_credit_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrer_credit_status TEXT NOT NULL DEFAULT 'none';
  -- referrer_credit_status: 'none' | 'pending' | 'granted' | 'reversed'

CREATE INDEX IF NOT EXISTS idx_orders_customer_user ON public.orders(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders(referral_code_used);

-- Allow logged-in customers to view their own orders
CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_user_id);

-- Allow customers (and guests) to create orders. Server function still controls totals.
CREATE POLICY "Anyone can create order"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- =========================================
-- Personal code generator + auto-create profile
-- =========================================
CREATE OR REPLACE FUNCTION public.generate_personal_code(_seed TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  attempts INT := 0;
BEGIN
  base := upper(regexp_replace(coalesce(_seed,''), '[^a-zA-Z]', '', 'g'));
  IF length(base) < 3 THEN
    base := 'GLOW';
  END IF;
  base := substring(base from 1 for 6);

  LOOP
    candidate := base || (floor(random() * 90 + 10))::int::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.customer_profiles WHERE personal_code = candidate);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      candidate := base || (floor(random() * 9000 + 1000))::int::text;
      EXIT;
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_customer_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seed TEXT;
BEGIN
  -- skip if already created (e.g. admin trigger)
  IF EXISTS (SELECT 1 FROM public.customer_profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  seed := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.customer_profiles (user_id, display_name, personal_code)
  VALUES (
    NEW.id,
    COALESCE(seed, 'Glow'),
    public.generate_personal_code(seed)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_customer_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer_profile();

-- =========================================
-- Default settings for the program
-- =========================================
INSERT INTO public.settings (key, value)
VALUES ('share_the_glow', jsonb_build_object(
  'enabled', true,
  'friend_discount_pct', 15,
  'referrer_reward_pct', 10,
  'monthly_cap', 500,
  'min_redemption', 50,
  'max_wallet_per_order_pct', 50
))
ON CONFLICT (key) DO NOTHING;

-- Public read for the program settings so the storefront can show the rules
CREATE POLICY "Public read share_the_glow settings"
  ON public.settings FOR SELECT
  USING (key = 'share_the_glow');
