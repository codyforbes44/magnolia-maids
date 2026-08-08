ALTER TABLE public.campaign_leads
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz;

UPDATE public.campaign_leads
SET source = 'facebook',
    followup_sent_at = COALESCE(followup_sent_at, now())
WHERE message ILIKE '%Facebook Lead Ads%';

CREATE INDEX IF NOT EXISTS campaign_leads_followup_idx
  ON public.campaign_leads (source, followup_sent_at, created_at);