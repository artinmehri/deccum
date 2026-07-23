"use client";

import type { CountryCode, StrategyResult } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";

export function ScenarioCompareTable({
  planAName,
  planBName,
  planA,
  planB,
  country = "US",
}: {
  planAName: string;
  planBName: string;
  planA: StrategyResult;
  planB: StrategyResult;
  country?: CountryCode;
}) {
  const isCA = country === "CA";
  const taxFreeLabel = isCA ? "TFSA left at the end" : "Roth left at the end";
  const taxFreeA = formatCurrency(
    planA.summary.endingTaxFreeBalance ?? planA.summary.endingRothBalance,
  );
  const taxFreeB = formatCurrency(
    planB.summary.endingTaxFreeBalance ?? planB.summary.endingRothBalance,
  );

  const rows = [
    {
      label: "Money lasts until",
      a: planA.summary.moneyLastsUntilAge
        ? `Age ${planA.summary.moneyLastsUntilAge}`
        : "Through the plan",
      b: planB.summary.moneyLastsUntilAge
        ? `Age ${planB.summary.moneyLastsUntilAge}`
        : "Through the plan",
    },
    {
      label: "Lifetime taxes (approx.)",
      a: formatCurrency(planA.summary.totalTaxes),
      b: formatCurrency(planB.summary.totalTaxes),
    },
    {
      label: taxFreeLabel,
      a: taxFreeA,
      b: taxFreeB,
    },
    {
      label: "Wealth at age 65",
      a: formatCurrency(planA.summary.netWorthAt65),
      b: formatCurrency(planB.summary.netWorthAt65),
    },
    isCA
      ? {
          label: "OAS clawback years",
          a: String(planA.summary.oasClawbackYears ?? 0),
          b: String(planB.summary.oasClawbackYears ?? 0),
        }
      : {
          label: "Healthcare subsidy lost?",
          a: planA.summary.acaSubsidyLost ? "Yes" : "No",
          b: planB.summary.acaSubsidyLost ? "Yes" : "No",
        },
  ];

  return (
    <section className="surface-card p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
        Side-by-side
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold">
        {planAName} vs {planBName}
      </h2>
      <p className="mt-2 text-base text-ink-soft">
        Same person — different choices.
      </p>
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-2 rounded-2xl bg-mist/60 px-4 py-4 sm:grid-cols-[1.2fr_1fr_1fr]"
          >
            <p className="text-base font-semibold text-ink-soft">{row.label}</p>
            <p className="text-lg font-semibold">{row.a}</p>
            <p className="text-lg font-semibold text-accent-deep">{row.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
