-- Create a private schema not exposed by the Data API
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Drop policies referencing public.has_role so we can replace the function
DROP POLICY IF EXISTS "Admins can delete booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can update booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can view all booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Admins can view facebook connections metadata" ON public.facebook_connections;
DROP POLICY IF EXISTS "Anyone can submit booking requests" ON public.booking_requests;

-- Remove the publicly-executable SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Recreate it in the private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate admin policies using the private helper
CREATE POLICY "Admins can view all booking requests"
ON public.booking_requests
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update booking requests"
ON public.booking_requests
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete booking requests"
ON public.booking_requests
FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view facebook connections metadata"
ON public.facebook_connections
FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Replace the always-true INSERT policy with a validating check
CREATE POLICY "Anyone can submit booking requests"
ON public.booking_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(name)) > 0
  AND length(btrim(email)) > 3
  AND email LIKE '%_@_%.__%'
  AND length(btrim(address)) > 0
  AND length(btrim(service)) > 0
  AND length(btrim(frequency)) > 0
  AND status = 'new'
);