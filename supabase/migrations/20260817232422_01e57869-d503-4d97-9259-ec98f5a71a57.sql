CREATE TABLE public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  contact_key text NOT NULL,
  contact_name text,
  phone text,
  email text,
  external_id text,
  last_snippet text,
  last_direction text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, contact_key)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  channel text NOT NULL,
  direction text NOT NULL,
  body text NOT NULL DEFAULT '',
  subject text,
  status text NOT NULL DEFAULT 'sent',
  provider_id text,
  error text,
  author text,
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_thread_created_idx ON public.messages (thread_id, created_at DESC);
CREATE INDEX message_threads_last_idx ON public.message_threads (last_message_at DESC);

CREATE TABLE public.admin_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  note text,
  channel text,
  due_at timestamptz,
  snooze_until timestamptz,
  link text,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_reminders_user_idx ON public.admin_reminders (user_id, due_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_threads TO authenticated;
GRANT ALL ON public.message_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_reminders TO authenticated;
GRANT ALL ON public.admin_reminders TO service_role;

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read threads" ON public.message_threads
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write threads" ON public.message_threads
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read messages" ON public.messages
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write messages" ON public.messages
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage own reminders" ON public.admin_reminders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND private.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id AND private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER message_threads_touch BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER admin_reminders_touch BEFORE UPDATE ON public.admin_reminders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Backfill text history from the shared activity log.
INSERT INTO public.message_threads (channel, contact_key, phone, contact_name, last_snippet, last_direction, last_message_at)
SELECT 'sms', recipient, recipient, NULL, (array_agg(subject ORDER BY created_at DESC))[1],
       CASE WHEN (array_agg(kind ORDER BY created_at DESC))[1] LIKE 'sms-inbound%' THEN 'in' ELSE 'out' END,
       max(created_at)
FROM public.email_log
WHERE kind LIKE 'sms%' AND recipient IS NOT NULL AND recipient <> ''
GROUP BY recipient
ON CONFLICT (channel, contact_key) DO NOTHING;

INSERT INTO public.messages (thread_id, channel, direction, body, status, provider_id, error, related_id, created_at)
SELECT t.id, 'sms',
       CASE WHEN e.kind LIKE 'sms-inbound%' THEN 'in' ELSE 'out' END,
       e.subject, e.status, e.provider_id, e.error, e.related_id, e.created_at
FROM public.email_log e
JOIN public.message_threads t ON t.channel = 'sms' AND t.contact_key = e.recipient
WHERE e.kind LIKE 'sms%';