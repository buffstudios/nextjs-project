"use client";

import { useBrand } from "@/lib/brand";

export default function DashboardPage() {
  const { brand, kpiConfig, loading, error } = useBrand();

  if (loading) {
    return <PageShell title="Dashboard">Loading brand configuration...</PageShell>;
  }

  if (error) {
    return (
      <PageShell title="Dashboard">
        <p className="text-destructive">{error}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Dashboard">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Brand" value={brand?.brand_name ?? "—"} />
        <StatCard
          label="Currency"
          value={`${brand?.currency_code ?? "—"} ex-${brand?.tax_label ?? "tax"}`}
        />
        <StatCard label="Active KPIs" value={String(kpiConfig.length)} />
      </div>

      <div className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Sprint 1 complete</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Foundation is in place: multi-brand schema, auth, brand config, studios,
          and staff management. KPI dashboards and operational features arrive in
          later sprints.
        </p>
      </div>
    </PageShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}
