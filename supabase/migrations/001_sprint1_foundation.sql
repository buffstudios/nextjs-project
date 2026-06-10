-- Sprint 1: Foundation — Multi-brand schema, auth, brand config, studios, staff
-- Run this in the Supabase SQL Editor (Sydney region: ap-southeast-2)

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE kpi_unit AS ENUM ('currency', 'percentage', 'integer', 'ratio');
CREATE TYPE kpi_direction AS ENUM ('above', 'below');
CREATE TYPE studio_type AS ENUM ('corporate', 'jv', 'franchise', 'license');
CREATE TYPE staff_role AS ENUM (
  'nail_technician', 'senior_technician', 'studio_manager',
  'operations', 'admin'
);
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'casual');
CREATE TYPE user_role_type AS ENUM (
  'super_admin', 'ops_manager', 'studio_manager',
  'technician', 'jv_partner', 'finance_viewer'
);

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE brands (
  brand_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  primary_colour TEXT NOT NULL DEFAULT '#1A1A2E',
  accent_colour TEXT NOT NULL DEFAULT '#C9A96E',
  surface_colour TEXT NOT NULL DEFAULT '#F5F0E8',
  logo_url TEXT,
  booking_url TEXT,
  currency_code TEXT NOT NULL DEFAULT 'AUD',
  tax_rate_pct DECIMAL NOT NULL DEFAULT 10,
  tax_label TEXT NOT NULL DEFAULT 'GST',
  default_timezone TEXT NOT NULL DEFAULT 'Australia/Melbourne',
  leave_accrual_rate DECIMAL NOT NULL DEFAULT 0.04,
  payroll_tax_rate DECIMAL NOT NULL DEFAULT 0.055,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kpi_config (
  kpi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  kpi_key TEXT NOT NULL,
  kpi_label TEXT NOT NULL,
  kpi_description TEXT,
  unit kpi_unit NOT NULL,
  green_threshold DECIMAL NOT NULL,
  green_direction kpi_direction NOT NULL,
  amber_threshold DECIMAL NOT NULL,
  red_threshold DECIMAL NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  UNIQUE (brand_id, kpi_key)
);

CREATE TABLE studios (
  studio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  studio_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  suburb TEXT NOT NULL,
  address TEXT,
  studio_type studio_type NOT NULL DEFAULT 'corporate',
  brand_ownership_pct DECIMAL NOT NULL DEFAULT 100,
  partner_name TEXT,
  monthly_rent DECIMAL,
  open_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  legacy_system_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, slug)
);

CREATE TABLE staff (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(studio_id) ON DELETE RESTRICT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role staff_role NOT NULL,
  employment_type employment_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  base_hourly_rate DECIMAL NOT NULL DEFAULT 0,
  is_bookable BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  external_roster_id TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
  role user_role_type NOT NULL,
  studio_id UUID REFERENCES studios(studio_id) ON DELETE SET NULL,
  UNIQUE (user_id, brand_id)
);

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_brand_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT brand_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION can_manage_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'ops_manager', 'studio_manager')
  );
$$;

CREATE OR REPLACE FUNCTION user_has_brand_access(target_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND brand_id = target_brand_id
  );
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- brands — public read for login theming; authenticated read for app
CREATE POLICY "Public can read active brands"
  ON brands FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can read their brand"
  ON brands FOR SELECT
  USING (user_has_brand_access(brand_id));

CREATE POLICY "Super admins can update their brand"
  ON brands FOR UPDATE
  USING (user_has_brand_access(brand_id) AND is_super_admin());

-- kpi_config
CREATE POLICY "Users can read kpi_config for their brand"
  ON kpi_config FOR SELECT
  USING (user_has_brand_access(brand_id));

CREATE POLICY "Super admins can insert kpi_config"
  ON kpi_config FOR INSERT
  WITH CHECK (user_has_brand_access(brand_id) AND is_super_admin());

CREATE POLICY "Super admins can update kpi_config"
  ON kpi_config FOR UPDATE
  USING (user_has_brand_access(brand_id) AND is_super_admin());

CREATE POLICY "Super admins can delete kpi_config"
  ON kpi_config FOR DELETE
  USING (user_has_brand_access(brand_id) AND is_super_admin());

-- studios
CREATE POLICY "Users can read studios for their brand"
  ON studios FOR SELECT
  USING (user_has_brand_access(brand_id));

CREATE POLICY "Super admins can insert studios"
  ON studios FOR INSERT
  WITH CHECK (user_has_brand_access(brand_id) AND is_super_admin());

