export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_requests: {
        Row: {
          address: string
          address_city: string | null
          address_country: string | null
          address_lat: number | null
          address_lng: number | null
          address_place_id: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          address_unit: string | null
          bathrooms: string
          bedrooms: string
          contact_pref: string
          created_at: string
          customer_id: string | null
          email: string
          frequency: string
          id: string
          landing_path: string | null
          name: string
          notes: string | null
          phone: string | null
          phone_digits: string | null
          preferred_day: string | null
          preferred_time: string | null
          referrer: string | null
          reminder_sent_at: string | null
          service: string
          sms_consent: boolean
          status: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          address: string
          address_city?: string | null
          address_country?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_place_id?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_unit?: string | null
          bathrooms: string
          bedrooms: string
          contact_pref?: string
          created_at?: string
          customer_id?: string | null
          email: string
          frequency: string
          id?: string
          landing_path?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          phone_digits?: string | null
          preferred_day?: string | null
          preferred_time?: string | null
          referrer?: string | null
          reminder_sent_at?: string | null
          service: string
          sms_consent?: boolean
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          address?: string
          address_city?: string | null
          address_country?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_place_id?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_unit?: string | null
          bathrooms?: string
          bedrooms?: string
          contact_pref?: string
          created_at?: string
          customer_id?: string | null
          email?: string
          frequency?: string
          id?: string
          landing_path?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          phone_digits?: string | null
          preferred_day?: string | null
          preferred_time?: string | null
          referrer?: string | null
          reminder_sent_at?: string | null
          service?: string
          sms_consent?: boolean
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      call_opt_outs: {
        Row: {
          created_at: string
          phone_e164: string
          reason: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          phone_e164: string
          reason?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          phone_e164?: string
          reason?: string | null
          source?: string | null
        }
        Relationships: []
      }
      call_status_events: {
        Row: {
          call_id: string
          created_at: string
          detail: string | null
          id: string
          source: string
          status: string
        }
        Insert: {
          call_id: string
          created_at?: string
          detail?: string | null
          id?: string
          source?: string
          status: string
        }
        Update: {
          call_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_status_events_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "outbound_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_content: {
        Row: {
          active: boolean
          campaign: string
          updated_at: string
          value: Json
        }
        Insert: {
          active?: boolean
          campaign: string
          updated_at?: string
          value: Json
        }
        Update: {
          active?: boolean
          campaign?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      campaign_leads: {
        Row: {
          campaign: string
          contact_pref: string
          created_at: string
          customer_id: string | null
          email: string
          followup_sent_at: string | null
          home_size: string | null
          id: string
          landing_path: string | null
          message: string | null
          name: string
          phone: string | null
          phone_digits: string | null
          preferred_date: string | null
          referral_name: string | null
          referrer: string | null
          reminder_sent_at: string | null
          sms_consent: boolean
          source: string
          status: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign: string
          contact_pref?: string
          created_at?: string
          customer_id?: string | null
          email: string
          followup_sent_at?: string | null
          home_size?: string | null
          id?: string
          landing_path?: string | null
          message?: string | null
          name: string
          phone?: string | null
          phone_digits?: string | null
          preferred_date?: string | null
          referral_name?: string | null
          referrer?: string | null
          reminder_sent_at?: string | null
          sms_consent?: boolean
          source?: string
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign?: string
          contact_pref?: string
          created_at?: string
          customer_id?: string | null
          email?: string
          followup_sent_at?: string | null
          home_size?: string | null
          id?: string
          landing_path?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          phone_digits?: string | null
          preferred_date?: string | null
          referral_name?: string | null
          referrer?: string | null
          reminder_sent_at?: string | null
          sms_consent?: boolean
          source?: string
          status?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      community_health_checks: {
        Row: {
          attractions_rendered: number
          broken_links: Json
          created_at: string
          duration_ms: number | null
          forecast_days: number
          id: string
          notes: string | null
          observation_age_minutes: number | null
          page_ok: boolean
          season_tips_rendered: number
          status: string
          weather_ok: boolean
        }
        Insert: {
          attractions_rendered?: number
          broken_links?: Json
          created_at?: string
          duration_ms?: number | null
          forecast_days?: number
          id?: string
          notes?: string | null
          observation_age_minutes?: number | null
          page_ok?: boolean
          season_tips_rendered?: number
          status: string
          weather_ok?: boolean
        }
        Update: {
          attractions_rendered?: number
          broken_links?: Json
          created_at?: string
          duration_ms?: number | null
          forecast_days?: number
          id?: string
          notes?: string | null
          observation_age_minutes?: number | null
          page_ok?: boolean
          season_tips_rendered?: number
          status?: string
          weather_ok?: boolean
        }
        Relationships: []
      }
      contact_activity: {
        Row: {
          created_at: string
          email: string | null
          event: string
          id: string
          payload: Json
          phone: string | null
          record_id: string
          record_table: string
          source: string | null
          summary: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event?: string
          id?: string
          payload?: Json
          phone?: string | null
          record_id: string
          record_table: string
          source?: string | null
          summary?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event?: string
          id?: string
          payload?: Json
          phone?: string | null
          record_id?: string
          record_table?: string
          source?: string | null
          summary?: string
        }
        Relationships: []
      }
      content_sync_runs: {
        Row: {
          agents_total: number
          agents_updated: number
          created_at: string
          duration_ms: number | null
          id: string
          kb_bytes: number
          kb_document_id: string | null
          notes: string | null
          page_failures: Json
          pages_checked: number
          status: string
          trigger: string
        }
        Insert: {
          agents_total?: number
          agents_updated?: number
          created_at?: string
          duration_ms?: number | null
          id?: string
          kb_bytes?: number
          kb_document_id?: string | null
          notes?: string | null
          page_failures?: Json
          pages_checked?: number
          status: string
          trigger?: string
        }
        Update: {
          agents_total?: number
          agents_updated?: number
          created_at?: string
          duration_ms?: number | null
          id?: string
          kb_bytes?: number
          kb_document_id?: string | null
          notes?: string | null
          page_failures?: Json
          pages_checked?: number
          status?: string
          trigger?: string
        }
        Relationships: []
      }
      custom_email_templates: {
        Row: {
          audience: string
          base_template_id: string
          body_html: string | null
          category: string
          created_at: string
          created_by: string | null
          cta_label: string | null
          description: string
          footer_note: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          intro_html: string | null
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience?: string
          base_template_id: string
          body_html?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          description?: string
          footer_note?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          intro_html?: string | null
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string
          base_template_id?: string
          body_html?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          description?: string
          footer_note?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          intro_html?: string | null
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_homes: {
        Row: {
          address: string | null
          alarm_instructions: string | null
          bathrooms: string | null
          bedrooms: string | null
          billing_email: string | null
          billing_phone: string | null
          created_at: string
          customer_id: string
          entry_code: string | null
          entry_method: string
          focus_rooms: string | null
          lockbox_location: string | null
          parking_notes: string | null
          preferred_day: string | null
          preferred_frequency: string | null
          preferred_window: string | null
          product_preferences: string | null
          scent_preference: string | null
          skip_rooms: string | null
          square_feet: number | null
          standing_addons: string[]
          supplies_notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alarm_instructions?: string | null
          bathrooms?: string | null
          bedrooms?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          created_at?: string
          customer_id: string
          entry_code?: string | null
          entry_method?: string
          focus_rooms?: string | null
          lockbox_location?: string | null
          parking_notes?: string | null
          preferred_day?: string | null
          preferred_frequency?: string | null
          preferred_window?: string | null
          product_preferences?: string | null
          scent_preference?: string | null
          skip_rooms?: string | null
          square_feet?: number | null
          standing_addons?: string[]
          supplies_notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alarm_instructions?: string | null
          bathrooms?: string | null
          bedrooms?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          created_at?: string
          customer_id?: string
          entry_code?: string | null
          entry_method?: string
          focus_rooms?: string | null
          lockbox_location?: string | null
          parking_notes?: string | null
          preferred_day?: string | null
          preferred_frequency?: string | null
          preferred_window?: string | null
          product_preferences?: string | null
          scent_preference?: string | null
          skip_rooms?: string | null
          square_feet?: number | null
          standing_addons?: string[]
          supplies_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_pets: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          kind: string
          location_during_clean: string | null
          name: string
          notes: string | null
          temperament: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          kind?: string
          location_during_clean?: string | null
          name: string
          notes?: string | null
          temperament?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          kind?: string
          location_during_clean?: string | null
          name?: string
          notes?: string | null
          temperament?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          claimed_at: string | null
          contact_pref: string
          created_at: string
          full_name: string
          id: string
          marketing_opt_in: boolean
          phone: string | null
          phone_digits: string | null
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          contact_pref?: string
          created_at?: string
          full_name?: string
          id: string
          marketing_opt_in?: boolean
          phone?: string | null
          phone_digits?: string | null
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          contact_pref?: string
          created_at?: string
          full_name?: string
          id?: string
          marketing_opt_in?: boolean
          phone?: string | null
          phone_digits?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          body_html: string | null
          created_at: string
          error: string | null
          from_address: string | null
          id: string
          kind: string
          provider_id: string | null
          recipient: string
          related_id: string | null
          reply_to: string | null
          status: string
          subject: string
        }
        Insert: {
          body_html?: string | null
          created_at?: string
          error?: string | null
          from_address?: string | null
          id?: string
          kind?: string
          provider_id?: string | null
          recipient: string
          related_id?: string | null
          reply_to?: string | null
          status?: string
          subject: string
        }
        Update: {
          body_html?: string | null
          created_at?: string
          error?: string | null
          from_address?: string | null
          id?: string
          kind?: string
          provider_id?: string | null
          recipient?: string
          related_id?: string | null
          reply_to?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      email_template_overrides: {
        Row: {
          body_html: string | null
          cta_label: string | null
          enabled: boolean
          footer_note: string | null
          hero_subtitle: string | null
          hero_title: string | null
          intro_html: string | null
          subject: string | null
          template_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_html?: string | null
          cta_label?: string | null
          enabled?: boolean
          footer_note?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          intro_html?: string | null
          subject?: string | null
          template_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_html?: string | null
          cta_label?: string | null
          enabled?: boolean
          footer_note?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          intro_html?: string | null
          subject?: string | null
          template_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      facebook_connections: {
        Row: {
          category: string | null
          connected_by: string
          created_at: string
          id: string
          page_access_token: string
          page_id: string
          page_name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          connected_by: string
          created_at?: string
          id?: string
          page_access_token: string
          page_id: string
          page_name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          connected_by?: string
          created_at?: string
          id?: string
          page_access_token?: string
          page_id?: string
          page_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      franchise_inquiries: {
        Row: {
          admin_notes: string | null
          background: string | null
          capital_band: string | null
          contact_pref: string
          created_at: string
          email: string
          id: string
          landing_path: string | null
          name: string
          notes: string | null
          phone: string | null
          phone_digits: string | null
          referrer: string | null
          source: string
          status: string
          target_city: string | null
          target_state: string | null
          timeline: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          why: string | null
        }
        Insert: {
          admin_notes?: string | null
          background?: string | null
          capital_band?: string | null
          contact_pref?: string
          created_at?: string
          email: string
          id?: string
          landing_path?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          phone_digits?: string | null
          referrer?: string | null
          source?: string
          status?: string
          target_city?: string | null
          target_state?: string | null
          timeline?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          why?: string | null
        }
        Update: {
          admin_notes?: string | null
          background?: string | null
          capital_band?: string | null
          contact_pref?: string
          created_at?: string
          email?: string
          id?: string
          landing_path?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          phone_digits?: string | null
          referrer?: string | null
          source?: string
          status?: string
          target_city?: string | null
          target_state?: string | null
          timeline?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          why?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          admin_notes: string | null
          area: string
          availability: string
          contact_pref: string
          created_at: string
          email: string
          employment_type: string | null
          experience: string | null
          followup_sent_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          phone_digits: string | null
          role: string
          sms_consent: boolean
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          area: string
          availability: string
          contact_pref?: string
          created_at?: string
          email: string
          employment_type?: string | null
          experience?: string | null
          followup_sent_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          phone_digits?: string | null
          role: string
          sms_consent?: boolean
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          area?: string
          availability?: string
          contact_pref?: string
          created_at?: string
          email?: string
          employment_type?: string | null
          experience?: string | null
          followup_sent_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          phone_digits?: string | null
          role?: string
          sms_consent?: boolean
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messenger_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          mid: string | null
          page_id: string
          sender: string
          thread_id: string
        }
        Insert: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          mid?: string | null
          page_id: string
          sender: string
          thread_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          mid?: string | null
          page_id?: string
          sender?: string
          thread_id?: string
        }
        Relationships: []
      }
      messenger_threads: {
        Row: {
          ai_reply_streak: number
          auto_reply: boolean
          contact_pref: string
          created_at: string
          handoff_reason: string | null
          last_ai_reply_at: string | null
          last_inbound_at: string | null
          last_outbound_at: string | null
          needs_attention: boolean
          page_id: string
          person_id: string | null
          person_name: string
          snippet: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          ai_reply_streak?: number
          auto_reply?: boolean
          contact_pref?: string
          created_at?: string
          handoff_reason?: string | null
          last_ai_reply_at?: string | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          needs_attention?: boolean
          page_id: string
          person_id?: string | null
          person_name?: string
          snippet?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          ai_reply_streak?: number
          auto_reply?: boolean
          contact_pref?: string
          created_at?: string
          handoff_reason?: string | null
          last_ai_reply_at?: string | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          needs_attention?: boolean
          page_id?: string
          person_id?: string | null
          person_name?: string
          snippet?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      outbound_calls: {
        Row: {
          agent_id: string
          assigned_to: string | null
          attempts: number
          call_sid: string | null
          connected_at: string | null
          contact_name: string
          context_note: string | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          created_by_label: string
          dialing_at: string | null
          duration_secs: number | null
          email: string | null
          ended_at: string | null
          error: string | null
          failed_at: string | null
          id: string
          last_attempt_at: string | null
          outcome: string | null
          outcome_notes: string | null
          phone: string
          phone_e164: string
          purpose: string
          queued_at: string
          scheduled_at: string | null
          source_id: string | null
          source_table: string | null
          status: string
          transcript_summary: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          assigned_to?: string | null
          attempts?: number
          call_sid?: string | null
          connected_at?: string | null
          contact_name: string
          context_note?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_label?: string
          dialing_at?: string | null
          duration_secs?: number | null
          email?: string | null
          ended_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          last_attempt_at?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          phone: string
          phone_e164: string
          purpose?: string
          queued_at?: string
          scheduled_at?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string
          transcript_summary?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          assigned_to?: string | null
          attempts?: number
          call_sid?: string | null
          connected_at?: string | null
          contact_name?: string
          context_note?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_label?: string
          dialing_at?: string | null
          duration_secs?: number | null
          email?: string | null
          ended_at?: string | null
          error?: string | null
          failed_at?: string | null
          id?: string
          last_attempt_at?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          phone?: string
          phone_e164?: string
          purpose?: string
          queued_at?: string
          scheduled_at?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string
          transcript_summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      property_inquiries: {
        Row: {
          access_method: string | null
          admin_notes: string | null
          company: string | null
          contact_name: string
          contact_pref: string
          contact_role: string | null
          created_at: string
          email: string
          id: string
          landing_path: string | null
          needs_carpet_care: boolean
          needs_trash_out: boolean
          notes: string | null
          phone: string | null
          phone_digits: string | null
          property_address: string | null
          property_name: string
          referrer: string | null
          start_date: string | null
          status: string
          total_units: number | null
          turnaround: string | null
          turns_per_month: string | null
          units_1bd: number
          units_2bd: number
          units_3bd_plus: number
          units_studio: number
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          access_method?: string | null
          admin_notes?: string | null
          company?: string | null
          contact_name: string
          contact_pref?: string
          contact_role?: string | null
          created_at?: string
          email: string
          id?: string
          landing_path?: string | null
          needs_carpet_care?: boolean
          needs_trash_out?: boolean
          notes?: string | null
          phone?: string | null
          phone_digits?: string | null
          property_address?: string | null
          property_name: string
          referrer?: string | null
          start_date?: string | null
          status?: string
          total_units?: number | null
          turnaround?: string | null
          turns_per_month?: string | null
          units_1bd?: number
          units_2bd?: number
          units_3bd_plus?: number
          units_studio?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          access_method?: string | null
          admin_notes?: string | null
          company?: string | null
          contact_name?: string
          contact_pref?: string
          contact_role?: string | null
          created_at?: string
          email?: string
          id?: string
          landing_path?: string | null
          needs_carpet_care?: boolean
          needs_trash_out?: boolean
          notes?: string | null
          phone?: string | null
          phone_digits?: string | null
          property_address?: string | null
          property_name?: string
          referrer?: string | null
          start_date?: string | null
          status?: string
          total_units?: number | null
          turnaround?: string | null
          turns_per_month?: string | null
          units_1bd?: number
          units_2bd?: number
          units_3bd_plus?: number
          units_studio?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      reminder_dispatches: {
        Row: {
          channel: string
          id: string
          offset_key: string
          record_id: string
          record_table: string
          sent_at: string
        }
        Insert: {
          channel?: string
          id?: string
          offset_key: string
          record_id: string
          record_table: string
          sent_at?: string
        }
        Update: {
          channel?: string
          id?: string
          offset_key?: string
          record_id?: string
          record_table?: string
          sent_at?: string
        }
        Relationships: []
      }
      service_addons: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_change_requests: {
        Row: {
          admin_response: string | null
          alternate_day: string | null
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          kind: string
          note: string | null
          preferred_day: string | null
          preferred_time: string | null
          reason: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          alternate_day?: string | null
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          kind?: string
          note?: string | null
          preferred_day?: string | null
          preferred_time?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          alternate_day?: string | null
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          kind?: string
          note?: string | null
          preferred_day?: string | null
          preferred_time?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_change_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_rates: {
        Row: {
          active: boolean
          base: number
          created_at: string
          id: string
          key: string
          label: string
          per_bath: number
          per_bed: number
          recurring: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base: number
          created_at?: string
          id?: string
          key: string
          label: string
          per_bath?: number
          per_bed?: number
          recurring?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base?: number
          created_at?: string
          id?: string
          key?: string
          label?: string
          per_bath?: number
          per_bed?: number
          recurring?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          id: string
          key: string
          scope: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          scope: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          scope?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      slack_events: {
        Row: {
          channel_id: string | null
          created_at: string
          error: string | null
          event_id: string
          event_type: string | null
          handled: boolean
          id: string
          team_id: string | null
          text: string | null
          thread_ts: string | null
          ts: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          error?: string | null
          event_id: string
          event_type?: string | null
          handled?: boolean
          id?: string
          team_id?: string | null
          text?: string | null
          thread_ts?: string | null
          ts?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string | null
          handled?: boolean
          id?: string
          team_id?: string | null
          text?: string | null
          thread_ts?: string | null
          ts?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      slack_messages: {
        Row: {
          channel_id: string
          created_at: string
          error: string | null
          id: string
          kind: string
          payload: Json | null
          status: string
          text: string | null
          thread_ts: string | null
          ts: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          payload?: Json | null
          status?: string
          text?: string | null
          thread_ts?: string | null
          ts?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          payload?: Json | null
          status?: string
          text?: string | null
          thread_ts?: string | null
          ts?: string | null
        }
        Relationships: []
      }
      sms_consents: {
        Row: {
          consent: boolean
          id: string
          phone: string
          source: string | null
          updated_at: string
        }
        Insert: {
          consent?: boolean
          id?: string
          phone: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          consent?: boolean
          id?: string
          phone?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_template_overrides: {
        Row: {
          body: string
          enabled: boolean
          template_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          enabled?: boolean
          template_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          enabled?: boolean
          template_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sms_template_variables: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      sms_template_versions: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          template_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          template_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          template_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "staff"],
    },
  },
} as const
