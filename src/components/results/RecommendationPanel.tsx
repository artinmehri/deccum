"use client";

import type { YearPlan } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import { motion } from "framer-motion";
import { Check, ShieldAlert } from "lucide-react";

export function RecommendationPanel({ year }: { year: YearPlan }) {
  const rec = year.recommendation;

  return (
    <motion.div
      key={`${year.age}-${rec.fromLabel}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Recommended move
        </p>
        <p className="mt-3 font-display text-3xl font-semibold leading-tight">
          {rec.actionLabel}
        </p>
        <p className="mt-4 text-2xl font-semibold text-accent-deep">
          {formatCurrency(rec.amount)}
        </p>
        <p className="mt-1 text-lg text-ink-soft">from {rec.fromLabel}</p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-soft">How sure is this?</span>
            <span className="font-semibold">{rec.confidence}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${rec.confidence}%` }}
            />
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-display text-2xl font-semibold">Why this helps</h3>
        <ul className="mt-4 space-y-3">
          {rec.reasons.map((reason) => (
            <li key={reason} className="flex gap-3 text-base leading-relaxed text-ink-soft">
              <Check className="mt-1 h-5 w-5 shrink-0 text-accent" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-display text-2xl font-semibold">What you may save</h3>
        <p className="mt-2 text-base text-ink-soft">
          Compared with taking the same amount from a traditional IRA
        </p>
        <div className="mt-5 space-y-3">
          <SaveRow
            label="Lower taxes"
            value={formatCurrency(rec.estimatedBenefit.federalTaxSaved)}
          />
          <SaveRow
            label="Healthcare help protected"
            value={formatCurrency(rec.estimatedBenefit.healthcareSaved)}
          />
          <SaveRow
            label="Long-term benefit"
            value={`+${formatCurrency(rec.estimatedBenefit.lifetimeBenefit)}`}
            emphasize
          />
        </div>
      </div>

      {rec.mistakeWarning ? (
        <div className="rounded-[1.5rem] border border-danger/20 bg-danger-soft p-6">
          <div className="flex items-center gap-2 text-danger">
            <ShieldAlert className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wide">
              If you ignore this
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold text-ink">
            {rec.mistakeWarning.title}
          </p>
          <ul className="mt-3 space-y-2 text-base text-ink-soft">
            {rec.mistakeWarning.will.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-4 text-base">
            Estimated cost{" "}
            <span className="font-semibold text-danger">
              {formatCurrency(rec.mistakeWarning.estimatedCost)}
            </span>
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}

function SaveRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-mist/70 px-4 py-3">
      <span className="text-base text-ink-soft">{label}</span>
      <span
        className={
          emphasize
            ? "font-display text-xl font-semibold text-accent-deep"
            : "text-lg font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}
