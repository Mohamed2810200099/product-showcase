-- =========================================
-- ROLES SYSTEM (security definer to avoid recursion)
-- =========================================
create type public.app_role as enum ('admin', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- UPDATED_AT trigger helper
-- =========================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- CATEGORIES
-- =========================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  slug text not null unique,
  image text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone" on public.categories
  for select using (true);
create policy "Admins manage categories" on public.categories
  for all using (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- PRODUCTS
-- =========================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  slug text not null unique,
  description text,
  short_description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  sku text,
  stock int not null default 0,
  images jsonb not null default '[]'::jsonb,
  category_id uuid references public.categories(id) on delete set null,
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  is_featured boolean not null default false,
  is_limited boolean not null default false,
  is_active boolean not null default true,
  brand text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "Active products are viewable by everyone" on public.products
  for select using (is_active = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage products" on public.products
  for all using (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- COUPONS
-- =========================================
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent','fixed')),
  value numeric(10,2) not null check (value >= 0),
  min_order numeric(10,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

create policy "Active coupons readable by anyone" on public.coupons
  for select using (active = true);
create policy "Admins manage coupons" on public.coupons
  for all using (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- ORDERS
-- =========================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('TGH-' || to_char(now(),'YYMMDD') || '-' || lpad((floor(random()*100000))::text,5,'0')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address text not null,
  city text not null,
  governorate text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  coupon_code text,
  payment_method text not null default 'cod',
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  whatsapp_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

create policy "Anyone can create orders" on public.orders
  for insert with check (true);
create policy "Admins view orders" on public.orders
  for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update orders" on public.orders
  for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete orders" on public.orders
  for delete using (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- REVIEWS
-- =========================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Approved reviews readable by anyone" on public.reviews
  for select using (approved = true or public.has_role(auth.uid(), 'admin'));
create policy "Anyone can submit a review" on public.reviews
  for insert with check (true);
create policy "Admins manage reviews" on public.reviews
  for all using (public.has_role(auth.uid(), 'admin'));

-- recompute product rating when reviews change
create or replace function public.recompute_product_rating()
returns trigger language plpgsql as $$
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

create trigger reviews_recompute after insert or update or delete on public.reviews
  for each row execute function public.recompute_product_rating();

-- =========================================
-- TESTIMONIALS
-- =========================================
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  text text not null,
  rating int not null default 5 check (rating between 1 and 5),
  image text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "Active testimonials readable by anyone" on public.testimonials
  for select using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage testimonials" on public.testimonials
  for all using (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- SETTINGS (key/value)
-- =========================================
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;

create policy "Settings readable by anyone" on public.settings
  for select using (true);
create policy "Admins manage settings" on public.settings
  for all using (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- SEED DATA
-- =========================================
insert into public.settings (key, value) values
  ('brand', jsonb_build_object(
    'whatsapp', '201554087371',
    'instagram', 'https://www.instagram.com/thegirlhouse_eg',
    'tiktok', 'https://www.tiktok.com/@thegirlhouse_eg',
    'facebook', 'https://www.facebook.com/share/18hzaYDPkr/',
    'announcement', 'منتجات DM الألمانية وصلت مصر أخيرًا 🇩🇪✨ الكمية محدودة — اطلبي قبل النفاد',
    'shipping_fee', 60,
    'free_shipping_threshold', 1500
  )),
  ('payments', jsonb_build_object(
    'cod', true,
    'paymob', false,
    'fawry', false,
    'stripe', false
  ));

insert into public.categories (name, name_en, slug, sort_order) values
  ('العناية بالشعر','Hair Care','hair-care',1),
  ('العناية بالبشرة','Skin Care','skin-care',2),
  ('المكياج','Makeup','makeup',3),
  ('العناية بالجسم','Body Care','body-care',4),
  ('العطور','Perfumes','perfumes',5),
  ('العناية بالأظافر','Nail Care','nail-care',6),
  ('العناية بالشفاه','Lip Care','lip-care',7),
  ('العناية بالعين','Eye Care','eye-care',8),
  ('فيتامينات ومكملات','Vitamins','vitamins',9),
  ('منتجات الأطفال','Baby Care','baby-care',10),
  ('العناية بالأسنان','Oral Care','oral-care',11),
  ('الحلاقة وإزالة الشعر','Shaving','shaving',12),
  ('العناية بالقدمين','Foot Care','foot-care',13),
  ('السيلولايت والتنحيف','Slimming','slimming',14),
  ('الواقي الشمسي','Sun Care','sun-care',15),
  ('هدايا وعروض','Gifts','gifts',16);

insert into public.coupons (code, type, value, min_order, active) values
  ('WELCOME10','percent',10,500,true);

insert into public.testimonials (name, role, text, rating, sort_order) values
  ('مريم أحمد','عميلة من القاهرة','المنتجات أصلية ١٠٠٪ ووصلت بسرعة وتغليف فخم. هرجع أطلب تاني أكيد ❤️',5,1),
  ('سلمى محمود','عميلة من الإسكندرية','أخيراً منتجات DM في مصر! شامبو Balea غير حياتي 😍',5,2),
  ('نور حسن','عميلة من الجيزة','الأسعار ممتازة والجودة الألمانية واضحة. خدمة عملاء راقية جداً.',5,3),
  ('هاجر علي','عميلة من المنصورة','طلبت كريم Nivea ووصلني نفس اليوم تقريباً. تجربة رائعة!',5,4),
  ('رنا خالد','عميلة من طنطا','أنا متابعة The Girl House من الانستجرام، بجد منتجات تستاهل كل قرش.',5,5);