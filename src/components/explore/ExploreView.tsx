"use client";

import { InsightCharts } from "@/components/explore/InsightCharts";
import { PlanChat } from "@/components/results/PlanChat";
import { ScenarioCompareTable } from "@/components/results/ScenarioCompareTable";
import { getCountryConfig } from "@/lib/country";
import type { ComparisonResult, RetirementProfile, StrategyResult } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import type { SavedScenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

function SliderRow({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block rounded-2xl bg-mist/60 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-ink">{label}</span>
        <span className="text-base font-semibold text-accent-deep">
          {valueLabel}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

export function ExploreView({
  profile,
  result,
  scenarios,
  activeId,
  compareId,
  compareResult,
  compareName,
  onChangeProfile,
  onSelectScenario,
  onCompareScenario,
}: {
  profile: RetirementProfile;
  result: ComparisonResult;
  scenarios: SavedScenario[];
  activeId: string;
  compareId: string | null;
  compareResult: StrategyResult | null;
  compareName: string | null;
  onChangeProfile: (patch: Partial<RetirementProfile>) => void;
  onSelectScenario: (id: string) => void;
  onCompareScenario: (id: string | null) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const activeName =
    scenarios.find((s) => s.id === activeId)?.name ?? "Current plan";
  const config = getCountryConfig(profile.country);
  const isCA = profile.country === "CA";
  const pensionAge = isCA ? profile.cppClaimAge : profile.socialSecurityClaimAge;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Explore
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold">
              What if things change?
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-soft">
              Move a slider. Your timeline and charts update instantly. No
              Calculate button.
            </p>
          </div>
          <SlidersHorizontal className="h-6 w-6 text-accent" />
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectScenario(s.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition",
                s.id === activeId
                  ? "bg-ink text-white"
                  : "bg-mist text-ink-soft hover:text-ink",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-3">
          <SliderRow
            label="When do I retire?"
            valueLabel={`Age ${profile.retirementAge}`}
            value={profile.retirementAge}
            min={50}
            max={70}
            step={1}
            onChange={(retirementAge) =>
              onChangeProfile({
                retirementAge,
                currentAge: Math.min(profile.currentAge, retirementAge),
              })
            }
          />
          <SliderRow
            label="How much do I spend each year?"
            valueLabel={formatCurrency(profile.annualSpendingNeed)}
            value={profile.annualSpendingNeed}
            min={40_000}
            max={250_000}
            step={1_000}
            onChange={(annualSpendingNeed) =>
              onChangeProfile({ annualSpendingNeed })
            }
          />
          <SliderRow
            label={`When do I start ${config.publicPensionLabel}?`}
            valueLabel={`Age ${pensionAge}`}
            value={pensionAge}
            min={config.publicPensionMinAge}
            max={config.publicPensionMaxAge}
            step={1}
            onChange={(age) =>
              onChangeProfile(
                isCA
                  ? { cppClaimAge: age }
                  : { socialSecurityClaimAge: age },
              )
            }
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-5 text-base font-semibold text-accent"
        >
          {showAdvanced ? "Hide more options" : "Show more options"}
        </button>

        <AnimatePresence>
          {showAdvanced ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-3">
                <SliderRow
                  label="Investment growth"
                  valueLabel={`${(profile.investmentReturn * 100).toFixed(1)}%`}
                  value={Math.round(profile.investmentReturn * 1000) / 10}
                  min={2}
                  max={10}
                  step={0.1}
                  onChange={(v) =>
                    onChangeProfile({ investmentReturn: v / 100 })
                  }
                />
                <SliderRow
                  label="Inflation"
                  valueLabel={`${(profile.inflationRate * 100).toFixed(1)}%`}
                  value={Math.round(profile.inflationRate * 1000) / 10}
                  min={1}
                  max={8}
                  step={0.1}
                  onChange={(v) => onChangeProfile({ inflationRate: v / 100 })}
                />
                <SliderRow
                  label="Part-time income"
                  valueLabel={formatCurrency(profile.partTimeIncome)}
                  value={profile.partTimeIncome}
                  min={0}
                  max={100_000}
                  step={1_000}
                  onChange={(partTimeIncome) =>
                    onChangeProfile({ partTimeIncome })
                  }
                />
                <div className="flex flex-wrap gap-2 pt-2">
                  <p className="w-full text-sm font-semibold text-ink-soft">
                    Compare with another saved plan
                  </p>
                  {scenarios
                    .filter((s) => s.id !== activeId)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          onCompareScenario(compareId === s.id ? null : s.id)
                        }
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-semibold",
                          compareId === s.id
                            ? "bg-accent text-white"
                            : "bg-white border border-line",
                        )}
                      >
                        vs {s.name}
                      </button>
                    ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {compareResult && compareName ? (
        <ScenarioCompareTable
          planAName={activeName}
          planBName={compareName}
          planA={result.optimized}
          planB={compareResult}
          country={profile.country}
        />
      ) : null}

      <InsightCharts
        strategy={result.optimized}
        compareNaive={result.naive}
        country={profile.country}
      />

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-semibold">
              Have a question?
            </h2>
            <p className="mt-2 text-lg text-ink-soft">
              Ask in plain English. Answers use your live plan data via AI.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowChat((v) => !v)}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 text-base font-semibold text-white"
          >
            <MessageCircle className="h-5 w-5" />
            {showChat ? "Hide chat" : "Ask Deccum"}
          </button>
        </div>
        <AnimatePresence>
          {showChat ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-6"
            >
              <PlanChat profile={profile} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </div>
  );
}
