CREATE TABLE public.custom_email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_template_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Custom',
  audience text NOT NULL DEFAULT 'Customer',
  description text NOT NULL DEFAULT '',
  subject text,
  hero_title text,
  hero_subtitle text,
  cta_label text,
  intro_html text,
  footer_note text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_email_templates TO authenticated;
GRANT ALL ON public.custom_email_templates TO service_role;

ALTER TABLE public.custom_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage custom email templates"
ON public.custom_email_templates FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER custom_email_templates_touch
BEFORE UPDATE ON public.custom_email_templates
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();