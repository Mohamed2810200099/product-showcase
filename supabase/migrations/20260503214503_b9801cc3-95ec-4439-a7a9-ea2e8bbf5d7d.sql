create or replace function public.has_used_coupon(_code text, _phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders
    where upper(coupon_code) = upper(_code)
      and customer_phone = _phone
      and status <> 'cancelled'
  )
$$;

grant execute on function public.has_used_coupon(text, text) to anon, authenticated;