ALTER TABLE public.email_template_overrides ADD COLUMN IF NOT EXISTS body_html text;
ALTER TABLE public.custom_email_templates ADD COLUMN IF NOT EXISTS body_html text;