DROP TRIGGER IF EXISTS reviews_recompute_rating_ins ON public.reviews;
DROP TRIGGER IF EXISTS reviews_recompute_rating_upd ON public.reviews;
DROP TRIGGER IF EXISTS reviews_recompute_rating_del ON public.reviews;

CREATE TRIGGER reviews_recompute_rating_ins
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_product_rating();

CREATE TRIGGER reviews_recompute_rating_upd
AFTER UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_product_rating();

CREATE TRIGGER reviews_recompute_rating_del
AFTER DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_product_rating();