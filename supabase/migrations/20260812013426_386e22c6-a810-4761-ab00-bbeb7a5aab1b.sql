DROP POLICY "Anyone can submit booking requests" ON public.booking_requests;
CREATE POLICY "Anyone can submit booking requests"
ON public.booking_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(name)) > 0 AND length(btrim(email)) > 3 AND email LIKE '%_@_%.__%'
  AND length(btrim(address)) > 0 AND length(btrim(service)) > 0
  AND length(btrim(frequency)) > 0 AND status = 'new'
  AND (customer_id IS NULL OR customer_id = auth.uid())
);

DROP POLICY "Anyone can submit campaign leads" ON public.campaign_leads;
CREATE POLICY "Anyone can submit campaign leads"
ON public.campaign_leads FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(name)) > 0 AND length(btrim(campaign)) > 0
  AND length(btrim(email)) > 3 AND email LIKE '%_@_%.__%'
  AND status = 'new'
  AND (customer_id IS NULL OR customer_id = auth.uid())
);