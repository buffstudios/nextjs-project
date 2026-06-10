"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBrand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import {
  ACQUISITION_SOURCES,
  formatAustralianMobile,
  isValidAustralianMobile,
  normalizeMobile,
} from "@/lib/clients";
import { formatRoleLabel } from "@/lib/utils";
import type {
  AcquisitionSource,
  Client,
  Staff,
  Studio,
} from "@/types/database";
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

export interface ClientFormData {
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  date_of_birth: string;
  home_studio_id: string;
  preferred_staff_id: string;
  acquisition_source: AcquisitionSource;
  acquisition_date: string;
  acquisition_studio_id: string;
  marketing_opt_in: boolean;
  vip_flag: boolean;
  notes: string;
}

const emptyForm: ClientFormData = {
  first_name: "",
  last_name: "",
  mobile: "",
  email: "",
  date_of_birth: "",
  home_studio_id: "",
  preferred_staff_id: "",
  acquisition_source: "walk_in",
  acquisition_date: new Date().toISOString().slice(0, 10),
  acquisition_studio_id: "",
  marketing_opt_in: true,
  vip_flag: false,
  notes: "",
};

interface ClientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient?: Client | null;
  onSaved: () => void;
}

export function ClientFormSheet({
  open,
  onOpenChange,
  editingClient,
  onSaved,
}: ClientFormSheetProps) {
  const { brand } = useBrand();
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!brand || !open) return;

    const supabase = createClient();
    Promise.all([
      supabase
        .from("studios")
        .select("*")
        .eq("brand_id", brand.brand_id)
        .eq("is_active", true)
        .order("studio_name"),
      supabase
        .from("staff")
        .select("*")
        .eq("brand_id", brand.brand_id)
        .eq("is_active", true)
        .order("last_name"),
    ]).then(([studiosRes, staffRes]) => {
      setStudios(studiosRes.data ?? []);
      setStaff(staffRes.data ?? []);
    });
  }, [brand, open]);

  useEffect(() => {
    if (editingClient) {
      setForm({
        first_name: editingClient.first_name,
        last_name: editingClient.last_name,
        mobile: formatAustralianMobile(editingClient.mobile),
        email: editingClient.email ?? "",
        date_of_birth: editingClient.date_of_birth ?? "",
        home_studio_id: editingClient.home_studio_id ?? "",
        preferred_staff_id: editingClient.preferred_staff_id ?? "",
        acquisition_source: editingClient.acquisition_source,
        acquisition_date: editingClient.acquisition_date,
        acquisition_studio_id: editingClient.acquisition_studio_id ?? "",
        marketing_opt_in: editingClient.marketing_opt_in,
        vip_flag: editingClient.vip_flag,
        notes: editingClient.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
    setDuplicateClient(null);
  }, [editingClient, open]);

  async function checkDuplicate(mobile: string): Promise<Client | null> {
    if (!brand) return null;

    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("brand_id", brand.brand_id)
      .eq("mobile", normalizeMobile(mobile))
      .maybeSingle();

    if (data && data.client_id !== editingClient?.client_id) {
      return data;
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!brand) return;

    setError(null);
    setDuplicateClient(null);

    if (!form.first_name.trim() || !form.last_name.trim() || !form.mobile.trim()) {
      setError("First name, last name, and mobile are required.");
      return;
    }

    if (brand.currency_code === "AUD" && !isValidAustralianMobile(form.mobile)) {
      setError("Enter a valid Australian mobile (04xx xxx xxx).");
      return;
    }

    const duplicate = await checkDuplicate(form.mobile);
    if (duplicate) {
      setDuplicateClient(duplicate);
      setError("A client with this mobile number already exists for this brand.");
      return;
    }

    setSaving(true);

    const payload = {
      brand_id: brand.brand_id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      mobile: normalizeMobile(form.mobile),
      email: form.email.trim() || null,
      date_of_birth: form.date_of_birth || null,
      home_studio_id: form.home_studio_id || null,
      preferred_staff_id: form.preferred_staff_id || null,
      acquisition_source: form.acquisition_source,
      acquisition_date: form.acquisition_date,
      acquisition_studio_id: form.acquisition_studio_id || null,
      marketing_opt_in: form.marketing_opt_in,
      vip_flag: form.vip_flag,
      notes: form.notes.trim() || null,
    };

    const supabase = createClient();

    if (editingClient) {
      const { error: updateError } = await supabase
        .from("clients")
        .update(payload)
        .eq("client_id", editingClient.client_id);

      if (updateError) {
        if (updateError.code === "23505") {
          const dup = await checkDuplicate(form.mobile);
          setDuplicateClient(dup);
          setError("A client with this mobile number already exists.");
        } else {
          setError(updateError.message);
        }
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("clients").insert(payload);

      if (insertError) {
        if (insertError.code === "23505") {
          const dup = await checkDuplicate(form.mobile);
          setDuplicateClient(dup);
          setError("A client with this mobile number already exists.");
        } else {
          setError(insertError.message);
        }
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {editingClient ? "Edit client" : "New client"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name *</Label>
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
              <Label htmlFor="last_name">Last name *</Label>
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
            <Label htmlFor="mobile">Mobile *</Label>
            <Input
              id="mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="04xx xxx xxx"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) =>
                setForm({ ...form, date_of_birth: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Home studio</Label>
            <Select
              value={form.home_studio_id || "none"}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  home_studio_id: value === "none" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select studio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {studios.map((studio) => (
                  <SelectItem key={studio.studio_id} value={studio.studio_id}>
                    {studio.studio_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preferred staff</Label>
            <Select
              value={form.preferred_staff_id || "none"}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  preferred_staff_id: value === "none" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.staff_id} value={member.staff_id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Acquisition source</Label>
            <Select
              value={form.acquisition_source}
              onValueChange={(value: AcquisitionSource) =>
                setForm({ ...form, acquisition_source: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACQUISITION_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {formatRoleLabel(source)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acquisition_date">Acquisition date</Label>
              <Input
                id="acquisition_date"
                type="date"
                value={form.acquisition_date}
                onChange={(e) =>
                  setForm({ ...form, acquisition_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Acquisition studio</Label>
              <Select
                value={form.acquisition_studio_id || "none"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    acquisition_studio_id: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select studio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {studios.map((studio) => (
                    <SelectItem key={studio.studio_id} value={studio.studio_id}>
                      {studio.studio_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.marketing_opt_in}
                onChange={(e) =>
                  setForm({ ...form, marketing_opt_in: e.target.checked })
                }
              />
              Marketing opt-in
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.vip_flag}
                onChange={(e) =>
                  setForm({ ...form, vip_flag: e.target.checked })
                }
              />
              VIP client
            </label>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
              {duplicateClient && (
                <div className="mt-2">
                  <p className="font-medium text-foreground">
                    Existing: {duplicateClient.first_name}{" "}
                    {duplicateClient.last_name} ({duplicateClient.mobile})
                  </p>
                  <Link
                    href={`/clients/${duplicateClient.client_id}`}
                    className="mt-1 inline-block text-primary underline"
                    onClick={() => onOpenChange(false)}
                  >
                    View existing record
                  </Link>
                </div>
              )}
            </div>
          )}

          <Button type="submit" variant="accent" disabled={saving}>
            {saving ? "Saving..." : editingClient ? "Save changes" : "Create client"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
