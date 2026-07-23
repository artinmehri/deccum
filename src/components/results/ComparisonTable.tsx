"use client";

import type { ComparisonResult } from "@/lib/engine";
import { formatCurrency, formatYears } from "@/lib/format";
import { motion } from "framer-motion";

function Row({
  label,
  naive,
  optimized,
}: {
  label: string;
  naive: string;
  optimized: string;
}) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-3 border-b border-line/70 py-3.5 text-sm last:border-0">
      <span className="font-medium text-ink-soft">{label}</span>
      <span className="font-semibold text-ink">{naive}</span>
      <span className="font-semibold text-accent">{optimized}</span>
    </div>
  );
}

export function ComparisonTable({ result }: { result: ComparisonResult }) {
  const { naive, optimized, deltas, profile } = result;
  const isCA = profile.country === "CA";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-line/80 bg-white/80 p-6 shadow-[0_20px_50px_rgba(12,31,26,0.06)] backdrop-blur"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Sequence comparison
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Naive vs optimized order
          </h2>
        </div>
        <p className="max-w-md text-sm text-ink-soft">
          Same scenario assumptions — only withdrawal order changes.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-[1.2fr_1fr_1fr] gap-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <span>Metric</span>
        <span>Naive</span>
        <span>Optimized</span>
      </div>

      <Row
        label={isCA ? "Tax drag before 65" : "Pre-Medicare tax + penalties"}
        naive={formatCurrency(naive.summary.preMedicareDrag)}
        optimized={formatCurrency(optimized.summary.preMedicareDrag)}
      />
      {isCA ? (
        <Row
          label="OAS clawback years"
          naive={String(naive.summary.oasClawbackYears ?? 0)}
          optimized={String(optimized.summary.oasClawbackYears ?? 0)}
        />
      ) : (
        <Row
          label="Early-withdrawal penalties"
          naive={formatCurrency(naive.summary.totalPenalties)}
          optimized={formatCurrency(optimized.summary.totalPenalties)}
        />
      )}
      <Row
        label="Portfolio at age 65"
        naive={formatCurrency(naive.summary.netWorthAt65)}
        optimized={formatCurrency(optimized.summary.netWorthAt65)}
      />
      <Row
        label="Years until depletion"
        naive={formatYears(
          naive.summary.yearsUntilDepletion ?? naive.summary.yearsPlanned,
        )}
        optimized={formatYears(
          optimized.summary.yearsUntilDepletion ??
            optimized.summary.yearsPlanned,
        )}
      />
      {isCA ? (
        <Row
          label="TFSA at end"
          naive={formatCurrency(
            naive.summary.endingTaxFreeBalance ??
              naive.summary.endingRothBalance,
          )}
          optimized={formatCurrency(
            optimized.summary.endingTaxFreeBalance ??
              optimized.summary.endingRothBalance,
          )}
        />
      ) : (
        <Row
          label="ACA-eligible years (pre-65)"
          naive={String(naive.summary.yearsWithAca)}
          optimized={String(optimized.summary.yearsWithAca)}
        />
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Drag avoided",
            value: formatCurrency(Math.max(0, deltas.preMedicareDragSavings)),
          },
          {
            label: "Extra at 65",
            value: formatCurrency(Math.max(0, deltas.netWorthAt65Improvement)),
          },
          isCA
            ? {
                label: "OAS years avoided",
                value: `−${Math.max(
                  0,
                  (naive.summary.oasClawbackYears ?? 0) -
                    (optimized.summary.oasClawbackYears ?? 0),
                )}`,
              }
            : {
                label: "Extra ACA years",
                value: `+${Math.max(0, deltas.extraAcaYears)}`,
              },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-accent-soft/70 px-4 py-3"
          >
            <p className="text-xs text-accent-deep">{stat.label}</p>
            <p className="font-display text-2xl font-semibold text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
