"use client";

import type { YearPlan, YearWarning } from "@/lib/engine";
import { WARNING_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";

function severityStyles(severity: YearWarning["severity"]) {
  if (severity === "critical") {
    return {
      wrap: "border-danger/20 bg-danger-soft",
      icon: OctagonAlert,
      iconClass: "text-danger",
    };
  }
  if (severity === "warning") {
    return {
      wrap: "border-warn/20 bg-warn-soft",
      icon: AlertTriangle,
      iconClass: "text-warn",
    };
  }
  return {
    wrap: "border-info/20 bg-info-soft",
    icon: Info,
    iconClass: "text-info",
  };
}

export function WarningCards({
  years,
  strategy,
}: {
  years: YearPlan[];
  strategy: "naive" | "optimized";
}) {
  const items = years
    .flatMap((y) =>
      y.warnings.map((w) => ({
        ...w,
        age: y.age,
      })),
    )
    .filter((w) =>
      strategy === "optimized"
        ? w.severity !== "critical" || w.code === "shortfall"
        : true,
    )
    .slice(0, strategy === "naive" ? 8 : 6);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-accent/20 bg-accent-soft/50 p-6 text-sm text-accent-deep">
        No critical warnings in the optimized path for the early retirement
        window — that&apos;s the point.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((w, i) => {
        const styles = severityStyles(w.severity);
        const Icon = styles.icon;
        return (
          <div
            key={`${w.code}-${w.age}-${i}`}
            className={cn(
              "rounded-2xl border px-4 py-3",
              styles.wrap,
            )}
          >
            <div className="flex items-start gap-2.5">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", styles.iconClass)} />
              <div>
                <p className="text-sm font-semibold text-ink">
                  Age {w.age} · {WARNING_LABELS[w.code]}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {w.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
