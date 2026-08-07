ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_unit text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_postal_code text,
  ADD COLUMN IF NOT EXISTS address_country text,
  ADD COLUMN IF NOT EXISTS address_lat double precision,
  ADD COLUMN IF NOT EXISTS address_lng double precision,
  ADD COLUMN IF NOT EXISTS address_place_id text;