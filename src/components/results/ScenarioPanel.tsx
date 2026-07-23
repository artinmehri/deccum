"use client";

import { getCountryConfig } from "@/lib/country";
import type { OneTimeExpense, RetirementProfile } from "@/lib/engine";
import { formatCurrency } from "@/lib/format";
import type { SavedScenario } from "@/lib/scenarios";
import { cn } from "@/lib/utils";
import { Copy, Plus, Trash2 } from "lucide-react";

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink">{label}</span>
        <span className="text-xs font-semibold text-accent-deep">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </label>
  );
}

export function ScenarioPanel({
  profile,
  scenarios,
  activeId,
  compareId,
  onChangeProfile,
  onSelectScenario,
  onCompareScenario,
  onSaveAs,
  onDuplicate,
  onRename,
  onDelete,
}: {
  profile: RetirementProfile;
  scenarios: SavedScenario[];
  activeId: string;
  compareId: string | null;
  onChangeProfile: (patch: Partial<RetirementProfile>) => void;
  onSelectScenario: (id: string) => void;
  onCompareScenario: (id: string | null) => void;
  onSaveAs: () => void;
  onDuplicate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = getCountryConfig(profile.country);
  const isCA = profile.country === "CA";

  function addExpense(label: string, amount: number) {
    const expense: OneTimeExpense = {
      id: `exp_${Date.now()}`,
      age: profile.retirementAge + 1,
      label,
      amount,
    };
    onChangeProfile({
      oneTimeExpenses: [...profile.oneTimeExpenses, expense],
    });
  }

  return (
    <aside className="space-y-4 rounded-3xl border border-line/80 bg-white/80 p-4 shadow-[0_16px_40px_rgba(12,31,26,0.05)] lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Scenario engine
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold">Current plan</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Every change recalculates instantly — no calculate button.
        </p>
      </div>

      <div className="space-y-2">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className={cn(
              "rounded-xl border px-2.5 py-2",
              s.id === activeId
                ? "border-accent bg-accent-soft/50"
                : "border-line bg-paper/70",
            )}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 truncate text-left text-sm font-semibold"
                onClick={() => onSelectScenario(s.id)}
              >
                {s.name}
              </button>
              <button
                type="button"
                title="Compare"
                onClick={() =>
                  onCompareScenario(compareId === s.id ? null : s.id)
                }
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                  compareId === s.id
                    ? "bg-ink text-white"
                    : "bg-white text-ink-soft",
                )}
              >
                vs
              </button>
              {scenarios.length > 1 ? (
                <button type="button" onClick={() => onDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-ink-soft" />
                </button>
              ) : null}
            </div>
            {s.id === activeId ? (
              <input
                className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1 text-xs"
                value={s.name}
                onChange={(e) => onRename(s.id, e.target.value)}
              />
            ) : null}
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveAs}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-white px-2 py-2 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-white px-2 py-2 text-xs font-semibold"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
        </div>
      </div>

      <div className="space-y-4 border-t border-line pt-4">
        <SliderField
          label="Retirement age"
          value={profile.retirementAge}
          min={50}
          max={70}
          step={1}
          display={String(profile.retirementAge)}
          onChange={(retirementAge) =>
            onChangeProfile({
              retirementAge,
              currentAge: Math.min(profile.currentAge, retirementAge),
            })
          }
        />
        <SliderField
          label="Life expectancy"
          value={profile.planningUntilAge}
          min={75}
          max={100}
          step={1}
          display={String(profile.planningUntilAge)}
          onChange={(planningUntilAge) => onChangeProfile({ planningUntilAge })}
        />
        <SliderField
          label="Inflation"
          value={Math.round(profile.inflationRate * 1000) / 10}
          min={1}
          max={8}
          step={0.1}
          display={`${(profile.inflationRate * 100).toFixed(1)}%`}
          onChange={(v) => onChangeProfile({ inflationRate: v / 100 })}
        />
        <SliderField
          label="Investment return"
          value={Math.round(profile.investmentReturn * 1000) / 10}
          min={2}
          max={10}
          step={0.1}
          display={`${(profile.investmentReturn * 100).toFixed(1)}%`}
          onChange={(v) => onChangeProfile({ investmentReturn: v / 100 })}
        />
        {isCA ? (
          <SliderField
            label="CPP claim age"
            value={profile.cppClaimAge}
            min={config.publicPensionMinAge}
            max={config.publicPensionMaxAge}
            step={1}
            display={`Age ${profile.cppClaimAge}`}
            onChange={(cppClaimAge) => onChangeProfile({ cppClaimAge })}
          />
        ) : (
          <SliderField
            label="Social Security"
            value={profile.socialSecurityClaimAge}
            min={62}
            max={70}
            step={1}
            display={`Age ${profile.socialSecurityClaimAge}`}
            onChange={(socialSecurityClaimAge) =>
              onChangeProfile({ socialSecurityClaimAge })
            }
          />
        )}
        {isCA ? (
          <SliderField
            label="RRSP → RRIF age"
            value={profile.rrifConversionAge}
            min={65}
            max={71}
            step={1}
            display={`Age ${profile.rrifConversionAge}`}
            onChange={(rrifConversionAge) =>
              onChangeProfile({ rrifConversionAge })
            }
          />
        ) : null}
        <SliderField
          label="Pension start"
          value={profile.pensionStartAge}
          min={50}
          max={70}
          step={1}
          display={`Age ${profile.pensionStartAge}`}
          onChange={(pensionStartAge) => onChangeProfile({ pensionStartAge })}
        />
        <SliderField
          label="Annual spending"
          value={profile.annualSpendingNeed}
          min={40_000}
          max={250_000}
          step={1_000}
          display={formatCurrency(profile.annualSpendingNeed)}
          onChange={(annualSpendingNeed) =>
            onChangeProfile({ annualSpendingNeed })
          }
        />
        <SliderField
          label="Part-time income"
          value={profile.partTimeIncome}
          min={0}
          max={100_000}
          step={1_000}
          display={formatCurrency(profile.partTimeIncome)}
          onChange={(partTimeIncome) => onChangeProfile({ partTimeIncome })}
        />
        <SliderField
          label="Cash reserve"
          value={profile.cashReserve}
          min={0}
          max={200_000}
          step={5_000}
          display={formatCurrency(profile.cashReserve)}
          onChange={(cashReserve) => onChangeProfile({ cashReserve })}
        />
      </div>

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold text-ink">One-time expense</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["House", 250_000],
            ["Vacation", 25_000],
            ["Medical", 40_000],
            ["Inheritance", -100_000],
          ].map(([label, amount]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => addExpense(String(label), Number(amount))}
              className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-medium"
            >
              {label}
            </button>
          ))}
        </div>
        {profile.oneTimeExpenses.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-ink-soft">
            {profile.oneTimeExpenses.map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span>
                  Age {e.age}: {e.label}
                </span>
                <button
                  type="button"
                  className="font-semibold text-danger"
                  onClick={() =>
                    onChangeProfile({
                      oneTimeExpenses: profile.oneTimeExpenses.filter(
                        (x) => x.id !== e.id,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {isCA ? null : (
        <label className="flex items-center justify-between gap-3 border-t border-line pt-4 text-xs font-medium">
          <span>Execute Roth conversions in projection</span>
          <input
            type="checkbox"
            checked={profile.executeRothConversions}
            onChange={(e) =>
              onChangeProfile({ executeRothConversions: e.target.checked })
            }
          />
        </label>
      )}
    </aside>
  );
}
