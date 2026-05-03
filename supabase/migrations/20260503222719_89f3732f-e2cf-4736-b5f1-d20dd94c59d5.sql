-- has_role is used inside RLS policies on products, user_roles, etc.
-- Policies need EXECUTE for ALL roles that touch those tables (anon for public reads, authenticated for logged in).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;