CREATE TABLE public.property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  property_address text,
  total_units integer,
  units_studio integer NOT NULL DEFAULT 0,
  units_1bd integer NOT NULL DEFAULT 0,
  units_2bd integer NOT NULL DEFAULT 0,
  units_3bd_plus integer NOT NULL DEFAULT 0,
  turns_per_month text,
  turnaround text,
  access_method text,
  needs_trash_out boolean NOT NULL DEFAULT false,
  needs_carpet_care boolean NOT NULL DEFAULT false,
  start_date date,
  contact_name text NOT NULL,
  contact_role text,
  company text,
  email text NOT NULL,
  phone text,
  notes text,
  admin_notes text,
  status text NOT NULL DEFAULT 'new',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  landing_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.property_inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_inquiries TO authenticated;
GRANT ALL ON public.property_inquiries TO service_role;

ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit property inquiries"
ON public.property_inquiries FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(property_name)) > 0
  AND length(btrim(contact_name)) > 0
  AND length(btrim(email)) > 3
  AND email LIKE '%_@_%.__%'
  AND status = 'new'
);

CREATE POLICY "Admins can view property inquiries"
ON public.property_inquiries FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update property inquiries"
ON public.property_inquiries FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete property inquiries"
ON public.property_inquiries FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER property_inquiries_touch
BEFORE UPDATE ON public.property_inquiries
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();