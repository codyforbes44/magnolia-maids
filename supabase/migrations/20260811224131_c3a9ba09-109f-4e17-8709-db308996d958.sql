ALTER TABLE public.booking_requests ADD COLUMN sms_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaign_leads ADD COLUMN sms_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_applications ADD COLUMN sms_consent boolean NOT NULL DEFAULT false;

CREATE TABLE public.sms_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  consent boolean NOT NULL DEFAULT true,
  source text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_sms_consents_phone ON public.sms_consents(phone);

GRANT SELECT, INSERT, UPDATE ON public.sms_consents TO authenticated;
GRANT ALL ON public.sms_consents TO service_role;

ALTER TABLE public.sms_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sms consent via profile phone"
ON public.sms_consents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customer_profiles
    WHERE id = auth.uid() AND phone = public.sms_consents.phone
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customer_profiles
    WHERE id = auth.uid() AND phone = public.sms_consents.phone
  )
);

CREATE TRIGGER sms_consents_touch
BEFORE UPDATE ON public.sms_consents
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();