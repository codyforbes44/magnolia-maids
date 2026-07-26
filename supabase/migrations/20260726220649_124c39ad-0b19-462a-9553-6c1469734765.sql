
CREATE TABLE public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text NOT NULL,
  bedrooms text NOT NULL,
  bathrooms text NOT NULL,
  service text NOT NULL,
  frequency text NOT NULL,
  preferred_day date,
  preferred_time text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.booking_requests TO anon, authenticated;
GRANT ALL ON public.booking_requests TO service_role;

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) may submit a booking request
CREATE POLICY "Anyone can submit booking requests"
  ON public.booking_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
-- Intentionally no SELECT policy: submissions are read server-side only.
