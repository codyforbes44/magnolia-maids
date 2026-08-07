CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _user_id IS NULL OR _role IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role = _role
    )
  END
$function$;

REVOKE ALL ON FUNCTION private.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO service_role;