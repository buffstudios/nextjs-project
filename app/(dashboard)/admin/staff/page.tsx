"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useBrand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { formatRoleLabel } from "@/lib/utils";
import type {
  EmploymentType,
  Staff,
  StaffRole,
  Studio,
} from "@/types/database";
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

type StaffWithStudio = Staff & { studios: { studio_name: string } | null };

const STAFF_ROLES: StaffRole[] = [
  "nail_technician",
  "senior_technician",
  "studio_manager",
  "operations",
  "admin",
];

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "full_time",
  "part_time",
  "casual",
];

const emptyForm = {
  first_name: "",
  last_name: "",
  studio_id: "",
  role: "nail_technician" as StaffRole,
  employment_type: "full_time" as EmploymentType,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  base_hourly_rate: "0",
  is_bookable: true,
  is_active: true,
  bio: "",
};

export default function StaffAdminPage() {
  const { brand } = useBrand();
  const [staff, setStaff] = useState<StaffWithStudio[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [studioFilter, setStudioFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!brand) return;

    const supabase = createClient();

    const [staffResult, studiosResult] = await Promise.all([
      supabase
        .from("staff")
        .select("*, studios(studio_name)")
        .eq("brand_id", brand.brand_id)
        .order("last_name"),
      supabase
        .from("studios")
        .select("*")
        .eq("brand_id", brand.brand_id)
        .eq("is_active", true)
        .order("studio_name"),
    ]);

    if (staffResult.error) {
      setError(staffResult.error.message);
      return;
    }

    if (studiosResult.error) {
      setError(studiosResult.error.message);
      return;
    }

    setStaff((staffResult.data as StaffWithStudio[]) ?? []);
    setStudios(studiosResult.data ?? []);
    setLoading(false);
  }, [brand]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStaff = useMemo(() => {
    if (studioFilter === "all") return staff;
    return staff.filter((member) => member.studio_id === studioFilter);
  }, [staff, studioFilter]);

  function openCreate() {
    setEditingStaff(null);
    setForm({
      ...emptyForm,
      studio_id: studios[0]?.studio_id ?? "",
    });
    setSheetOpen(true);
  }

  function openEdit(member: Staff) {
    setEditingStaff(member);
    setForm({
      first_name: member.first_name,
      last_name: member.last_name,
      studio_id: member.studio_id,
      role: member.role,
      employment_type: member.employment_type,
      start_date: member.start_date,
      end_date: member.end_date ?? "",
      base_hourly_rate: String(member.base_hourly_rate),
      is_bookable: member.is_bookable,
      is_active: member.is_active,
      bio: member.bio ?? "",
    });
    setSheetOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!brand) return;

    setSaving(true);
    setError(null);

    const payload = {
      brand_id: brand.brand_id,
      first_name: form.first_name,
      last_name: form.last_name,
      studio_id: form.studio_id,
      role: form.role,
      employment_type: form.employment_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      base_hourly_rate: Number(form.base_hourly_rate),
      is_bookable: form.is_bookable,
      is_active: form.is_active,
      bio: form.bio || null,
    };

    const supabase = createClient();

    if (editingStaff) {
      const { error: updateError } = await supabase
        .from("staff")
        .update(payload)
        .eq("staff_id", editingStaff.staff_id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("staff").insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSheetOpen(false);
    await loadData();
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff across all studios.
          </p>
        </div>
        <Button variant="accent" onClick={openCreate} disabled={studios.length === 0}>
          <Plus className="h-4 w-4" />
          Add staff
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Label htmlFor="studio-filter">Filter by studio</Label>
        <Select value={studioFilter} onValueChange={setStudioFilter}>
          <SelectTrigger id="studio-filter" className="w-56">
            <SelectValue placeholder="All studios" />
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

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Studio</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Employment</TableHead>
              <TableHead>Bookable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading staff...</TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No staff found.</TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow
                  key={member.staff_id}
                  className="cursor-pointer"
                  onClick={() => openEdit(member)}
                >
                  <TableCell className="font-medium">
                    {member.first_name} {member.last_name}
                  </TableCell>
                  <TableCell>{member.studios?.studio_name ?? "—"}</TableCell>
                  <TableCell>{formatRoleLabel(member.role)}</TableCell>
                  <TableCell>
                    {formatRoleLabel(member.employment_type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.is_bookable ? "success" : "secondary"}>
                      {member.is_bookable ? "Bookable" : "Not bookable"}
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
              {editingStaff ? "Edit staff member" : "Add staff member"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Studio</Label>
              <Select
                value={form.studio_id}
                onValueChange={(value) =>
                  setForm({ ...form, studio_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select studio" />
                </SelectTrigger>
                <SelectContent>
                  {studios.map((studio) => (
                    <SelectItem key={studio.studio_id} value={studio.studio_id}>
                      {studio.studio_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value: StaffRole) =>
                  setForm({ ...form, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Employment type</Label>
              <Select
                value={form.employment_type}
                onValueChange={(value: EmploymentType) =>
                  setForm({ ...form, employment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatRoleLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_hourly_rate">Base hourly rate</Label>
              <Input
                id="base_hourly_rate"
                type="number"
                min="0"
                step="0.01"
                value={form.base_hourly_rate}
                onChange={(e) =>
                  setForm({ ...form, base_hourly_rate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_bookable}
                  onChange={(e) =>
                    setForm({ ...form, is_bookable: e.target.checked })
                  }
                />
                Bookable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                Active
              </label>
            </div>

            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving..." : "Save staff member"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
