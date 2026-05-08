ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type text;

CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products (product_type);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN (tags);