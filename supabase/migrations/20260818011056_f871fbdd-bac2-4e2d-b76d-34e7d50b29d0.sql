-- 1. Lock down public.has_role (private.has_role is what policies use)
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- 2. business_settings: allow-list of publicly readable keys + safe default
ALTER TABLE public.business_settings ALTER COLUMN is_public SET DEFAULT false;
UPDATE public.business_settings SET is_public = false
WHERE is_public = true AND key NOT IN ('city','email','phone','facebook','x','instagram','maggie_avatar_url','maggie_portrait_url','hours','address','service_area','grand_opening');
ALTER TABLE public.business_settings DROP CONSTRAINT IF EXISTS business_settings_public_key_allowlist;
ALTER TABLE public.business_settings ADD CONSTRAINT business_settings_public_key_allowlist
CHECK (is_public = false OR key IN ('city','email','phone','facebook','x','instagram','maggie_avatar_url','maggie_portrait_url','hours','address','service_area','grand_opening'));

-- 3/4. Hard admin-only guard on realtime-published call tables (restrictive = cannot be widened by future permissive policies)
DROP POLICY IF EXISTS "Only admins may access outbound calls" ON public.outbound_calls;
CREATE POLICY "Only admins may access outbound calls" ON public.outbound_calls
AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins may access call status events" ON public.call_status_events;
CREATE POLICY "Only admins may access call status events" ON public.call_status_events
AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.outbound_calls FROM anon;
REVOKE ALL ON public.call_status_events FROM anon;