ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE public.campaign_leads ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS booking_requests_reminder_idx ON public.booking_requests (reminder_sent_at, created_at);
CREATE INDEX IF NOT EXISTS campaign_leads_reminder_idx ON public.campaign_leads (reminder_sent_at, created_at);