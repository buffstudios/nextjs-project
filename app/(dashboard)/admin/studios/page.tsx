"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useBrand, useIsSuperAdmin } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { formatRoleLabel, slugify } from "@/lib/utils";
import type { Studio, StudioType } from "@/types/database";
import { SuperAdminGuard } from "@/components/super-admin-guard";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STUDIO_TYPES: StudioType[] = ["corporate", "jv", "franchise", "license"];

const emptyForm = {
  studio_name: "",
  suburb: "",
  address: "",
  studio_type: "corporate" as StudioType,
  brand_ownership_pct: "100",
  partner_name: "",
  monthly_rent: "",
  is_active: true,
};

export default function StudiosAdminPage() {
  return (
    <SuperAdminGuard>
      <StudiosAdminContent />
    </SuperAdminGuard>
  );
}

function StudiosAdminContent() {
  const { brand, error: brandError } = useBrand();
  const isSuperAdmin = useIsSuperAdmin();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudios = useCallback(async () => {
    if (!brand) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("studios")
      .select("*")
      .eq("brand_id", brand.brand_id)
      .order("studio_name");

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setStudios(data ?? []);
    setLoading(false);
  }, [brand]);

  useEffect(() => {
    loadStudios();
  }, [loadStudios]);

  function openCreate() {
    setEditingStudio(null);
    setForm(emptyForm);
    setSheetOpen(true);
  }

  function openEdit(studio: Studio) {
    setEditingStudio(studio);
    setForm({
      studio_name: studio.studio_name,
      suburb: studio.suburb,
      address: studio.address ?? "",
      studio_type: studio.studio_type,
      brand_ownership_pct: String(studio.brand_ownership_pct),
      partner_name: studio.partner_name ?? "",
      monthly_rent: studio.monthly_rent != null ? String(studio.monthly_rent) : "",
      is_active: studio.is_active,
    });
    setSheetOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!brand || !isSuperAdmin) return;

    setSaving(true);
    setError(null);

    const payload = {
      brand_id: brand.brand_id,
      studio_name: form.studio_name,
      slug: slugify(form.studio_name),
      suburb: form.suburb,
      address: form.address || null,
      studio_type: form.studio_type,
      brand_ownership_pct: Number(form.brand_ownership_pct),
      partner_name: form.partner_name || null,
      monthly_rent: form.monthly_rent ? Number(form.monthly_rent) : null,
      is_active: form.is_active,
    };

    const supabase = createClient();

    if (editingStudio) {
      const { error: updateError } = await supabase
        .from("studios")
        .update(payload)
        .eq("studio_id", editingStudio.studio_id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("studios")
        .insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSheetOpen(false);
    await loadStudios();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Studios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage studio locations for {brand?.brand_name}.
          </p>
        </div>
        <Button variant="accent" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add studio
        </Button>
      </div>

      {(brandError || error) && (
        <p className="mt-4 text-sm text-destructive">{brandError ?? error}</p>
      )}

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Suburb</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ownership</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading studios...</TableCell>
              </TableRow>
            ) : studios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No studios found.</TableCell>
              </TableRow>
            ) : (
              studios.map((studio) => (
                <TableRow
                  key={studio.studio_id}
                  className="cursor-pointer"
                  onClick={() => openEdit(studio)}
                >
                  <TableCell className="font-medium">
                    {studio.studio_name}
                  </TableCell>
                  <TableCell>{studio.suburb}</TableCell>
                  <TableCell>{formatRoleLabel(studio.studio_type)}</TableCell>
                  <TableCell>{studio.brand_ownership_pct}%</TableCell>
                  <TableCell>{studio.partner_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={studio.is_active ? "success" : "secondary"}>
                      {studio.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editingStudio ? "Edit studio" : "Add studio"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studio_name">Studio name</Label>
              <Input
                id="studio_name"
                value={form.studio_name}
                onChange={(e) =>
                  setForm({ ...form, studio_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb</Label>
              <Input
                id="suburb"
                value={form.suburb}
                onChange={(e) => setForm({ ...form, suburb: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Studio type</Label>
              <Select
                value={form.studio_type}
                onValueChange={(value: StudioType) =>
                  setForm({ ...form, studio_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDIO_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatRoleLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership">Brand ownership %</Label>
              <Input
                id="ownership"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.brand_ownership_pct}
                onChange={(e) =>
                  setForm({ ...form, brand_ownership_pct: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner_name">Partner name</Label>
              <Input
                id="partner_name"
                value={form.partner_name}
                onChange={(e) =>
                  setForm({ ...form, partner_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly rent</Label>
              <Input
                id="monthly_rent"
                type="number"
                min="0"
                step="0.01"
                value={form.monthly_rent}
                onChange={(e) =>
                  setForm({ ...form, monthly_rent: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving..." : "Save studio"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
