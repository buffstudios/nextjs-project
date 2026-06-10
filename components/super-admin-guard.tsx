"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsSuperAdmin } from "@/lib/brand";

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const isSuperAdmin = useIsSuperAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [isSuperAdmin, router]);

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
