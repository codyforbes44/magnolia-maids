DROP POLICY IF EXISTS "Users can manage their own sms consent via profile phone" ON public.sms_consents;

REVOKE ALL ON public.sms_consents FROM anon, authenticated;
GRANT SELECT ON public.sms_consents TO authenticated;
GRANT ALL ON public.sms_consents TO service_role;

CREATE POLICY "Admins can view sms consents"
ON public.sms_consents
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));