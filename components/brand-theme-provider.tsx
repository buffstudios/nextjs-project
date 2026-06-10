"use client";

import { useEffect } from "react";
import { useBrand } from "@/lib/brand";

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const { brand } = useBrand();

  useEffect(() => {
    if (!brand) return;

    const root = document.documentElement;
    root.style.setProperty("--colour-primary", brand.primary_colour);
    root.style.setProperty("--colour-accent", brand.accent_colour);
    root.style.setProperty("--colour-surface", brand.surface_colour);
  }, [brand]);

  return <>{children}</>;
}
