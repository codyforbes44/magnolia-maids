
CREATE TABLE public.facebook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  page_name text NOT NULL,
  page_access_token text NOT NULL,
  category text,
  connected_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.facebook_connections TO authenticated;
GRANT ALL ON public.facebook_connections TO service_role;

ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view facebook connections metadata"
  ON public.facebook_connections
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
