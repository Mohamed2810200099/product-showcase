-- Restrict EXECUTE on internal SECURITY DEFINER functions
revoke execute on function public.handle_new_user_role() from public, anon, authenticated;
revoke execute on function public.recompute_product_rating() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
-- has_role is intentionally callable (used in RLS), but restrict to authenticated only
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;