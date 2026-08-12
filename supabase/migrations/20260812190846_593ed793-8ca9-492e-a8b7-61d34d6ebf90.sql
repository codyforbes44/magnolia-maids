ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS contact_pref text NOT NULL DEFAULT 'email';
ALTER TABLE public.campaign_leads ADD COLUMN IF NOT EXISTS contact_pref text NOT NULL DEFAULT 'email';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS contact_pref text NOT NULL DEFAULT 'email';
ALTER TABLE public.property_inquiries ADD COLUMN IF NOT EXISTS contact_pref text NOT NULL DEFAULT 'email';
ALTER TABLE public.franchise_inquiries ADD COLUMN IF NOT EXISTS contact_pref text NOT NULL DEFAULT 'email';
ALTER TABLE public.messenger_threads ADD COLUMN IF NOT EXISTS contact_pref text NOT NULL DEFAULT 'messenger';

ALTER TABLE public.booking_requests ADD CONSTRAINT booking_requests_contact_pref_chk CHECK (contact_pref IN ('email','text','call'));
ALTER TABLE public.campaign_leads ADD CONSTRAINT campaign_leads_contact_pref_chk CHECK (contact_pref IN ('email','text','call'));
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_contact_pref_chk CHECK (contact_pref IN ('email','text','call'));
ALTER TABLE public.property_inquiries ADD CONSTRAINT property_inquiries_contact_pref_chk CHECK (contact_pref IN ('email','text','call'));
ALTER TABLE public.franchise_inquiries ADD CONSTRAINT franchise_inquiries_contact_pref_chk CHECK (contact_pref IN ('email','text','call'));
ALTER TABLE public.messenger_threads ADD CONSTRAINT messenger_threads_contact_pref_chk CHECK (contact_pref IN ('messenger','email','text','call'));