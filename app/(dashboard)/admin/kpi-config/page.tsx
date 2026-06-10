"use client";

import { useCallback, useEffect, useState } from "react";
import { useBrand, useIsSuperAdmin } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { formatRoleLabel } from "@/lib/utils";
import type { KpiConfig, KpiDirection, KpiUnit } from "@/types/database";
import { SuperAdminGuard } from "@/components/super-admin-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type EditableKpi = KpiConfig & {
  draft_green: string;
  draft_amber: string;
  draft_red: string;
};

export default function KpiConfigAdminPage() {
  return (
    <SuperAdminGuard>
      <KpiConfigContent />
    </SuperAdminGuard>
  );
}

function KpiConfigContent() {
  const { brand, refreshKpiConfig } = useBrand();
  const isSuperAdmin = useIsSuperAdmin();
  const [kpis, setKpis] = useState<EditableKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKpis = useCallback(async () => {
    if (!brand) return;

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("kpi_config")
      .select("*")
      .eq("brand_id", brand.brand_id)
      .order("display_order");

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setKpis(
      ((data ?? []) as KpiConfig[]).map((kpi) => ({
        ...kpi,
        draft_green: String(kpi.green_threshold),
        draft_amber: String(kpi.amber_threshold),
        draft_red: String(kpi.red_threshold),
      }))
    );
    setLoading(false);
  }, [brand]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  function updateKpi(kpiId: string, field: keyof EditableKpi, value: string) {
    setKpis((current) =>
      current.map((kpi) =>
        kpi.kpi_id === kpiId ? { ...kpi, [field]: value } : kpi
      )
    );
  }

  async function saveKpi(kpi: EditableKpi) {
    if (!isSuperAdmin) return;

    setSavingId(kpi.kpi_id);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("kpi_config")
      .update({
        green_threshold: Number(kpi.draft_green),
        amber_threshold: Number(kpi.draft_amber),
        red_threshold: Number(kpi.draft_red),
        green_direction: kpi.green_direction,
        unit: kpi.unit,
      })
      .eq("kpi_id", kpi.kpi_id);

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    await loadKpis();
    await refreshKpiConfig();
    setSavingId(null);
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold">KPI Configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thresholds for {brand?.brand_name}. Changes apply across all dashboards.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Green</TableHead>
              <TableHead>Amber</TableHead>
              <TableHead>Red</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading KPI configuration...</TableCell>
              </TableRow>
            ) : kpis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No KPIs configured.</TableCell>
              </TableRow>
            ) : (
              kpis.map((kpi) => (
                <TableRow key={kpi.kpi_id}>
                  <TableCell>
                    <div className="font-medium">{kpi.kpi_label}</div>
                    <div className="text-xs text-muted-foreground">
                      {kpi.kpi_key}
                    </div>
                  </TableCell>
                  <TableCell>{formatRoleLabel(kpi.unit)}</TableCell>
                  <TableCell>
                    <Select
                      value={kpi.green_direction}
                      onValueChange={(value: KpiDirection) =>
                        setKpis((current) =>
                          current.map((item) =>
                            item.kpi_id === kpi.kpi_id
                              ? { ...item, green_direction: value }
                              : item
                          )
                        )
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpi.draft_green}
                      onChange={(e) =>
                        updateKpi(kpi.kpi_id, "draft_green", e.target.value)
                      }
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpi.draft_amber}
                      onChange={(e) =>
                        updateKpi(kpi.kpi_id, "draft_amber", e.target.value)
                      }
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={kpi.draft_red}
                      onChange={(e) =>
                        updateKpi(kpi.kpi_id, "draft_red", e.target.value)
                      }
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={kpi.is_active ? "success" : "secondary"}>
                      {kpi.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingId === kpi.kpi_id}
                      onClick={() => saveKpi(kpi)}
                    >
                      {savingId === kpi.kpi_id ? "Saving..." : "Save"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
