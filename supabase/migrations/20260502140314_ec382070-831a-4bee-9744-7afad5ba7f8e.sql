-- ============================================
-- Storage buckets for images
-- ============================================
insert into storage.buckets (id, name, public)
values 
  ('products', 'products', true),
  ('categories', 'categories', true),
  ('testimonials', 'testimonials', true),
  ('media', 'media', true)
on conflict (id) do nothing;

-- Public can read
create policy "Public read products"
on storage.objects for select
using (bucket_id in ('products', 'categories', 'testimonials', 'media'));

-- Admins can manage all images
create policy "Admins upload images"
on storage.objects for insert
with check (
  bucket_id in ('products', 'categories', 'testimonials', 'media')
  and public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "Admins update images"
on storage.objects for update
using (
  bucket_id in ('products', 'categories', 'testimonials', 'media')
  and public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "Admins delete images"
on storage.objects for delete
using (
  bucket_id in ('products', 'categories', 'testimonials', 'media')
  and public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ============================================
-- Auto-promote first signed-up user to admin
-- ============================================
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- if no admin exists yet, make this new user the first admin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_role();