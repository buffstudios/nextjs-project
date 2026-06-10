import type { CSSProperties } from "react";
import type { AcquisitionSource, RetentionStatus } from "@/types/database";

/** Normalise to digits only for storage/comparison. */
export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, "");
}

/** Validate Australian mobile: 04xxxxxxxx (10 digits). */
export function isValidAustralianMobile(mobile: string): boolean {
  const digits = normalizeMobile(mobile);
  return /^04\d{8}$/.test(digits);
}

/** Format 04xxxxxxxx as 04xx xxx xxx */
export function formatAustralianMobile(mobile: string): string {
  const digits = normalizeMobile(mobile);
  if (digits.length !== 10) return mobile;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function formatClientName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function retentionLabel(status: RetentionStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "at_risk":
      return "At risk";
    case "lapsed":
      return "Lapsed";
    default:
      return status;
  }
}

export function retentionStyles(status: RetentionStatus): CSSProperties {
  switch (status) {
    case "active":
      return {
        backgroundColor: "color-mix(in srgb, var(--colour-accent) 25%, transparent)",
        color: "var(--colour-primary)",
        borderColor: "var(--colour-accent)",
      };
    case "at_risk":
      return {
        backgroundColor: "color-mix(in srgb, #d97706 20%, transparent)",
        color: "#92400e",
        borderColor: "#d97706",
      };
    case "lapsed":
      return {
        backgroundColor: "color-mix(in srgb, #dc2626 15%, transparent)",
        color: "#991b1b",
        borderColor: "#dc2626",
      };
    default:
      return {};
  }
}

export const ACQUISITION_SOURCES: AcquisitionSource[] = [
  "walk_in",
  "google",
  "instagram",
  "referral",
  "gift_card",
  "corporate",
  "other",
];

export function formatCurrencyExTax(
  amount: number,
  currencyCode: string,
  taxLabel: string
): string {
  return `${currencyCode} ${amount.toFixed(2)} ex-${taxLabel}`;
}
