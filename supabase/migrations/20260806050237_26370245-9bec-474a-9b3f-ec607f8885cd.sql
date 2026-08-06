CREATE TABLE public.campaign_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  home_size text,
  preferred_date date,
  referral_name text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.campaign_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.campaign_leads TO authenticated;
GRANT ALL ON public.campaign_leads TO service_role;

ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit campaign leads"
  ON public.campaign_leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) > 0
    AND length(btrim(campaign)) > 0
    AND length(btrim(email)) > 3
    AND email LIKE '%_@_%.__%'
    AND status = 'new'
  );

CREATE POLICY "Admins can view campaign leads"
  ON public.campaign_leads FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update campaign leads"
  ON public.campaign_leads FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campaign leads"
  ON public.campaign_leads FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX campaign_leads_campaign_created_idx ON public.campaign_leads (campaign, created_at DESC);