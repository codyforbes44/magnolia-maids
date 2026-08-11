CREATE TABLE public.reminder_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_table text NOT NULL,
  record_id uuid NOT NULL,
  offset_key text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_table, record_id, offset_key, channel)
);

GRANT SELECT ON public.reminder_dispatches TO authenticated;
GRANT ALL ON public.reminder_dispatches TO service_role;

ALTER TABLE public.reminder_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder dispatches"
  ON public.reminder_dispatches FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.business_settings (key, value, is_public)
VALUES (
  'reminder_timing',
  '{"default":{"daysBefore":[1],"hoursBefore":[]},"services":{}}'::jsonb,
  false
)
ON CONFLICT (key) DO NOTHING;