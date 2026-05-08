DROP TRIGGER IF EXISTS reviews_recompute_rating ON public.reviews;

CREATE TRIGGER reviews_recompute_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.recompute_product_rating();

-- Backfill once so existing data is consistent
UPDATE public.products p
SET rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.product_id = p.id AND r.approved = true), 0),
    reviews_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id = p.id AND r.approved = true);