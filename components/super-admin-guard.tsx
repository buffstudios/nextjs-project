"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/lib/brand";

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useBrand();
  const isSuperAdmin = userRole?.role === "super_admin";
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">
          Super admin access required for this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
