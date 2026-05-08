CREATE POLICY "Public read show_referral_section settings"
ON public.settings FOR SELECT
USING (key = 'show_referral_section');