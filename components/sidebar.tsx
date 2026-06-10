"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";
import { useBrand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRoleLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: UserCircle },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/pos", label: "Point of Sale", icon: CreditCard },
  { href: "/kpi-dashboard", label: "KPI Dashboard", icon: LineChart },
  { href: "/admin/staff", label: "Staff", icon: Users },
];

const adminItems = [
  { href: "/admin/studios", label: "Studios" },
  { href: "/admin/kpi-config", label: "KPI Config" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { brand, userRole } = useBrand();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-surface">
      <div className="border-b px-6 py-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Salon Platform
        </p>
        <h1 className="mt-1 text-lg font-semibold text-primary">
          {brand?.brand_name ?? "Loading..."}
        </h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={
                isActive
                  ? { borderLeft: "3px solid var(--colour-accent)" }
                  : undefined
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Settings className="h-3.5 w-3.5" />
            Admin
          </div>
          {adminItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/20 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                style={
                  isActive
                    ? { borderLeft: "3px solid var(--colour-accent)" }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{userEmail ?? "Signed in"}</p>
          <p className="text-xs text-muted-foreground">
            {userRole ? formatRoleLabel(userRole.role) : "No role assigned"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
