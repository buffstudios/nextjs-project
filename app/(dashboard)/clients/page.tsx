"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useBrand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { formatAustralianMobile, formatClientName } from "@/lib/clients";
import type { Client, ClientMetrics, RetentionStatus, Studio } from "@/types/database";
import { ClientFormSheet } from "@/components/clients/client-form-sheet";
import { RetentionBadge } from "@/components/clients/retention-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClientRow = Client & {
  metrics: ClientMetrics | null;
  home_studio: { studio_name: string } | null;
};

export default function ClientsPage() {
  const router = useRouter();
  const { brand } = useBrand();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [studioFilter, setStudioFilter] = useState("all");
  const [retentionFilter, setRetentionFilter] = useState("all");
  const [vipFilter, setVipFilter] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStudios = useCallback(async () => {
    if (!brand) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("studios")
      .select("*")
      .eq("brand_id", brand.brand_id)
      .eq("is_active", true)
      .order("studio_name");

    setStudios(data ?? []);
  }, [brand]);

  const loadClients = useCallback(async () => {
    if (!brand) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    let query = supabase
      .from("clients")
      .select(
        `*, home_studio:studios!home_studio_id(studio_name)`
      )
      .eq("brand_id", brand.brand_id)
      .eq("is_active", true)
      .order("last_name");

    if (debouncedSearch) {
      const term = `%${debouncedSearch}%`;
      query = query.or(
        `first_name.ilike.${term},last_name.ilike.${term},mobile.ilike.${term}`
      );
    }

    if (studioFilter !== "all") {
      query = query.eq("home_studio_id", studioFilter);
    }

    if (vipFilter) {
      query = query.eq("vip_flag", true);
    }

    const [clientsRes, metricsRes] = await Promise.all([
      query,
      supabase
        .from("client_metrics")
        .select("*")
        .eq("brand_id", brand.brand_id),
    ]);

    if (clientsRes.error) {
      setError(clientsRes.error.message);
      setLoading(false);
      return;
    }

    if (metricsRes.error) {
      setError(metricsRes.error.message);
      setLoading(false);
      return;
    }

    const metricsMap = new Map(
      (metricsRes.data ?? []).map((m) => [m.client_id, m as ClientMetrics])
    );

    let rows: ClientRow[] = (clientsRes.data ?? []).map((client) => ({
      ...(client as Client & {
        home_studio: { studio_name: string } | null;
      }),
      metrics: metricsMap.get(client.client_id) ?? null,
    }));

    if (retentionFilter !== "all") {
      rows = rows.filter(
        (row) => row.metrics?.retention_status === retentionFilter
      );
    }

    setClients(rows);
    setLoading(false);
  }, [brand, debouncedSearch, studioFilter, retentionFilter, vipFilter]);

  useEffect(() => {
    loadStudios();
  }, [loadStudios]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const headerNote = useMemo(() => {
    if (!brand) return "";
    return `All figures in ${brand.currency_code} ex-${brand.tax_label}`;
  }, [brand]);

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">{headerNote}</p>
        </div>
        <Button variant="accent" onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4" />
          New client
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Studio</Label>
            <Select value={studioFilter} onValueChange={setStudioFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All studios</SelectItem>
                {studios.map((studio) => (
                  <SelectItem key={studio.studio_id} value={studio.studio_id}>
                    {studio.studio_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Retention</Label>
            <Select value={retentionFilter} onValueChange={setRetentionFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at_risk">At risk</SelectItem>
                <SelectItem value="lapsed">Lapsed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={vipFilter}
                onChange={(e) => setVipFilter(e.target.checked)}
              />
              VIP only
            </label>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Home studio</TableHead>
              <TableHead>Last visit</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Retention</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading clients...</TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No clients found.</TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.client_id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/clients/${client.client_id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {formatClientName(client.first_name, client.last_name)}
                      {client.vip_flag && (
                        <Badge variant="accent" className="text-[10px]">
                          VIP
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatAustralianMobile(client.mobile)}</TableCell>
                  <TableCell>
                    {client.home_studio?.studio_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {client.metrics?.last_visit_date ?? "—"}
                  </TableCell>
                  <TableCell>{client.metrics?.total_visits ?? 0}</TableCell>
                  <TableCell>
                    <RetentionBadge
                      status={
                        (client.metrics?.retention_status ??
                          "active") as RetentionStatus
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClientFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={loadClients}
      />
    </div>
  );
}
