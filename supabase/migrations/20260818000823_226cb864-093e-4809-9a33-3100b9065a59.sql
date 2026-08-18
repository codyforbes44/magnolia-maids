CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_key text NOT NULL,
  route text NOT NULL,
  event_type text,
  status text NOT NULL DEFAULT 'received',
  attempts integer NOT NULL DEFAULT 1,
  payload jsonb,
  error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (provider, event_key)
);
CREATE INDEX webhook_events_received_idx ON public.webhook_events (received_at DESC);
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view webhook events" ON public.webhook_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.outbound_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  channel text NOT NULL,
  recipient text,
  provider_id text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbound_idempotency_created_idx ON public.outbound_idempotency (created_at DESC);
GRANT SELECT ON public.outbound_idempotency TO authenticated;
GRANT ALL ON public.outbound_idempotency TO service_role;
ALTER TABLE public.outbound_idempotency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view outbound idempotency" ON public.outbound_idempotency
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.email_log
  ADD COLUMN IF NOT EXISTS delivery_status text,
  ADD COLUMN IF NOT EXISTS delivery_detail text,
  ADD COLUMN IF NOT EXISTS delivery_updated_at timestamptz;