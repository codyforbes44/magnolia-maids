ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS phone_digits text GENERATED ALWAYS AS (regexp_replace(coalesce(phone,''), '\D', '', 'g')) STORED;
ALTER TABLE public.campaign_leads
  ADD COLUMN IF NOT EXISTS phone_digits text GENERATED ALWAYS AS (regexp_replace(coalesce(phone,''), '\D', '', 'g')) STORED;
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS phone_digits text GENERATED ALWAYS AS (regexp_replace(coalesce(phone,''), '\D', '', 'g')) STORED;
ALTER TABLE public.property_inquiries
  ADD COLUMN IF NOT EXISTS phone_digits text GENERATED ALWAYS AS (regexp_replace(coalesce(phone,''), '\D', '', 'g')) STORED;

CREATE INDEX IF NOT EXISTS booking_requests_email_lower_idx ON public.booking_requests (lower(email));
CREATE INDEX IF NOT EXISTS booking_requests_phone_digits_idx ON public.booking_requests (phone_digits);
CREATE INDEX IF NOT EXISTS campaign_leads_email_lower_idx ON public.campaign_leads (lower(email));
CREATE INDEX IF NOT EXISTS campaign_leads_phone_digits_idx ON public.campaign_leads (phone_digits);
CREATE INDEX IF NOT EXISTS job_applications_email_lower_idx ON public.job_applications (lower(email));
CREATE INDEX IF NOT EXISTS job_applications_phone_digits_idx ON public.job_applications (phone_digits);
CREATE INDEX IF NOT EXISTS property_inquiries_email_lower_idx ON public.property_inquiries (lower(email));
CREATE INDEX IF NOT EXISTS property_inquiries_phone_digits_idx ON public.property_inquiries (phone_digits);

CREATE TABLE IF NOT EXISTS public.contact_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_table text NOT NULL,
  record_id uuid NOT NULL,
  event text NOT NULL DEFAULT 'created',
  source text,
  email text,
  phone text,
  summary text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contact_activity TO authenticated;
GRANT ALL ON public.contact_activity TO service_role;

ALTER TABLE public.contact_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read contact activity"
  ON public.contact_activity FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS contact_activity_record_idx ON public.contact_activity (record_table, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_activity_created_idx ON public.contact_activity (created_at DESC);