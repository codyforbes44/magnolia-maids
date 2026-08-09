CREATE TABLE public.community_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('ok','degraded','failed')),
  weather_ok boolean NOT NULL DEFAULT false,
  forecast_days integer NOT NULL DEFAULT 0,
  observation_age_minutes integer,
  page_ok boolean NOT NULL DEFAULT false,
  attractions_rendered integer NOT NULL DEFAULT 0,
  season_tips_rendered integer NOT NULL DEFAULT 0,
  broken_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.community_health_checks TO authenticated;
GRANT ALL ON public.community_health_checks TO service_role;

ALTER TABLE public.community_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view community health checks"
ON public.community_health_checks
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX community_health_checks_created_at_idx
  ON public.community_health_checks (created_at DESC);