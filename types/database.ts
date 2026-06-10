export type KpiUnit = "currency" | "percentage" | "integer" | "ratio";
export type KpiDirection = "above" | "below";
export type StudioType = "corporate" | "jv" | "franchise" | "license";
export type StaffRole =
  | "nail_technician"
  | "senior_technician"
  | "studio_manager"
  | "operations"
  | "admin";
export type EmploymentType = "full_time" | "part_time" | "casual";
export type UserRoleType =
  | "super_admin"
  | "ops_manager"
  | "studio_manager"
  | "technician"
  | "jv_partner"
  | "finance_viewer";

export interface Brand {
  brand_id: string;
  brand_name: string;
  slug: string;
  primary_colour: string;
  accent_colour: string;
  surface_colour: string;
  logo_url: string | null;
  booking_url: string | null;
  currency_code: string;
  tax_rate_pct: number;
  tax_label: string;
  default_timezone: string;
  leave_accrual_rate: number;
  payroll_tax_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface KpiConfig {
  kpi_id: string;
  brand_id: string;
  kpi_key: string;
  kpi_label: string;
  kpi_description: string | null;
  unit: KpiUnit;
  green_threshold: number;
  green_direction: KpiDirection;
  amber_threshold: number;
  red_threshold: number;
  is_active: boolean;
  display_order: number;
}

export interface Studio {
  studio_id: string;
  brand_id: string;
  studio_name: string;
  slug: string;
  suburb: string;
  address: string | null;
  studio_type: StudioType;
  brand_ownership_pct: number;
  partner_name: string | null;
  monthly_rent: number | null;
  open_date: string | null;
  is_active: boolean;
  legacy_system_id: string | null;
  created_at: string;
}

export interface Staff {
  staff_id: string;
  brand_id: string;
  studio_id: string;
  first_name: string;
  last_name: string;
  role: StaffRole;
  employment_type: EmploymentType;
  start_date: string;
  end_date: string | null;
  base_hourly_rate: number;
  is_bookable: boolean;
  is_active: boolean;
  external_roster_id: string | null;
  bio: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  brand_id: string;
  staff_id: string | null;
  role: UserRoleType;
  studio_id: string | null;
}

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: Brand;
        Insert: Omit<Brand, "brand_id" | "created_at"> & {
          brand_id?: string;
          created_at?: string;
        };
        Update: Partial<Brand>;
        Relationships: [];
      };
      kpi_config: {
        Row: KpiConfig;
        Insert: {
          kpi_id?: string;
          brand_id: string;
          kpi_key: string;
          kpi_label: string;
          kpi_description?: string | null;
          unit: KpiUnit;
          green_threshold: number;
          green_direction: KpiDirection;
          amber_threshold: number;
          red_threshold: number;
          is_active?: boolean;
          display_order?: number;
        };
        Update: {
          kpi_key?: string;
          kpi_label?: string;
          kpi_description?: string | null;
          unit?: KpiUnit;
          green_threshold?: number;
          green_direction?: KpiDirection;
          amber_threshold?: number;
          red_threshold?: number;
          is_active?: boolean;
          display_order?: number;
        };
        Relationships: [];
      };
      studios: {
        Row: Studio;
        Insert: Omit<Studio, "studio_id" | "created_at"> & {
          studio_id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Studio, "studio_id" | "brand_id">>;
        Relationships: [];
      };
      staff: {
        Row: Staff;
        Insert: Omit<Staff, "staff_id" | "created_at"> & {
          staff_id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Staff, "staff_id" | "brand_id">>;
        Relationships: [];
      };
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, "id"> & { id?: string };
        Update: Partial<Omit<UserRole, "id" | "user_id" | "brand_id">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      kpi_unit: KpiUnit;
      kpi_direction: KpiDirection;
      studio_type: StudioType;
      staff_role: StaffRole;
      employment_type: EmploymentType;
      user_role_type: UserRoleType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type StudioInsert = Database["public"]["Tables"]["studios"]["Insert"];
export type StaffInsert = Database["public"]["Tables"]["staff"]["Insert"];
