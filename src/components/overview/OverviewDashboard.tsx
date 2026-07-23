"use client";

import type { AppSection } from "@/components/ui/AppShell";
import { getCountryConfig } from "@/lib/country";
import type { ComparisonResult, YearPlan } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_LABELS, STATUS_META } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Sparkles,
} from "lucide-react";

function healthCopy(result: ComparisonResult) {
  const opt = result.optimized.summary;
  const penalties = opt.totalPenalties;
  const acaLost = opt.acaSubsidyLost;
  const oasHit = (opt.oasClawbackYears ?? 0) > 0;
  const lasts = opt.moneyLastsUntilAge ?? result.profile.planningUntilAge;
  const isCA = result.profile.country === "CA";

  if (
    penalties > 0 ||
    (!isCA && acaLost && lasts < result.profile.planningUntilAge - 5) ||
    (isCA && oasHit && lasts < result.profile.planningUntilAge - 5)
  ) {
    return {
      tone: "caution" as const,
      title: "Needs attention",
      subtitle:
        "Your plan works, but a few choices could quietly cost you money.",
    };
  }
  if (
    lasts >= result.profile.planningUntilAge - 2 &&
    (isCA ? !oasHit : !acaLost)
  ) {
    return {
      tone: "good" as const,
      title: "You’re on track",
      subtitle:
        "With this withdrawal order, your money is positioned to last and avoid expensive mistakes.",
    };
  }
  return {
    tone: "ok" as const,
    title: "Mostly on track",
    subtitle:
      "The plan funds retirement. A few tweaks could make it safer and cheaper.",
  };
}

