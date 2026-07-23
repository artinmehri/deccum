import type { YearStatus } from "@/lib/engine";
import { STATUS_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function YearStatusBadge({ status }: { status: YearStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
