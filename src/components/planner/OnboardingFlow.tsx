"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { MarketingHeader } from "@/components/ui/AppShell";
import { NumericInput } from "@/components/ui/NumericInput";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { getCountryConfig } from "@/lib/country";
import {
  DEMO_PROFILE_CA,
  DEMO_PROFILE_US,
  withScenarioDefaults,
} from "@/lib/demo";
import type { CountryCode, RetirementProfile } from "@/lib/engine";
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

type StepId =
  | "country"
  | "welcome"
  | "age"
  | "spend"
  | "nest"
  | "income"
  | "ready";

const STEPS: StepId[] = [
  "country",
  "welcome",
  "age",
  "spend",
  "nest",
  "income",
  "ready",
];

const PROVINCES = [
  { code: "ON", label: "Ontario" },
  { code: "BC", label: "British Columbia" },
  { code: "AB", label: "Alberta" },
  { code: "QC", label: "Quebec" },
  { code: "MB", label: "Manitoba" },
  { code: "SK", label: "Saskatchewan" },
  { code: "NS", label: "Nova Scotia" },
  { code: "NB", label: "New Brunswick" },
  { code: "NL", label: "Newfoundland and Labrador" },
  { code: "PE", label: "Prince Edward Island" },
] as const;

function blankProfile(country: CountryCode): RetirementProfile {
  return withScenarioDefaults({
    country,
    currentAge: 55,
    retirementAge: 55,
    planningUntilAge: 92,
    annualSpendingNeed: country === "CA" ? 65000 : 72000,
    accounts: emptyAccounts(),
  });
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ages, setAges] = useState<{
    current: number | null;
    retire: number | null;
  }>({ current: null, retire: null });
  const [profile, setProfile] = useState<RetirementProfile>(blankProfile("US"));
  const [showOptionalAccounts, setShowOptionalAccounts] = useState(false);

  const config = getCountryConfig(profile.country);
  const nestAccounts = useMemo(() => {
    const required = config.accounts.filter((a) => !a.optional);
    const optional = config.accounts.filter((a) => a.optional);
    return showOptionalAccounts ? [...required, ...optional] : required;
  }, [config.accounts, showOptionalAccounts]);

  const total = useMemo(
    () =>
      nestAccounts.reduce((s, a) => s + (profile.accounts[a.key] ?? 0), 0),
    [nestAccounts, profile.accounts],
  );

  const id = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function selectCountry(country: CountryCode) {
    setProfile(blankProfile(country));
    setShowOptionalAccounts(false);
  }

  function next() {
    if (id === "age") {
      const currentAge = ages.current;
      const retirementAge = ages.retire;
      if (
        currentAge == null ||
        retirementAge == null ||
        currentAge < 18 ||
        retirementAge < 18
      ) {
        return;
      }
      setProfile((p) => ({
        ...p,
        currentAge,
        retirementAge,
        leftEmployerAtAge: currentAge,
      }));
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function finish() {
    const normalized = withScenarioDefaults({
      ...profile,
      currentAge: ages.current ?? profile.currentAge,
      retirementAge: ages.retire ?? profile.retirementAge,
      leftEmployerAtAge: ages.current ?? profile.leftEmployerAtAge,
    });
    saveProfile(normalized);
    const presets = presetScenarios(normalized);
    const base = createScenario("My plan", normalized);
    const workspace = [base, ...presets.slice(1)];
    saveScenarios(workspace);
    saveActiveScenarioId(base.id);
    router.push("/results");
  }

  function openDemo(country: CountryCode) {
    const demo = country === "CA" ? DEMO_PROFILE_CA : DEMO_PROFILE_US;
    saveProfile(demo);
    const presets = presetScenarios(demo);
    saveScenarios(presets);
    saveActiveScenarioId(presets[0].id);
    router.push(`/results?demo=1&country=${country}`);
  }

  const incomeSummary =
    profile.country === "CA"
      ? `CPP at ${profile.cppClaimAge}`
      : `Social Security at ${profile.socialSecurityClaimAge}`;

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <div className="mb-8">
          <div className="h-2 overflow-hidden rounded-full bg-mist">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-ink-soft">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
            className="surface-card p-6 sm:p-8"
          >
            {id === "country" && (
              <Step
                title="Where do you plan to retire?"
                body="This sets the accounts, tax rules, and benefits we use — so the plan feels built for your country."
              >
                <div className="grid gap-3">
                  {(
                    [
                      ["US", "United States", "🇺🇸"],
                      ["CA", "Canada", "🇨🇦"],
                    ] as const
                  ).map(([code, name, flag]) => {
                    const selected = profile.country === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => selectCountry(code)}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition",
                          selected
                            ? "border-accent bg-accent-soft shadow-sm"
                            : "border-line bg-white hover:border-accent/40",
                        )}
                      >
                        <span className="text-3xl" aria-hidden>
                          {flag}
                        </span>
                        <span>
                          <span className="block text-lg font-semibold">
                            {name}
                          </span>
                          <span className="mt-0.5 block text-sm text-ink-soft">
                            {code === "US"
                              ? "401(k), IRA, Social Security, Medicare"
                              : "RRSP, TFSA, CPP, OAS"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Step>
            )}

            {id === "welcome" && (
              <Step
                title="Let’s map your retirement in a few minutes"
                body={`We’ll ask one simple question at a time for ${config.name}. You can change anything later.`}
              >
                <button
                  type="button"
                  onClick={() => openDemo(profile.country)}
                  className="mb-4 inline-flex items-center gap-2 text-base font-semibold text-accent"
                >
                  <Sparkles className="h-4 w-4" />
                  Prefer a filled-in {config.flag} demo? Open it
                </button>
              </Step>
            )}

            {id === "age" && (
              <Step
                title="How old are you, and when are you retiring?"
                body="If you’re retiring now, use the same number twice."
              >
                <NumericInput
                  label="Your age"
                  mode="integer"
                  value={ages.current}
                  placeholder="e.g. 55"
                  onChange={(current) =>
                    setAges((a) => ({
                      current,
                      retire:
                        a.retire == null || a.retire === a.current
                          ? current
                          : a.retire,
                    }))
                  }
                />
                <NumericInput
                  label="Retirement age"
                  mode="integer"
                  value={ages.retire}
                  placeholder="e.g. 55"
                  onChange={(retire) => setAges((a) => ({ ...a, retire }))}
                />
              </Step>
            )}

            {id === "spend" && (
              <Step
                title="About how much do you need to spend each year?"
                body="Include housing, food, travel, and healthcare. A round number is fine."
              >
                <NumericInput
                  label="Yearly spending"
                  mode="money"
                  prefix="$"
                  value={
                    profile.annualSpendingNeed > 0
                      ? profile.annualSpendingNeed
                      : null
                  }
                  emptyWhenZero
                  placeholder={profile.country === "CA" ? "65,000" : "72,000"}
                  onChange={(annualSpendingNeed) =>
                    setProfile((p) => ({
                      ...p,
                      annualSpendingNeed: annualSpendingNeed ?? 0,
                    }))
                  }
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[60000, 72000, 90000, 120000].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        setProfile((p) => ({ ...p, annualSpendingNeed: n }))
                      }
                      className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold"
                    >
                      {formatCurrency(n)}
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {id === "nest" && (
              <Step
                title="Where is your money today?"
                body="Estimates are OK. The order of withdrawals matters more than perfect cents."
              >
                {nestAccounts.map((field) => (
                  <NumericInput
                    key={field.key}
                    label={
                      field.hint
                        ? `${field.label} (${field.hint})`
                        : field.label
                    }
                    mode="money"
                    prefix="$"
                    emptyWhenZero
                    value={
                      profile.accounts[field.key] > 0
                        ? profile.accounts[field.key]
                        : null
                    }
                    placeholder="0"
                    onChange={(amount) =>
                      setProfile((p) => ({
                        ...p,
                        accounts: {
                          ...p.accounts,
                          [field.key]: amount ?? 0,
                        },
                      }))
                    }
                  />
                ))}
                {config.accounts.some((a) => a.optional) ? (
                  <button
                    type="button"
                    onClick={() => setShowOptionalAccounts((v) => !v)}
                    className="text-sm font-semibold text-accent"
                  >
                    {showOptionalAccounts
                      ? "Hide optional accounts"
                      : "Add optional accounts (FHSA, LIRA, RRIF…)"}
                  </button>
                ) : null}
                <p className="mt-4 text-base text-ink-soft">
                  Total so far:{" "}
                  <span className="font-semibold text-ink">
                    {formatCurrency(total)}
                  </span>
                </p>
              </Step>
            )}

            {id === "income" &&
              (profile.country === "CA" ? (
                <Step
                  title="Any paycheck-like income later?"
                  body="CPP, OAS, and pension reduce how much you need to withdraw."
                >
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-ink">
                      Province
                    </span>
                    <select
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-base"
                      value={profile.province}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          province: e.target
                            .value as RetirementProfile["province"],
                        }))
                      }
                    >
                      {PROVINCES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumericInput
                    label="CPP start age"
                    mode="integer"
                    value={profile.cppClaimAge}
                    placeholder="65"
                    onChange={(cppClaimAge) =>
                      setProfile((p) => ({
                        ...p,
                        cppClaimAge: cppClaimAge ?? 65,
                      }))
                    }
                  />
                  <NumericInput
                    label="Yearly CPP at claim age"
                    mode="money"
                    prefix="$"
                    emptyWhenZero
                    value={
                      profile.cppAnnualAtClaimAge > 0
                        ? profile.cppAnnualAtClaimAge
                        : null
                    }
                    placeholder="14,000"
                    onChange={(cppAnnualAtClaimAge) =>
                      setProfile((p) => ({
                        ...p,
                        cppAnnualAtClaimAge: cppAnnualAtClaimAge ?? 0,
                      }))
                    }
                  />
                  <NumericInput
                    label="Yearly OAS (usually starts at 65)"
                    mode="money"
                    prefix="$"
                    emptyWhenZero
                    value={profile.oasAnnual > 0 ? profile.oasAnnual : null}
                    placeholder="8,500"
                    onChange={(oasAnnual) =>
                      setProfile((p) => ({
                        ...p,
                        oasAnnual: oasAnnual ?? 0,
                      }))
                    }
                  />
                  <NumericInput
                    label="Yearly pension (leave blank if none)"
                    mode="money"
                    prefix="$"
                    emptyWhenZero
                    value={
                      profile.pensionAnnual > 0 ? profile.pensionAnnual : null
                    }
                    placeholder="0"
                    onChange={(pensionAnnual) =>
                      setProfile((p) => ({
                        ...p,
                        pensionAnnual: pensionAnnual ?? 0,
                      }))
                    }
                  />
                </Step>
              ) : (
                <Step
                  title="Any paycheck-like income later?"
                  body="Pension and Social Security reduce how much you need to withdraw."
                >
                  <NumericInput
                    label="Social Security start age"
                    mode="integer"
                    value={profile.socialSecurityClaimAge}
                    placeholder="67"
                    onChange={(socialSecurityClaimAge) =>
                      setProfile((p) => ({
                        ...p,
                        socialSecurityClaimAge: socialSecurityClaimAge ?? 67,
                      }))
                    }
                  />
                  <NumericInput
                    label="Yearly Social Security"
                    mode="money"
                    prefix="$"
                    emptyWhenZero
                    value={
                      profile.socialSecurityAnnualAtClaimAge > 0
                        ? profile.socialSecurityAnnualAtClaimAge
                        : null
                    }
                    placeholder="28,000"
                    onChange={(socialSecurityAnnualAtClaimAge) =>
                      setProfile((p) => ({
                        ...p,
                        socialSecurityAnnualAtClaimAge:
                          socialSecurityAnnualAtClaimAge ?? 0,
                      }))
                    }
                  />
                  <NumericInput
                    label="Yearly pension (leave blank if none)"
                    mode="money"
                    prefix="$"
                    emptyWhenZero
                    value={
                      profile.pensionAnnual > 0 ? profile.pensionAnnual : null
                    }
                    placeholder="0"
                    onChange={(pensionAnnual) =>
                      setProfile((p) => ({
                        ...p,
                        pensionAnnual: pensionAnnual ?? 0,
                      }))
                    }
                  />
                </Step>
              ))}

            {id === "ready" && (
              <Step
                title="You’re ready for a clear plan"
                body="Next you’ll see whether you’re on track, what to withdraw this year, and how long the money lasts."
              >
                <div className="space-y-3 rounded-2xl bg-mist/70 p-4 text-base">
                  <p>
                    {config.flag} {config.name}
                  </p>
                  <p>
                    Retire at{" "}
                    <strong>{ages.retire ?? profile.retirementAge}</strong>,
                    spend{" "}
                    <strong>
                      {formatCurrency(profile.annualSpendingNeed)}
                    </strong>
                    /year
                  </p>
                  <p>
                    Nest egg about <strong>{formatCurrency(total)}</strong>
                  </p>
                  <p>{incomeSummary}</p>
                </div>
              </Step>
            )}

            <div className="mt-10 flex items-center justify-between gap-3">
              {step === 0 ? (
                <ButtonLink href="/" variant="ghost" className="!px-3">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </ButtonLink>
              ) : (
                <Button variant="ghost" onClick={back} className="!px-3">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              {id === "ready" ? (
                <Button onClick={finish}>
                  Show my plan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={next}
                  disabled={
                    id === "age" &&
                    (ages.current == null || ages.retire == null)
                  }
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
    </div>
  );
}

function Step({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-8 space-y-4">{children}</div>
    </div>
  );
}
