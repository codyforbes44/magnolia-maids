CREATE TABLE public.messenger_threads (
  thread_id text PRIMARY KEY,
  page_id text NOT NULL,
  person_id text,
  person_name text NOT NULL DEFAULT 'Facebook user',
  auto_reply boolean NOT NULL DEFAULT true,
  needs_attention boolean NOT NULL DEFAULT false,
  handoff_reason text,
  snippet text,
  ai_reply_streak integer NOT NULL DEFAULT 0,
  last_inbound_at timestamp with time zone,
  last_outbound_at timestamp with time zone,
  last_ai_reply_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.messenger_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id text NOT NULL,
  page_id text NOT NULL,
  mid text,
  sender text NOT NULL CHECK (sender IN ('customer','page','maggie')),
  body text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX messenger_messages_mid_key ON public.messenger_messages (mid) WHERE mid IS NOT NULL;
CREATE INDEX messenger_messages_thread_idx ON public.messenger_messages (thread_id, created_at);
CREATE INDEX messenger_threads_page_idx ON public.messenger_threads (page_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messenger_threads TO authenticated;
GRANT ALL ON public.messenger_threads TO service_role;
GRANT SELECT ON public.messenger_messages TO authenticated;
GRANT ALL ON public.messenger_messages TO service_role;

ALTER TABLE public.messenger_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage messenger threads"
ON public.messenger_threads FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read messenger messages"
ON public.messenger_messages FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER messenger_threads_touch
BEFORE UPDATE ON public.messenger_threads
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.business_settings (key, value, is_public)
VALUES ('messenger_auto_reply', '{"enabled": false}'::jsonb, false)
ON CONFLICT (key) DO NOTHING;