CREATE POLICY "Super admins can update studios"
  ON studios FOR UPDATE
  USING (user_has_brand_access(brand_id) AND is_super_admin());

CREATE POLICY "Super admins can delete studios"
  ON studios FOR DELETE
  USING (user_has_brand_access(brand_id) AND is_super_admin());

-- staff
CREATE POLICY "Users can read staff for their brand"
  ON staff FOR SELECT
  USING (user_has_brand_access(brand_id));

CREATE POLICY "Managers can insert staff"
  ON staff FOR INSERT
  WITH CHECK (user_has_brand_access(brand_id) AND can_manage_staff());

CREATE POLICY "Managers can update staff"
  ON staff FOR UPDATE
  USING (user_has_brand_access(brand_id) AND can_manage_staff());

CREATE POLICY "Super admins can delete staff"
  ON staff FOR DELETE
  USING (user_has_brand_access(brand_id) AND is_super_admin());

-- user_roles
CREATE POLICY "Users can read their own role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid() OR (user_has_brand_access(brand_id) AND is_super_admin()));

CREATE POLICY "Super admins can manage user roles"
  ON user_roles FOR ALL
  USING (user_has_brand_access(brand_id) AND is_super_admin());

-- =============================================================================
-- SEED DATA — Buff Nail Studios
-- =============================================================================

INSERT INTO brands (
  brand_name, slug, primary_colour, accent_colour, surface_colour,
  currency_code, tax_rate_pct, tax_label, default_timezone
) VALUES (
  'Buff Nail Studios', 'buff', '#1A1A2E', '#C9A96E', '#F5F0E8',
  'AUD', 10, 'GST', 'Australia/Melbourne'
);

DO $$
DECLARE
  buff_brand_id UUID;
BEGIN
  SELECT brand_id INTO buff_brand_id FROM brands WHERE slug = 'buff';

  INSERT INTO kpi_config (brand_id, kpi_key, kpi_label, unit, green_threshold, green_direction, amber_threshold, red_threshold, display_order) VALUES
    (buff_brand_id, 'avg_invoice', 'Average Invoice', 'currency', 115, 'above', 105, 104.99, 1),
    (buff_brand_id, 'wages_ratio', 'Wages Ratio', 'percentage', 55, 'below', 65, 65.01, 2),
    (buff_brand_id, 'rebooking_rate', 'Rebooking Rate', 'percentage', 40, 'above', 30, 29.99, 3),
    (buff_brand_id, 'utilisation', 'Utilisation', 'percentage', 75, 'above', 65, 64.99, 4),
    (buff_brand_id, 'new_client_pct', 'New Client %', 'percentage', 17, 'above', 12, 11.99, 5),
    (buff_brand_id, 'sell_through', 'Sell-through Rate', 'percentage', 4, 'above', 2, 1.99, 6);

  INSERT INTO studios (brand_id, studio_name, slug, suburb, studio_type, brand_ownership_pct, partner_name) VALUES
    (buff_brand_id, 'Brighton', 'brighton', 'Brighton', 'corporate', 100, NULL),
    (buff_brand_id, 'Camberwell', 'camberwell', 'Camberwell', 'corporate', 100, NULL),
    (buff_brand_id, 'Essendon', 'essendon', 'Essendon', 'corporate', 100, NULL),
    (buff_brand_id, 'Fitzroy', 'fitzroy', 'Fitzroy', 'corporate', 100, NULL),
    (buff_brand_id, 'Mornington', 'mornington', 'Mornington', 'corporate', 100, NULL),
    (buff_brand_id, 'South Yarra', 'south-yarra', 'South Yarra', 'corporate', 100, NULL),
    (buff_brand_id, 'Richmond', 'richmond', 'Richmond', 'corporate', 100, NULL),
    (buff_brand_id, 'Williamstown', 'williamstown', 'Williamstown', 'jv', 50, 'Shinae Caruso');
END $$;

-- =============================================================================
-- SETUP NOTE
-- After creating a user in Supabase Auth, link them to the brand:
--
-- INSERT INTO user_roles (user_id, brand_id, role)
-- SELECT
--   '<your-auth-user-uuid>',
--   brand_id,
--   'super_admin'
-- FROM brands WHERE slug = 'buff';
--
-- Also update NEXT_PUBLIC_BRAND_ID in .env.local with the brand_id from:
-- SELECT brand_id FROM brands WHERE slug = 'buff';
