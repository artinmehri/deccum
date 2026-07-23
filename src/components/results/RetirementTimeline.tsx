"use client";

import { YearStatusBadge } from "@/components/results/YearStatusBadge";
import type { YearPlan } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
} from "lucide-react";

export function RetirementTimeline({
  years,
  selectedAge,
  onSelectAge,
  ssAge,
}: {
  years: YearPlan[];
  selectedAge: number;
  onSelectAge: (age: number) => void;
  ssAge: number;
}) {
  const selected =
    years.find((y) => y.age === selectedAge) ?? years[0];
  const idx = years.findIndex((y) => y.age === selected.age);

  function jump(target: number | undefined) {
    if (target == null) return;
    const match = years.find((y) => y.age === target) ?? years.find((y) => y.age >= target);
    if (match) onSelectAge(match.age);
  }

  return (
    <div className="rounded-3xl border border-line/80 bg-white/80 p-4 shadow-[0_16px_40px_rgba(12,31,26,0.05)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Retirement timeline
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Exact action plan by year
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <NavBtn
            onClick={() => idx > 0 && onSelectAge(years[idx - 1].age)}
            disabled={idx <= 0}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </NavBtn>
          <NavBtn
            onClick={() =>
              idx < years.length - 1 && onSelectAge(years[idx + 1].age)
            }
            disabled={idx >= years.length - 1}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </NavBtn>
          <NavBtn onClick={() => jump(65)}>Jump to 65</NavBtn>
          <NavBtn onClick={() => jump(ssAge)}>Social Security</NavBtn>
          <NavBtn onClick={() => jump(73)}>RMD</NavBtn>
          <NavBtn onClick={() => jump(65)}>
            <Crosshair className="h-3.5 w-3.5" />
            Medicare
          </NavBtn>
        </div>
      </div>

      <div className="mt-5 max-h-[640px] space-y-3 overflow-y-auto pr-1">
        {years.map((year) => {
          const open = year.age === selectedAge;
          const withdrawLines = year.withdrawals.filter(
            (w) => w.amount > 0 && w.account !== "shortfall",
          );
          return (
            <div
              key={year.age}
              className={cn(
                "rounded-2xl border transition",
                open
                  ? "border-accent bg-accent-soft/30"
                  : "border-line/70 bg-white/70 hover:border-accent/30",
              )}
            >
              <button
                type="button"
                className="w-full px-4 py-3 text-left"
                onClick={() => onSelectAge(year.age)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-xl font-semibold">
                      Age {year.age}{" "}
                      <span className="text-base font-medium text-ink-soft">
                        ({year.calendarYear})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <YearStatusBadge status={year.status} />
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-ink-soft transition",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <Block title="Withdraw">
                    {withdrawLines.length === 0 ? (
                      <p className="text-ink-soft">No account withdrawal</p>
                    ) : (
                      withdrawLines.slice(0, 3).map((w, i) => (
                        <p key={`${w.account}-${i}`}>
                          ✓ {formatCurrency(w.amount)}{" "}
                          {ACCOUNT_LABELS[w.account]}
                        </p>
                      ))
                    )}
                  </Block>
                  <Block title="Convert">
                    {year.conversions.length === 0 && !year.rothConversion ? (
                      <p className="text-ink-soft">No conversion</p>
                    ) : (
                      (year.conversions.length
                        ? year.conversions
                        : [
                            {
                              amount: year.rothConversion ?? 0,
                              from: "traditional_ira" as const,
                            },
                          ]
                      ).map((c, i) => (
                        <p key={i}>
                          ✓ {formatCurrency(c.amount)} Traditional → Roth
                        </p>
                      ))
                    )}
                  </Block>
                  <Block title="Income">
                    <p>
                      Employment:{" "}
                      {formatCurrency(
                        year.incomeStreams.find((s) => s.source === "employment")
                          ?.amount ?? 0,
                      )}
                    </p>
                    <p>
                      Pension:{" "}
                      {formatCurrency(
                        year.incomeStreams.find((s) => s.source === "pension")
                          ?.amount ?? 0,
                      )}
                    </p>
                    <p>
                      Social Security:{" "}
                      {formatCurrency(
                        year.incomeStreams.find(
                          (s) => s.source === "social_security",
                        )?.amount ?? 0,
                      )}
                    </p>
                  </Block>
                  <Block title="Taxes">
                    <p>Federal: {formatCurrency(year.federalTax)}</p>
                    <p>State: {formatCurrency(year.stateTax)}</p>
                    {year.penalties > 0 ? (
                      <p className="text-danger">
                        Penalty: {formatCurrency(year.penalties)}
                      </p>
                    ) : null}
                  </Block>
                  <Block title="ACA">
                    <p>
                      {year.acaEligible || year.age >= 65 ? "✓" : "✗"}{" "}
                      {year.acaLabel}
                    </p>
                  </Block>
                  <Block title="Ending net worth">
                    <p className="font-semibold">
                      {formatCurrency(year.endingNetWorth)}
                    </p>
                  </Block>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-accent/20"
                  >
                    <div className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-2">
                      <DetailCard title="Starting balances">
                        <BalanceList balances={year.startingBalances} />
                      </DetailCard>
                      <DetailCard title="Ending balances">
                        <BalanceList balances={year.endingBalances} />
                      </DetailCard>
                      <DetailCard title="Withdrawals">
                        {withdrawLines.map((w, i) => (
                          <p key={`${w.account}-d-${i}`}>
                            {ACCOUNT_LABELS[w.account]}:{" "}
                            {formatCurrency(w.amount)}
                          </p>
                        ))}
                      </DetailCard>
                      <DetailCard title="Conversions">
                        {year.conversions.length === 0 ? (
                          <p className="text-ink-soft">
                            {year.rothConversion
                              ? `Suggested ${formatCurrency(year.rothConversion)} (not executed)`
                              : "None"}
                          </p>
                        ) : (
                          year.conversions.map((c, i) => (
                            <p key={i}>
                              {ACCOUNT_LABELS[c.from]} → Roth:{" "}
                              {formatCurrency(c.amount)}
                            </p>
                          ))
                        )}
                      </DetailCard>
                      <DetailCard title="Capital gains">
                        <p>{formatCurrency(year.capitalGains)}</p>
                      </DetailCard>
                      <DetailCard title="Tax brackets">
                        <p>
                          Marginal ordinary:{" "}
                          {Math.round(year.taxBracket * 100)}%
                        </p>
                        <p>MAGI (approx): {formatCurrency(year.magi)}</p>
                      </DetailCard>
                      <DetailCard title="Healthcare subsidies">
                        <p>{year.acaLabel}</p>
                      </DetailCard>
                      <DetailCard title="Required minimum distribution">
                        <p>
                          {year.rmd > 0
                            ? formatCurrency(year.rmd)
                            : "Not yet required"}
                        </p>
                      </DetailCard>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink-soft transition hover:border-accent/40 hover:text-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        {title}
      </p>
      <div className="mt-1 space-y-0.5 text-ink">{children}</div>
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/80 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        {title}
      </p>
      <div className="mt-1.5 space-y-0.5 text-ink">{children}</div>
    </div>
  );
}

function BalanceList({
  balances,
}: {
  balances: YearPlan["endingBalances"];
}) {
  return (
    <>
      {(
        [
          ["traditional_401k", "401(k)"],
          ["traditional_ira", "IRA"],
          ["roth_ira", "Roth"],
          ["brokerage", "Brokerage"],
          ["cash", "Cash"],
        ] as const
      ).map(([key, label]) => (
        <p key={key}>
          {label}: {formatCurrency(balances[key])}
        </p>
      ))}
    </>
  );
}
