ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz;

UPDATE public.job_applications
SET source = 'facebook',
    followup_sent_at = COALESCE(followup_sent_at, now())
WHERE notes ILIKE '%Facebook Lead Ads%';

CREATE INDEX IF NOT EXISTS job_applications_followup_idx
  ON public.job_applications (source, followup_sent_at, created_at);