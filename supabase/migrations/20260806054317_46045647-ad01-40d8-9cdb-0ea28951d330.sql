-- ============ JOB APPLICATIONS ============
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  area text NOT NULL,
  role text NOT NULL,
  availability text NOT NULL,
  experience text,
  notes text,
  admin_notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT INSERT ON public.job_applications TO anon;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an application" ON public.job_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) > 0
    AND length(btrim(email)) > 3
    AND email LIKE '%_@_%.__%'
    AND length(btrim(phone)) > 3
    AND status = 'new'
  );
CREATE POLICY "Admins can view applications" ON public.job_applications
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.job_applications
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete applications" ON public.job_applications
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));

-- ============ SERVICE RATES ============
CREATE TABLE public.service_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  base numeric(10,2) NOT NULL,
  per_bed numeric(10,2) NOT NULL DEFAULT 0,
  per_bath numeric(10,2) NOT NULL DEFAULT 0,
  recurring boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_rates TO authenticated;
GRANT ALL ON public.service_rates TO service_role;
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read service rates" ON public.service_rates
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage service rates" ON public.service_rates
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- ============ SERVICE ADD-ONS ============
CREATE TABLE public.service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_addons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_addons TO authenticated;
GRANT ALL ON public.service_addons TO service_role;
ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read add-ons" ON public.service_addons
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage add-ons" ON public.service_addons
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- ============ PRICING SETTINGS ============
CREATE TABLE public.pricing_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read pricing settings" ON public.pricing_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage pricing settings" ON public.pricing_settings
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- ============ SITE CONTENT ============
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, key)
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage site content" ON public.site_content
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- ============ CAMPAIGN CONTENT ============
CREATE TABLE public.campaign_content (
  campaign text PRIMARY KEY,
  value jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_content TO authenticated;
GRANT ALL ON public.campaign_content TO service_role;
ALTER TABLE public.campaign_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read campaign content" ON public.campaign_content
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage campaign content" ON public.campaign_content
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- ============ BUSINESS SETTINGS ============
CREATE TABLE public.business_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read public settings" ON public.business_settings
  FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "Authenticated can read public settings" ON public.business_settings
  FOR SELECT TO authenticated
  USING (is_public = true OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business settings" ON public.business_settings
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- ============ EMAIL LOG ============
CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  kind text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'sent',
  provider_id text,
  error text,
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_log_created_at_idx ON public.email_log (created_at DESC);
GRANT SELECT, DELETE ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read email log" ON public.email_log
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete email log" ON public.email_log
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER job_applications_touch BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER service_rates_touch BEFORE UPDATE ON public.service_rates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER service_addons_touch BEFORE UPDATE ON public.service_addons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER pricing_settings_touch BEFORE UPDATE ON public.pricing_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER site_content_touch BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER campaign_content_touch BEFORE UPDATE ON public.campaign_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER business_settings_touch BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED: current Durant pricing ============
INSERT INTO public.service_rates (key, label, base, per_bed, per_bath, recurring, sort_order) VALUES
  ('Standard Clean',  'Standard Clean',   129, 20, 15, true,  1),
  ('Bright Clean',    'Bright Clean',     179, 25, 20, true,  2),
  ('Deep Clean',      'Deep Clean',       249, 35, 30, false, 3),
  ('Airbnb Turnover', 'Airbnb Turnover',  119, 20, 15, true,  4),
  ('Move In / Out',   'Move In / Out',    279, 40, 30, false, 5),
  ('Pre-Event Prep',  'Pre-Event Prep',   149, 25, 20, false, 6),
  ('Post-Party',      'Post-Event Clean', 169, 25, 20, false, 7);

INSERT INTO public.pricing_settings (key, value) VALUES
  ('included_bedrooms', '2'::jsonb),
  ('included_bathrooms', '2'::jsonb),
  ('host_weekend_discount', '0.1'::jsonb),
  ('referral_credit', '25'::jsonb);

INSERT INTO public.business_settings (key, value, is_public) VALUES
  ('phone', '"(580) 745-0045"'::jsonb, true),
  ('email', '"hello@magnoliamaids.pro"'::jsonb, true),
  ('city', '"Durant, OK"'::jsonb, true),
  ('facebook', '"https://www.facebook.com/MagnoliaMaidsOK"'::jsonb, true),
  ('x', '"https://x.com/MagnoliaMaidsOK"'::jsonb, true),
  ('notify_email', '"hello@magnoliamaids.pro"'::jsonb, false);