export function OverviewDashboard({
  result,
  year,
  onGo,
}: {
  result: ComparisonResult;
  year: YearPlan;
  onGo: (section: AppSection) => void;
}) {
  const health = healthCopy(result);
  const opt = result.optimized.summary;
  const lastsAge = opt.moneyLastsUntilAge ?? result.profile.planningUntilAge;
  const config = getCountryConfig(result.profile.country);
  const isCA = result.profile.country === "CA";
  const critical = result.optimized.years
    .flatMap((y) =>
      y.warnings
        .filter((w) => w.severity === "critical")
        .map((w) => ({ age: y.age, ...w })),
    )
    .slice(0, 3);
  const savings = result.deltas.preMedicareDragSavings;

  const trackWhy = isCA
    ? "Based on taxes, OAS clawback risk, and whether spending is funded."
    : "Based on taxes, penalties, healthcare subsidies, and whether spending is funded.";

  const orderWhy = isCA
    ? "Compared with taking money from your RRSP first."
    : "Compared with taking money from retirement accounts first.";

  const noMistakesBody = isCA
    ? "The recommended order protects TFSA flexibility and watches OAS clawback where possible."
    : "The recommended order avoids early penalties and protects healthcare help where possible.";

  const tip = isCA
    ? "Tip: open Timeline to walk year by year, or Explore to try retiring earlier / delaying CPP."
    : "Tip: open Timeline to walk year by year, or Explore to try retiring earlier / delaying Social Security.";

  const conversionLabel =
    (year.rothConversion ?? 0) > 0
      ? isCA
        ? `Plan RRSP → RRIF around age ${result.profile.rrifConversionAge}`
        : `Convert about ${formatCurrency(year.rothConversion ?? 0)} to Roth`
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card overflow-hidden p-6 sm:p-10"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Retirement health · {config.flag} {config.name}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {health.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {health.subtitle}
            </p>
          </div>
          <div
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              health.tone === "good" && "bg-accent-soft text-accent-deep",
              health.tone === "ok" && "bg-warn-soft text-warn",
              health.tone === "caution" && "bg-danger-soft text-danger",
            )}
          >
            {health.tone === "good"
              ? "Healthy"
              : health.tone === "ok"
                ? "Review"
                : "Action needed"}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <InsightTile
            icon={HeartPulse}
            question="Am I on track?"
            answer={health.title}
            why={trackWhy}
          />
          <InsightTile
            icon={Clock3}
            question="How long will my money last?"
            answer={`Until about age ${lastsAge}`}
            why={`Your plan looks ahead to age ${result.profile.planningUntilAge}.`}
          />
          <InsightTile
            icon={Sparkles}
            question="Is a better order worth it?"
            answer={
              savings > 0
                ? `Yes — about ${formatCurrency(savings)} less drag before 65`
                : "Your order is already efficient"
            }
            why={orderWhy}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isCA ? (
            <>
              <MiniFact
                label="CPP"
                value={`Starts age ${result.profile.cppClaimAge}`}
              />
              <MiniFact
                label="OAS"
                value={`Age ${result.profile.oasStartAge}`}
              />
              <MiniFact
                label="RRIF timeline"
                value={`Convert by ${result.profile.rrifConversionAge}`}
              />
              <MiniFact
                label="OAS clawback years"
                value={
                  (opt.oasClawbackYears ?? 0) > 0
                    ? `${opt.oasClawbackYears} flagged`
                    : "None flagged"
                }
              />
            </>
          ) : (
            <>
              <MiniFact
                label="Social Security"
                value={`Starts age ${result.profile.socialSecurityClaimAge}`}
              />
              <MiniFact label="Medicare" value="Age 65" />
              <MiniFact label="ACA thresholds" value="Tracked pre-65" />
              <MiniFact label="RMD timeline" value="Age 73" />
            </>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="surface-card p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              This year
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              What should I do at age {year.age}?
            </h2>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold",
              STATUS_META[year.status].className,
            )}
          >
            {STATUS_META[year.status].label}
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.35rem] bg-mist/70 p-6">
            <p className="text-sm text-ink-soft">Take money from</p>
            <p className="mt-2 font-display text-4xl font-semibold">
              {ACCOUNT_LABELS[year.primarySource]}
            </p>
            <p className="mt-2 text-2xl font-semibold text-accent-deep">
              {formatCurrency(year.recommendation.amount)}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {year.recommendation.reasons[0] ?? year.explanation}
            </p>
            <button
              type="button"
              onClick={() => onGo("timeline")}
              className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-accent"
            >
              See the full year-by-year plan
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <MiniFact
              label="Why this matters"
              value={
                year.recommendation.estimatedBenefit.lifetimeBenefit > 0
                  ? `Could be worth about ${formatCurrency(year.recommendation.estimatedBenefit.lifetimeBenefit)} over time`
                  : STATUS_META[year.status].hint
              }
            />
            <MiniFact
              label="Taxes this year"
              value={`${formatCurrency(year.federalTax + year.stateTax)} total`}
            />
            <MiniFact
              label="Money left after this year"
              value={formatCurrency(year.endingNetWorth)}
            />
            {conversionLabel ? (
              <MiniFact label="Optional extra move" value={conversionLabel} />
            ) : null}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface-card p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          {critical.length === 0 ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-warn" />
          )}
          <div>
            <h2 className="font-display text-3xl font-semibold">
              {critical.length === 0
                ? "No costly mistakes spotted"
                : "Things that could get expensive"}
            </h2>
            <p className="mt-1 text-base text-ink-soft">
              {critical.length === 0
                ? noMistakesBody
                : "Fix these first — they usually cost more than small investment tweaks."}
            </p>
          </div>
        </div>

        {critical.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {critical.map((item, i) => (
              <li
                key={`${item.code}-${item.age}-${i}`}
                className="rounded-2xl border border-danger/15 bg-danger-soft/70 px-5 py-4"
              >
                <p className="text-base font-semibold text-ink">
                  Age {item.age}
                </p>
                <p className="mt-1 text-base text-ink-soft">{item.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl bg-accent-soft/60 px-5 py-4 text-base text-accent-deep">
            {tip}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onGo("timeline")}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 text-base font-semibold text-white"
          >
            Review timeline
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onGo("adjust")}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-semibold"
          >
            Explore what-ifs
          </button>
        </div>
      </motion.section>
    </div>
  );
}

function InsightTile({
  icon: Icon,
  question,
  answer,
  why,
}: {
  icon: typeof HeartPulse;
  question: string;
  answer: string;
  why: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-line/80 bg-white/80 p-5">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-sm font-medium text-ink-soft">{question}</p>
      <p className="mt-2 font-display text-2xl font-semibold leading-snug">
        {answer}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{why}</p>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-white/80 px-4 py-3">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-snug">{value}</p>
    </div>
  );
}
