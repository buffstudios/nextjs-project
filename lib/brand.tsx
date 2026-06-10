"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Brand, KpiConfig, UserRole } from "@/types/database";

interface BrandContextValue {
  brand: Brand | null;
  kpiConfig: KpiConfig[];
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  refreshBrand: () => Promise<void>;
  refreshKpiConfig: () => Promise<void>;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [kpiConfig, setKpiConfig] = useState<KpiConfig[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brandId = process.env.NEXT_PUBLIC_BRAND_ID;

  const loadBrand = useCallback(async () => {
    if (!brandId) {
      setError("NEXT_PUBLIC_BRAND_ID is not configured");
      return;
    }

    const supabase = createClient();
    const { data, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("brand_id", brandId.trim())
      .maybeSingle();

    if (brandError) {
      setError(brandError.message);
      return;
    }

    if (!data) {
      setError(
        `Brand not found for NEXT_PUBLIC_BRAND_ID (${brandId}). Run: SELECT brand_id FROM brands WHERE slug = 'buff'; and update .env.local`
      );
      return;
    }

    setBrand(data);
  }, [brandId]);

  const loadKpiConfig = useCallback(async () => {
    if (!brandId) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setKpiConfig([]);
      return;
    }

    const { data, error: kpiError } = await supabase
      .from("kpi_config")
      .select("*")
      .eq("brand_id", brandId)
      .order("display_order", { ascending: true });

    if (kpiError) {
      setError(kpiError.message);
      return;
    }

    setKpiConfig(data ?? []);
  }, [brandId]);

  const loadUserRole = useCallback(async () => {
    if (!brandId) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserRole(null);
      return;
    }

    const { data, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("brand_id", brandId)
      .maybeSingle();

    if (roleError) {
      setError(roleError.message);
      return;
    }

    setUserRole(data);
  }, [brandId]);

  const refreshBrand = useCallback(async () => {
    await loadBrand();
  }, [loadBrand]);

  const refreshKpiConfig = useCallback(async () => {
    await loadKpiConfig();
  }, [loadKpiConfig]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      await Promise.all([loadBrand(), loadKpiConfig(), loadUserRole()]);
      setLoading(false);
    }

    init();
  }, [loadBrand, loadKpiConfig, loadUserRole]);

  const value = useMemo(
    () => ({
      brand,
      kpiConfig,
      userRole,
      loading,
      error,
      refreshBrand,
      refreshKpiConfig,
    }),
    [brand, kpiConfig, userRole, loading, error, refreshBrand, refreshKpiConfig]
  );

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}

export function useIsSuperAdmin() {
  const { userRole } = useBrand();
  return userRole?.role === "super_admin";
}
