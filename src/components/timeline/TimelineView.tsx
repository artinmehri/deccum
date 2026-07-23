"use client";

import { RecommendationPanel } from "@/components/results/RecommendationPanel";
import { getCountryConfig } from "@/lib/country";
import type { RetirementProfile, YearPlan } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_LABELS, STATUS_META } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  HeartPulse,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

export function TimelineView({
  years,
  selectedAge,
  onSelectAge,
  profile,
}: {
  years: YearPlan[];
  selectedAge: number;
  onSelectAge: (age: number) => void;
  profile: RetirementProfile;
}) {
  const year = years.find((y) => y.age === selectedAge) ?? years[0];
  const idx = years.findIndex((y) => y.age === year.age);
  const [showDetails, setShowDetails] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const config = getCountryConfig(profile.country);
  const isCA = profile.country === "CA";

  const markers = useMemo(() => {
    return config.milestones.map((m) => {
      let age = m.age;
      if (m.fromProfile === "socialSecurityClaimAge") {
        age = profile.socialSecurityClaimAge;
      } else if (m.fromProfile === "cppClaimAge") {
        age = profile.cppClaimAge;
      } else if (m.fromProfile === "rrifConversionAge") {
        age = profile.rrifConversionAge;
      } else if (m.id === "now") {
        age = years[0]?.age ?? null;
      }
      return { label: m.label, age: age ?? undefined };
    });
  }, [config.milestones, profile, years]);

  const withdrawMain = year.withdrawals
    .filter((w) => w.account !== "shortfall" && w.amount > 0)
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Your plan by year
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold">
              Age {year.age}
              <span className="ml-2 text-2xl font-medium text-ink-soft">
                · {year.calendarYear}
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-lg text-ink-soft">
              Glance left to right. Tap any year. We’ll tell you what to do in
              plain English.
            </p>
          </div>
          <div className="flex gap-2">
            <IconNav
              label="Previous year"
              onClick={() => idx > 0 && onSelectAge(years[idx - 1].age)}
              disabled={idx <= 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </IconNav>
            <IconNav
              label="Next year"
              onClick={() =>
                idx < years.length - 1 && onSelectAge(years[idx + 1].age)
              }
              disabled={idx >= years.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </IconNav>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {markers.map((m) => (
            <button
              key={m.label}
              type="button"
              disabled={m.age == null}
              onClick={() => {
                if (m.age == null) return;
                const match =
                  years.find((y) => y.age === m.age) ??
                  years.find((y) => y.age >= m.age!);
                if (match) onSelectAge(match.age);
              }}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-accent/40 hover:text-ink"
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Scrubber */}
        <div className="mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2">
            {years.map((y) => {
              const active = y.age === year.age;
              const meta = STATUS_META[y.status];
              return (
                <button
                  key={y.age}
                  type="button"
                  onClick={() => onSelectAge(y.age)}
                  className={cn(
                    "w-[4.5rem] rounded-2xl border px-2 py-3 text-center transition",
                    active
                      ? "border-accent bg-accent-soft shadow-sm"
                      : "border-transparent bg-mist/80 hover:bg-white",
                  )}
                >
                  <span className="block text-lg font-semibold">{y.age}</span>
                  <span
                    className={cn(
                      "mx-auto mt-2 block h-2 w-2 rounded-full",
                      meta.dot,
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          key={year.age}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold",
                STATUS_META[year.status].className,
              )}
            >
              {STATUS_META[year.status].label}
            </span>
            <p className="text-base text-ink-soft">
              {STATUS_META[year.status].hint}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <FactCard
              icon={Wallet}
              title="Spend from"
              value={ACCOUNT_LABELS[year.primarySource]}
              detail={withdrawMain
                .map(
                  (w) =>
                    `${formatCurrency(w.amount)} · ${ACCOUNT_LABELS[w.account]}`,
                )
                .join(" · ")}
            />
            <FactCard
              icon={CircleDollarSign}
              title="Taxes this year"
              value={formatCurrency(year.federalTax + year.stateTax)}
              detail={
                year.penalties > 0
                  ? `Plus ${formatCurrency(year.penalties)} penalty`
                  : "No early-withdrawal penalty"
              }
            />
            <FactCard
              icon={HeartPulse}
              title={isCA ? "Benefits checkpoint" : "Healthcare"}
              value={
                isCA
                  ? year.age >= 65
                    ? "OAS / age 65+"
                    : "Pre-65"
                  : year.age >= 65
                    ? "Medicare"
                    : year.acaLabel
              }
              detail={
                isCA
                  ? year.age >= 65
                    ? "Watch OAS clawback as income rises"
                    : "CPP and OAS timing still ahead"
                  : year.age >= 65
                    ? "Medicare usually starts at 65"
                    : year.acaEligible
                      ? "Income stays in a helpful range"
                      : "Income may reduce subsidies"
              }
            />
            <FactCard
              icon={PiggyBank}
              title="Money left"
              value={formatCurrency(year.endingNetWorth)}
              detail={
                (year.rothConversion ?? 0) > 0
                  ? isCA
                    ? `Also consider moving ${formatCurrency(year.rothConversion ?? 0)} toward RRIF timing`
                    : `Also consider converting ${formatCurrency(year.rothConversion ?? 0)} to Roth`
                  : "After this year’s withdrawals"
              }
            />
          </div>

          <div className="mt-8 rounded-[1.35rem] bg-mist/70 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
              In one sentence
            </p>
            <p className="mt-2 text-xl leading-relaxed text-ink">
              {year.explanation}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="min-h-12 rounded-2xl bg-accent px-5 text-base font-semibold text-white"
            >
              {showWhy ? "Hide recommendation details" : "Why this recommendation?"}
            </button>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="min-h-12 rounded-2xl border border-line bg-white px-5 text-base font-semibold"
            >
              {showDetails ? "Hide account details" : "Show account details"}
            </button>
          </div>

          <AnimatePresence>
            {showDetails ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <DetailBlock title="Starting balances">
                    <BalanceRows
                      balances={year.startingBalances}
                      country={profile.country}
                    />
                  </DetailBlock>
                  <DetailBlock title="Ending balances">
                    <BalanceRows
                      balances={year.endingBalances}
                      country={profile.country}
                    />
                  </DetailBlock>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {showWhy ? (
            <motion.div
              key="why"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
            >
              <RecommendationPanel year={year} />
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="surface-card flex flex-col justify-between p-6 sm:p-8"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
                  Need more certainty?
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold">
                  We’ll explain the “why”
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                  See how much this choice may save, what goes wrong if you
                  ignore it, and a safer alternative — only when you ask.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWhy(true)}
                className="mt-8 min-h-12 rounded-2xl bg-accent-soft px-5 text-base font-semibold text-accent-deep"
              >
                Explain this year
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function FactCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Wallet;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-line/80 bg-white/90 p-5">
      <div className="flex items-center gap-2 text-ink-soft">
        <Icon className="h-5 w-5 text-accent" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold leading-snug">
        {value}
      </p>
      <p className="mt-2 text-base leading-relaxed text-ink-soft">{detail}</p>
    </div>
  );
}

function IconNav({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white text-ink transition hover:border-accent/40 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-mist/70 p-4">
      <p className="text-sm font-semibold text-ink-soft">{title}</p>
      <div className="mt-2 space-y-1 text-base">{children}</div>
    </div>
  );
}

function BalanceRows({
  balances,
  country,
}: {
  balances: YearPlan["endingBalances"];
  country: RetirementProfile["country"];
}) {
  const rows =
    country === "CA"
      ? ([
          ["tfsa", "TFSA"],
          ["rrsp", "RRSP"],
          ["rrif", "RRIF"],
          ["non_registered", "Non-registered"],
          ["lira", "LIRA"],
          ["cash", "Cash"],
        ] as const)
      : ([
          ["traditional_401k", "401(k)"],
          ["traditional_ira", "IRA"],
          ["roth_ira", "Roth"],
          ["brokerage", "Brokerage"],
          ["cash", "Cash"],
        ] as const);

  return (
    <>
      {rows.map(([key, label]) => (
        <p key={key} className="flex justify-between gap-3">
          <span>{label}</span>
          <span className="font-semibold">{formatCurrency(balances[key])}</span>
        </p>
      ))}
    </>
  );
}
