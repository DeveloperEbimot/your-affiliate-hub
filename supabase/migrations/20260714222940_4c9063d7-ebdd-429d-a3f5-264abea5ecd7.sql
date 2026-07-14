
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS listing_type text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS beds integer,
  ADD COLUMN IF NOT EXISTS rooms integer,
  ADD COLUMN IF NOT EXISTS bathrooms integer,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}'::text[];

-- Reseed categories for travel
DELETE FROM public.categories WHERE slug IN ('electronics','home-kitchen','fashion','beauty','books','sports-outdoors','toys-games','health');

INSERT INTO public.categories (name, slug) VALUES
  ('Hotels','hotels'),
  ('Flights','flights'),
  ('Tours','tours'),
  ('Activities','activities'),
  ('Car Rentals','car-rentals'),
  ('Cruises','cruises')
ON CONFLICT DO NOTHING;
