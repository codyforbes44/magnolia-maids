-- Explicit admin-only write policies for facebook_connections
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_connections TO authenticated;
GRANT ALL ON public.facebook_connections TO service_role;

DROP POLICY IF EXISTS "Admins can insert facebook connections" ON public.facebook_connections;
CREATE POLICY "Admins can insert facebook connections"
ON public.facebook_connections
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update facebook connections" ON public.facebook_connections;
CREATE POLICY "Admins can update facebook connections"
ON public.facebook_connections
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete facebook connections" ON public.facebook_connections;
CREATE POLICY "Admins can delete facebook connections"
ON public.facebook_connections
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));