ALTER TABLE public.outbound_calls
  ADD COLUMN IF NOT EXISTS queued_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS dialing_at timestamptz,
  ADD COLUMN IF NOT EXISTS connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.call_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.outbound_calls(id) ON DELETE CASCADE,
  status text NOT NULL,
  detail text,
  source text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_status_events_call_id_idx
  ON public.call_status_events (call_id, created_at DESC);

GRANT SELECT ON public.call_status_events TO authenticated;
GRANT ALL ON public.call_status_events TO service_role;

ALTER TABLE public.call_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view call status events"
  ON public.call_status_events FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.outbound_calls REPLICA IDENTITY FULL;
ALTER TABLE public.call_status_events REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.outbound_calls;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_status_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;