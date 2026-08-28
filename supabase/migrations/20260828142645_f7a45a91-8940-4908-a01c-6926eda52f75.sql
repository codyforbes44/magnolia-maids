ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.campaign_leads ADD COLUMN IF NOT EXISTS admin_notes text;