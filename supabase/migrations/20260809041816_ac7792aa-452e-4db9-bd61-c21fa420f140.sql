CREATE TABLE public.franchise_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  phone_digits text,
  target_city text,
  target_state text,
  timeline text,
  capital_band text,
  background text,
  why text,
  notes text,
  admin_notes text,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'franchise-page',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  landing_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_inquiries TO authenticated;
GRANT ALL ON public.franchise_inquiries TO service_role;

ALTER TABLE public.franchise_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read franchise inquiries"
  ON public.franchise_inquiries FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update franchise inquiries"
  ON public.franchise_inquiries FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete franchise inquiries"
  ON public.franchise_inquiries FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert franchise inquiries"
  ON public.franchise_inquiries FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX franchise_inquiries_created_idx ON public.franchise_inquiries (created_at DESC);
CREATE INDEX franchise_inquiries_email_idx ON public.franchise_inquiries (lower(email));

CREATE TRIGGER franchise_inquiries_touch
  BEFORE UPDATE ON public.franchise_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();