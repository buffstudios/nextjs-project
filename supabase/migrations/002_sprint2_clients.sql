-- Sprint 2: Client Profiles — clients, communication log, retention metrics view
-- Run in Supabase SQL Editor after 001_sprint1_foundation.sql

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE acquisition_source AS ENUM (
  'walk_in', 'google', 'instagram', 'referral',
  'gift_card', 'corporate', 'other'
);

CREATE TYPE communication_channel AS ENUM ('sms', 'email');
CREATE TYPE communication_direction AS ENUM ('outbound', 'inbound');
CREATE TYPE communication_trigger AS ENUM (
  'booking_confirmation', 'reminder_24h', 'reminder_2h',
  'rebooking_prompt', 'lapsed_winback', 'birthday', 'campaign', 'manual'
);

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  home_studio_id UUID REFERENCES studios(studio_id) ON DELETE SET NULL,
  preferred_staff_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
  acquisition_source acquisition_source NOT NULL DEFAULT 'walk_in',
  acquisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  acquisition_studio_id UUID REFERENCES studios(studio_id) ON DELETE SET NULL,
  new_client_discount_applied BOOLEAN NOT NULL DEFAULT false,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  vip_flag BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, mobile)
);

CREATE TABLE client_communication_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(studio_id) ON DELETE SET NULL,
  channel communication_channel NOT NULL,
  direction communication_direction NOT NULL,
  trigger_type communication_trigger NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened BOOLEAN,
  clicked BOOLEAN,
  converted_to_booking BOOLEAN NOT NULL DEFAULT false,
  appointment_id UUID,
  message_preview TEXT
);

-- =============================================================================
-- CLIENT METRICS VIEW
-- Visit/invoice metrics populate when appointments exist (Sprint 3+).
-- Retention status: active < 60d, at_risk 60-90d, lapsed 90d+ since last visit.
-- =============================================================================

CREATE OR REPLACE VIEW client_metrics
WITH (security_invoker = true)
AS
SELECT
  c.client_id,
  c.brand_id,
  0::bigint AS total_visits,
  NULL::date AS last_visit_date,
  NULL::integer AS days_since_last_visit,
  0::numeric AS average_invoice_value,
  0::numeric AS lifetime_value,
  'active'::text AS retention_status
FROM clients c;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read clients for their brand"
  ON clients FOR SELECT
  USING (user_has_brand_access(brand_id));

CREATE POLICY "Users can insert clients for their brand"
  ON clients FOR INSERT
  WITH CHECK (user_has_brand_access(brand_id));

CREATE POLICY "Users can update clients for their brand"
  ON clients FOR UPDATE
  USING (user_has_brand_access(brand_id));

CREATE POLICY "Super admins can delete clients"
  ON clients FOR DELETE
  USING (user_has_brand_access(brand_id) AND is_super_admin());

CREATE POLICY "Users can read communication log for their brand"
  ON client_communication_log FOR SELECT
  USING (user_has_brand_access(brand_id));

CREATE POLICY "Users can insert communication log for their brand"
  ON client_communication_log FOR INSERT
  WITH CHECK (user_has_brand_access(brand_id));
