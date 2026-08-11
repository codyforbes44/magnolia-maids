CREATE TABLE public.sms_template_overrides (
  template_id text PRIMARY KEY,
  body text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_template_overrides TO authenticated;
GRANT ALL ON public.sms_template_overrides TO service_role;
ALTER TABLE public.sms_template_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms template overrides" ON public.sms_template_overrides
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER sms_template_overrides_touch BEFORE UPDATE ON public.sms_template_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.sms_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL,
  body text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX sms_template_versions_template_idx ON public.sms_template_versions (template_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.sms_template_versions TO authenticated;
GRANT ALL ON public.sms_template_versions TO service_role;
ALTER TABLE public.sms_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms template versions" ON public.sms_template_versions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.sms_template_variables (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_template_variables TO authenticated;
GRANT ALL ON public.sms_template_variables TO service_role;
ALTER TABLE public.sms_template_variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms template variables" ON public.sms_template_variables
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER sms_template_variables_touch BEFORE UPDATE ON public.sms_template_variables
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();