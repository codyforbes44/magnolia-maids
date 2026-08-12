CREATE TABLE public.outbound_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  phone text NOT NULL,
  phone_e164 text NOT NULL,
  email text,
  source_table text,
  source_id uuid,
  purpose text NOT NULL DEFAULT 'general_followup',
  context_note text,
  agent_id text NOT NULL,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'queued',
  assigned_to uuid,
  created_by uuid,
  created_by_label text NOT NULL DEFAULT 'admin',
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  conversation_id text,
  call_sid text,
  duration_secs integer,
  outcome text,
  outcome_notes text,
  transcript_summary text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbound_calls_status_sched_idx ON public.outbound_calls (status, scheduled_at);
CREATE INDEX outbound_calls_conversation_idx ON public.outbound_calls (conversation_id);
CREATE INDEX outbound_calls_phone_idx ON public.outbound_calls (phone_e164);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbound_calls TO authenticated;
GRANT ALL ON public.outbound_calls TO service_role;
ALTER TABLE public.outbound_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view outbound calls" ON public.outbound_calls FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert outbound calls" ON public.outbound_calls FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update outbound calls" ON public.outbound_calls FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete outbound calls" ON public.outbound_calls FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER outbound_calls_touch BEFORE UPDATE ON public.outbound_calls FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.call_opt_outs (
  phone_e164 text PRIMARY KEY,
  reason text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_opt_outs TO authenticated;
GRANT ALL ON public.call_opt_outs TO service_role;
ALTER TABLE public.call_opt_outs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view call opt outs" ON public.call_opt_outs FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert call opt outs" ON public.call_opt_outs FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update call opt outs" ON public.call_opt_outs FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete call opt outs" ON public.call_opt_outs FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));