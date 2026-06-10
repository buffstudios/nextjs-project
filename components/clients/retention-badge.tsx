import { retentionLabel, retentionStyles } from "@/lib/clients";
import type { RetentionStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export function RetentionBadge({
  status,
  className,
}: {
  status: RetentionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
      style={retentionStyles(status)}
    >
      {retentionLabel(status)}
    </span>
  );
}
