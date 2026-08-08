CREATE TABLE public.email_template_overrides (
  template_id text PRIMARY KEY,
  subject text,
  hero_title text,
  hero_subtitle text,
  cta_label text,
  intro_html text,
  footer_note text,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_overrides TO authenticated;
GRANT ALL ON public.email_template_overrides TO service_role;

ALTER TABLE public.email_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email template overrides"
ON public.email_template_overrides
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER email_template_overrides_touch
BEFORE UPDATE ON public.email_template_overrides
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();