ALTER TABLE public.campaign_leads
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS landing_path text;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS landing_path text;

CREATE INDEX IF NOT EXISTS campaign_leads_utm_source_idx ON public.campaign_leads (utm_source);
CREATE INDEX IF NOT EXISTS booking_requests_utm_source_idx ON public.booking_requests (utm_source);