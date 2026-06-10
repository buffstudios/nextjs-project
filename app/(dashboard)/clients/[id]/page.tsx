"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useBrand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import {
  formatAustralianMobile,
  formatClientName,
  formatCurrencyExTax,
} from "@/lib/clients";
import { formatRoleLabel } from "@/lib/utils";
import type {
  Client,
  ClientCommunicationLog,
  ClientMetrics,
  Staff,
  Studio,
} from "@/types/database";
import { ClientFormSheet } from "@/components/clients/client-form-sheet";
import { RetentionBadge } from "@/components/clients/retention-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClientDetail = Client & {
  metrics: ClientMetrics | null;
  home_studio: Studio | null;
  preferred_staff: Staff | null;
  acquisition_studio: Studio | null;
};

const TABS = ["visits", "metrics", "communications"] as const;
type Tab = (typeof TABS)[number];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { brand } = useBrand();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [communications, setCommunications] = useState<ClientCommunicationLog[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<Tab>("visits");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadClient = useCallback(async () => {
    if (!brand || !clientId) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const [clientRes, metricsRes, commsRes] = await Promise.all([
      supabase
        .from("clients")
        .select(
          `
          *,
          home_studio:studios!home_studio_id(*),
          preferred_staff:staff!preferred_staff_id(*),
          acquisition_studio:studios!acquisition_studio_id(*)
        `
        )
        .eq("client_id", clientId)
        .eq("brand_id", brand.brand_id)
        .maybeSingle(),
      supabase
        .from("client_metrics")
        .select("*")
        .eq("client_id", clientId)
        .eq("brand_id", brand.brand_id)
        .maybeSingle(),
      supabase
        .from("client_communication_log")
        .select("*")
        .eq("client_id", clientId)
        .eq("brand_id", brand.brand_id)
        .order("sent_at", { ascending: false }),
    ]);

    if (clientRes.error) {
      setError(clientRes.error.message);
      setLoading(false);
      return;
    }

    if (!clientRes.data) {
      setError("Client not found.");
      setLoading(false);
      return;
    }

    setClient({
      ...(clientRes.data as Omit<ClientDetail, "metrics">),
      metrics: metricsRes.data,
    });
    setCommunications(commsRes.data ?? []);
    setLoading(false);
  }, [brand, clientId]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading client...</p>
      </div>
    );
  }

  if (error || !client || !brand) {
    return (
      <div className="p-8">
        <p className="text-destructive">{error ?? "Client not found."}</p>
        <Link href="/clients" className="mt-4 inline-block text-primary underline">
          Back to clients
        </Link>
      </div>
    );
  }

  const metrics = client.metrics;
  const headerNote = `All figures in ${brand.currency_code} ex-${brand.tax_label}`;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/clients"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Clients
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {formatClientName(client.first_name, client.last_name)}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {client.vip_flag && <Badge variant="accent">VIP</Badge>}
                  <RetentionBadge
                    status={metrics?.retention_status ?? "active"}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSheetOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Mobile</dt>
                <dd>{formatAustralianMobile(client.mobile)}</dd>
              </div>
              {client.email && (
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{client.email}</dd>
                </div>
              )}
              {client.date_of_birth && (
                <div>
                  <dt className="text-muted-foreground">Date of birth</dt>
                  <dd>{client.date_of_birth}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Home studio</dt>
                <dd>{client.home_studio?.studio_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preferred staff</dt>
                <dd>
                  {client.preferred_staff
                    ? `${client.preferred_staff.first_name} ${client.preferred_staff.last_name}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Acquisition</dt>
                <dd>
                  {formatRoleLabel(client.acquisition_source)} ·{" "}
                  {client.acquisition_date}
                  {client.acquisition_studio &&
                    ` · ${client.acquisition_studio.studio_name}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Marketing</dt>
                <dd>{client.marketing_opt_in ? "Opted in" : "Opted out"}</dd>
              </div>
              {client.notes && (
                <div>
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="whitespace-pre-wrap">{client.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex gap-1 border-b">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium capitalize transition-colors",
                  activeTab === tab
                    ? "border-b-2 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  activeTab === tab
                    ? { borderBottomColor: "var(--colour-accent)" }
                    : undefined
                }
              >
                {tab === "visits"
                  ? "Visit history"
                  : tab === "metrics"
                    ? "Metrics"
                    : "Communications"}
              </button>
            ))}
          </div>

          <p className="mb-4 text-xs text-muted-foreground">{headerNote}</p>

          {activeTab === "visits" && (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Visit history will populate when appointments are completed in
                Sprint 3. No visits recorded yet.
              </p>
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="Total visits"
                value={String(metrics?.total_visits ?? 0)}
              />
              <MetricCard
                label="Average invoice"
                value={formatCurrencyExTax(
                  metrics?.average_invoice_value ?? 0,
                  brand.currency_code,
                  brand.tax_label
                )}
              />
              <MetricCard
                label="Lifetime value"
                value={formatCurrencyExTax(
                  metrics?.lifetime_value ?? 0,
                  brand.currency_code,
                  brand.tax_label
                )}
              />
              <MetricCard
                label="Days since last visit"
                value={
                  metrics?.days_since_last_visit != null
                    ? String(metrics.days_since_last_visit)
                    : "—"
                }
              />
              <MetricCard
                label="Rebooking rate"
                value="Pending appointments (Sprint 3)"
              />
              <MetricCard
                label="Staff portability risk"
                value="Pending appointments (Sprint 3)"
              />
            </div>
          )}

          {activeTab === "communications" && (
            <div className="rounded-lg border">
              {communications.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No communications sent yet. Automated messages arrive in
                  Sprint 7.
                </p>
              ) : (
                <ul className="divide-y">
                  {communications.map((log) => (
                    <li key={log.log_id} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {formatRoleLabel(log.trigger_type)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.sent_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.channel.toUpperCase()} · {log.direction}
                      </p>
                      {log.message_preview && (
                        <p className="mt-2 text-sm">{log.message_preview}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <ClientFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingClient={client}
        onSaved={loadClient}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
