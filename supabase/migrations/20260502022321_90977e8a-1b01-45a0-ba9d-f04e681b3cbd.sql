-- Fix mutable search_path on helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.recompute_product_rating()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.product_id, old.product_id);
  update public.products p
  set rating = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where product_id = pid and approved = true), 0),
      reviews_count = (select count(*) from public.reviews where product_id = pid and approved = true)
  where p.id = pid;
  return null;
end;
$$;

-- Restrict has_role execution to authenticated/service roles only
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- Tighten public-insert policies (replace `true` with input sanity checks)
drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders" on public.orders
  for insert
  with check (
    length(customer_name) between 2 and 100
    and length(customer_phone) between 6 and 20
    and length(address) between 3 and 500
    and length(city) between 2 and 100
    and length(governorate) between 2 and 100
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 100
    and total >= 0
    and status = 'pending'
  );

drop policy if exists "Anyone can submit a review" on public.reviews;
create policy "Anyone can submit a review" on public.reviews
  for insert
  with check (
    length(customer_name) between 2 and 100
    and rating between 1 and 5
    and (comment is null or length(comment) <= 1000)
    and approved = false
  );