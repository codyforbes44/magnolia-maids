-- Customer profiles -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  phone_digits text GENERATED ALWAYS AS (NULLIF(regexp_replace(COALESCE(phone,''), '\D', '', 'g'), '')) STORED,
  contact_pref text NOT NULL DEFAULT 'email',
  marketing_opt_in boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.customer_profiles TO authenticated;
GRANT ALL ON public.customer_profiles TO service_role;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage own profile" ON public.customer_profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read customer profiles" ON public.customer_profiles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER customer_profiles_touch BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Home profile -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_homes (
  customer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_method text NOT NULL DEFAULT 'someone_home',
  entry_code text,
  lockbox_location text,
  alarm_instructions text,
  parking_notes text,
  address text,
  bedrooms text,
  bathrooms text,
  square_feet integer,
  skip_rooms text,
  focus_rooms text,
  product_preferences text,
  scent_preference text,
  supplies_notes text,
  preferred_frequency text,
  preferred_day text,
  preferred_window text,
  standing_addons text[] NOT NULL DEFAULT '{}',
  billing_email text,
  billing_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.customer_homes TO authenticated;
GRANT ALL ON public.customer_homes TO service_role;
ALTER TABLE public.customer_homes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage own home" ON public.customer_homes
  FOR ALL TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins read customer homes" ON public.customer_homes
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER customer_homes_touch BEFORE UPDATE ON public.customer_homes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Pets ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'dog',
  temperament text,
  location_during_clean text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_pets_customer_idx ON public.customer_pets (customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_pets TO authenticated;
GRANT ALL ON public.customer_pets TO service_role;
ALTER TABLE public.customer_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage own pets" ON public.customer_pets
  FOR ALL TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins read customer pets" ON public.customer_pets
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER customer_pets_touch BEFORE UPDATE ON public.customer_pets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Link existing records to accounts ---------------------------------------
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.campaign_leads ADD COLUMN IF NOT EXISTS customer_id uuid;
CREATE INDEX IF NOT EXISTS booking_requests_customer_idx ON public.booking_requests (customer_id);
CREATE INDEX IF NOT EXISTS campaign_leads_customer_idx ON public.campaign_leads (customer_id);

CREATE POLICY "Customers view own bookings" ON public.booking_requests
  FOR SELECT TO authenticated USING (customer_id = auth.uid());

-- Change requests ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.booking_requests(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'reschedule',
  preferred_day date,
  alternate_day date,
  preferred_time text,
  reason text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_change_requests_booking_idx ON public.service_change_requests (booking_id);
CREATE INDEX IF NOT EXISTS service_change_requests_status_idx ON public.service_change_requests (status, created_at DESC);
GRANT SELECT, INSERT ON public.service_change_requests TO authenticated;
GRANT UPDATE, DELETE ON public.service_change_requests TO authenticated;
GRANT ALL ON public.service_change_requests TO service_role;
ALTER TABLE public.service_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own change requests" ON public.service_change_requests
  FOR SELECT TO authenticated USING (customer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Customers create own change requests" ON public.service_change_requests
  FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins update change requests" ON public.service_change_requests
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete change requests" ON public.service_change_requests
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER service_change_requests_touch BEFORE UPDATE ON public.service_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create a profile on signup -----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();