CREATE TABLE public.maps_lookup_usage (
  visitor_key text NOT NULL,
  day date NOT NULL DEFAULT current_date,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (visitor_key, day)
);
ALTER TABLE public.maps_lookup_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.maps_lookup_usage FROM anon, authenticated;
GRANT ALL ON public.maps_lookup_usage TO service_role;

CREATE OR REPLACE FUNCTION public.bump_maps_lookup(_key text, _limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.maps_lookup_usage WHERE day < current_date - 2;
  INSERT INTO public.maps_lookup_usage AS u (visitor_key, day, count)
  VALUES (_key, current_date, 1)
  ON CONFLICT (visitor_key, day) DO UPDATE SET count = u.count + 1
  RETURNING count INTO n;
  RETURN n <= _limit;
END $$;
REVOKE EXECUTE ON FUNCTION public.bump_maps_lookup(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_maps_lookup(text, integer) TO service_role;