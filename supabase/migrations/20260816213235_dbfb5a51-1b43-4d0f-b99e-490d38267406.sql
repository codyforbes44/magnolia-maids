CREATE TABLE public.slack_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  team_id text,
  channel_id text,
  user_id text,
  event_type text,
  thread_ts text,
  ts text,
  text text,
  handled boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.slack_events TO authenticated;
GRANT ALL ON public.slack_events TO service_role;
ALTER TABLE public.slack_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read slack events" ON public.slack_events
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.slack_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  thread_ts text,
  ts text,
  kind text NOT NULL DEFAULT 'notification',
  text text,
  payload jsonb,
  status text NOT NULL DEFAULT 'sent',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.slack_messages TO authenticated;
GRANT ALL ON public.slack_messages TO service_role;
ALTER TABLE public.slack_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read slack messages" ON public.slack_messages
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_slack_messages_created_at ON public.slack_messages (created_at DESC);
CREATE INDEX idx_slack_events_created_at ON public.slack_events (created_at DESC);