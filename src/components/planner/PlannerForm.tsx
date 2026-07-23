"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { NumericInput } from "@/components/ui/NumericInput";
import { DEMO_PROFILE, withScenarioDefaults } from "@/lib/demo";
import type { FilingStatus, RetirementProfile } from "@/lib/engine";
import { emptyAccounts } from "@/lib/engine/types";
import { formatCurrency } from "@/lib/format";
import {
  createScenario,
  presetScenarios,
  saveActiveScenarioId,
  saveScenarios,
} from "@/lib/scenarios";
import { saveProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const STEPS = ["You", "Accounts", "Income", "Review"] as const;

const emptyProfile: RetirementProfile = withScenarioDefaults({
  currentAge: 55,
  retirementAge: 55,
  planningUntilAge: 90,
  annualSpendingNeed: 72000,
  filingStatus: "single",
  leftEmployerAtAge: 55,
  socialSecurityClaimAge: 67,
  socialSecurityAnnualAtClaimAge: 30000,
  pensionStartAge: 55,
  pensionAnnual: 0,
  accounts: emptyAccounts(),
});

export function PlannerForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<RetirementProfile>(emptyProfile);

  const totalAssets = useMemo(
    () =>
      Object.values(profile.accounts).reduce((s, v) => s + (Number(v) || 0), 0),
    [profile.accounts],
  );

  function update<K extends keyof RetirementProfile>(
    key: K,
    value: RetirementProfile[K],
  ) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function run() {
    const normalized = withScenarioDefaults(profile);
    saveProfile(normalized);
    const presets = presetScenarios(normalized);
    const base = createScenario("Base Plan", normalized);
    const workspace = [base, ...presets.slice(1)];
    saveScenarios(workspace);
    saveActiveScenarioId(base.id);
    router.push("/results");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {STEPS[step]}
          </h1>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white/80 px-3 py-2 text-xs font-semibold text-accent"
          onClick={() => {
            setProfile(DEMO_PROFILE);
            saveProfile(DEMO_PROFILE);
            router.push("/results?demo=1");
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Load demo
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                i <= step ? "bg-accent" : "bg-line",
              )}
            />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-line/80 bg-white/75 p-6 shadow-[0_20px_60px_rgba(12,31,26,0.06)] backdrop-blur sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="grid gap-5 sm:grid-cols-2"
          >
            {step === 0 && (
              <>
                <NumericInput
                  label="Current age"
                  mode="integer"
                  value={profile.currentAge}
                  placeholder="55"
                  onChange={(n) => update("currentAge", n ?? 55)}
                />
                <NumericInput
                  label="Retirement age"
                  hint="When withdrawals begin"
                  mode="integer"
                  value={profile.retirementAge}
                  placeholder="55"
                  onChange={(n) => update("retirementAge", n ?? 55)}
                />
                <NumericInput
                  label="Plan until age"
                  mode="integer"
                  value={profile.planningUntilAge}
                  placeholder="90"
                  onChange={(n) => update("planningUntilAge", n ?? 90)}
                />
                <NumericInput
                  label="Annual spending need"
                  hint="Today's dollars; inflated in the engine"
                  mode="money"
                  prefix="$"
                  emptyWhenZero
                  value={
                    profile.annualSpendingNeed > 0
                      ? profile.annualSpendingNeed
                      : null
                  }
                  placeholder="72,000"
                  onChange={(n) => update("annualSpendingNeed", n ?? 0)}
                />
                <label className="block">
                  <span className="text-base font-semibold text-ink">
                    Filing status
                  </span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-lg outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
                    value={profile.filingStatus}
                    onChange={(e) =>
                      update("filingStatus", e.target.value as FilingStatus)
                    }
                  >
                    <option value="single">Single</option>
                    <option value="married_filing_jointly">
                      Married filing jointly
                    </option>
                  </select>
                </label>
                <NumericInput
                  label="Left employer at age"
                  hint="Used for Rule of 55 on your 401(k)"
                  mode="integer"
                  value={profile.leftEmployerAtAge}
                  placeholder="55"
                  onChange={(n) => update("leftEmployerAtAge", n ?? 55)}
                />
              </>
            )}

            {step === 1 && (
              <>
                {(
                  [
                    ["cash", "Cash"],
                    ["brokerage", "Taxable brokerage"],
                    ["traditional_401k", "Traditional 401(k)"],
                    ["traditional_ira", "Traditional IRA"],
                    ["roth_ira", "Roth IRA"],
                  ] as const
                ).map(([key, label]) => (
                  <NumericInput
                    key={key}
                    label={label}
                    mode="money"
                    prefix="$"
                    emptyWhenZero
                    value={
                      profile.accounts[key] > 0 ? profile.accounts[key] : null
                    }
                    placeholder="0"
                    onChange={(n) =>
                      setProfile((p) => ({
                        ...p,
                        accounts: { ...p.accounts, [key]: n ?? 0 },
                      }))
                    }
                  />
                ))}
                <div className="sm:col-span-2 rounded-2xl bg-mist/80 px-4 py-3 text-sm text-ink-soft">
                  Total investable / cash balances:{" "}
                  <span className="font-semibold text-ink">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <NumericInput
                  label="Social Security claim age"
                  mode="integer"
                  value={profile.socialSecurityClaimAge}
                  placeholder="67"
                  onChange={(n) => update("socialSecurityClaimAge", n ?? 67)}
                />
                <NumericInput
                  label="Annual Social Security at claim"
                  mode="money"
                  prefix="$"
                  emptyWhenZero
                  value={
                    profile.socialSecurityAnnualAtClaimAge > 0
                      ? profile.socialSecurityAnnualAtClaimAge
                      : null
                  }
                  placeholder="30,000"
                  onChange={(n) =>
                    update("socialSecurityAnnualAtClaimAge", n ?? 0)
                  }
                />
                <NumericInput
                  label="Pension start age"
                  mode="integer"
                  value={profile.pensionStartAge}
                  placeholder="60"
                  onChange={(n) => update("pensionStartAge", n ?? 60)}
                />
                <NumericInput
                  label="Annual pension income"
                  hint="Leave blank if none"
                  mode="money"
                  prefix="$"
                  emptyWhenZero
                  value={
                    profile.pensionAnnual > 0 ? profile.pensionAnnual : null
                  }
                  placeholder="0"
                  onChange={(n) => update("pensionAnnual", n ?? 0)}
                />
              </>
            )}

            {step === 3 && (
              <div className="sm:col-span-2 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      "Age",
                      `${profile.currentAge} → plan to ${profile.planningUntilAge}`,
                    ],
                    [
                      "Spending",
                      formatCurrency(profile.annualSpendingNeed) + "/yr",
                    ],
                    ["Accounts", formatCurrency(totalAssets)],
                    [
                      "Pension + SS",
                      `${formatCurrency(profile.pensionAnnual)} · SS @ ${profile.socialSecurityClaimAge}`,
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-2xl border border-line bg-paper/80 px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-ink-soft">
                        {k}
                      </p>
                      <p className="mt-1 font-semibold text-ink">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          {step === 0 ? (
            <ButtonLink href="/" variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Back
            </ButtonLink>
          ) : (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={run}>
              Run withdrawal strategy
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
