CREATE TABLE public.content_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  trigger text NOT NULL DEFAULT 'cron',
  kb_document_id text,
  kb_bytes integer NOT NULL DEFAULT 0,
  agents_updated integer NOT NULL DEFAULT 0,
  agents_total integer NOT NULL DEFAULT 0,
  pages_checked integer NOT NULL DEFAULT 0,
  page_failures jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.content_sync_runs TO authenticated;
GRANT ALL ON public.content_sync_runs TO service_role;

ALTER TABLE public.content_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view content sync runs"
ON public.content_sync_runs
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));