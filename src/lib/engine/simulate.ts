import { ASSUMPTIONS } from "./assumptions";
import { explainYear } from "./explain";
import { buildRecommendation, yearStatus } from "./recommend";
import { simulateCanada } from "./simulate-ca";
import {
  acaMagiLimit,
  estimateFederalTax,
  estimateMagi,
  estimateStateTax,
  marginalBracket,
} from "./tax";
import type {
  AccountKey,
  IncomeStreamKey,
  RetirementProfile,
  StrategyResult,
  StrategySummary,
  WarningCode,
  WithdrawalSlice,
  YearPlan,
  YearWarning,
} from "./types";
import { ALL_ACCOUNT_KEYS, mergeAccounts } from "./types";

const US_ACCOUNT_KEYS: AccountKey[] = [
  "cash",
  "brokerage",
  "traditional_401k",
  "traditional_ira",
  "roth_ira",
];

type StrategyMode = "naive" | "optimized";

function cloneBalances(
  accounts: Record<AccountKey, number>,
): Record<AccountKey, number> {
  return mergeAccounts(accounts);
}

function netWorthOf(balances: Record<AccountKey, number>): number {
  return ALL_ACCOUNT_KEYS.reduce((s, k) => s + (balances[k] ?? 0), 0);
}

function growBalances(balances: Record<AccountKey, number>, profile: RetirementProfile) {
  const growth = profile.investmentReturn;
  balances.cash *= 1 + ASSUMPTIONS.cashGrowthRate;
  for (const key of US_ACCOUNT_KEYS) {
    if (key === "cash") continue;
    balances[key] *= 1 + growth;
  }
}

function applyMarketShock(
  balances: Record<AccountKey, number>,
  profile: RetirementProfile,
  age: number,
) {
  if (profile.marketShockAge == null) return;
  if (age !== profile.marketShockAge) return;
  const mult = 1 + profile.marketShockDrawdown;
  balances.brokerage *= mult;
  balances.traditional_401k *= mult;
  balances.traditional_ira *= mult;
  balances.roth_ira *= mult;
}

function spendingAtAge(profile: RetirementProfile, age: number): number {
  const years = age - profile.retirementAge;
  let need =
    profile.annualSpendingNeed *
    Math.pow(1 + profile.inflationRate, Math.max(0, years));
  for (const expense of profile.oneTimeExpenses) {
    if (expense.age === age) need += expense.amount;
  }
  return Math.max(0, need);
}

function canTake401kPenaltyFree(profile: RetirementProfile, age: number): boolean {
  if (age >= ASSUMPTIONS.earlyWithdrawalAge) return true;
  return profile.leftEmployerAtAge >= 55 && age >= profile.leftEmployerAtAge;
}

function withdrawalTaxEffects(
  account: AccountKey,
  amount: number,
  age: number,
  profile: RetirementProfile,
): Pick<WithdrawalSlice, "taxableOrdinary" | "taxableGains" | "penalty"> {
  if (amount <= 0) {
    return { taxableOrdinary: 0, taxableGains: 0, penalty: 0 };
  }

  switch (account) {
    case "cash":
      return { taxableOrdinary: 0, taxableGains: 0, penalty: 0 };
    case "roth_ira":
      return { taxableOrdinary: 0, taxableGains: 0, penalty: 0 };
    case "brokerage": {
      const gains = amount * ASSUMPTIONS.brokerageGainFraction;
      return { taxableOrdinary: 0, taxableGains: gains, penalty: 0 };
    }
    case "traditional_401k": {
      const penalty =
        age < ASSUMPTIONS.earlyWithdrawalAge &&
        !canTake401kPenaltyFree(profile, age)
          ? amount * ASSUMPTIONS.earlyWithdrawalPenaltyRate
          : 0;
      return { taxableOrdinary: amount, taxableGains: 0, penalty };
    }
    case "traditional_ira": {
      const penalty =
        age < ASSUMPTIONS.earlyWithdrawalAge
          ? amount * ASSUMPTIONS.earlyWithdrawalPenaltyRate
          : 0;
      return { taxableOrdinary: amount, taxableGains: 0, penalty };
    }
    default:
      // Canadian accounts are handled in simulate-ca.ts
      return { taxableOrdinary: 0, taxableGains: 0, penalty: 0 };
  }
}

function takeFrom(
  balances: Record<AccountKey, number>,
  account: AccountKey,
  requested: number,
  age: number,
  profile: RetirementProfile,
): WithdrawalSlice {
  const amount = Math.min(requested, balances[account]);
  balances[account] -= amount;
  const tax = withdrawalTaxEffects(account, amount, age, profile);
  return { account, amount, ...tax };
}

function streamIncome(
  profile: RetirementProfile,
  age: number,
): { source: IncomeStreamKey; amount: number }[] {
  const streams: { source: IncomeStreamKey; amount: number }[] = [];
  if (
    profile.partTimeIncome > 0 &&
    age >= profile.retirementAge &&
    age < profile.partTimeUntilAge
  ) {
    streams.push({ source: "employment", amount: profile.partTimeIncome });
  }
  if (age >= profile.pensionStartAge && profile.pensionAnnual > 0) {
    streams.push({ source: "pension", amount: profile.pensionAnnual });
  }
  if (
    age >= profile.socialSecurityClaimAge &&
    profile.socialSecurityAnnualAtClaimAge > 0
  ) {
    streams.push({
      source: "social_security",
      amount: profile.socialSecurityAnnualAtClaimAge,
    });
  }
  return streams;
}

function primaryFromWithdrawals(
  withdrawals: WithdrawalSlice[],
  streams: { source: IncomeStreamKey; amount: number }[],
): YearPlan["primarySource"] {
  const totals = new Map<string, number>();
  for (const w of withdrawals) {
    if (w.amount <= 0) continue;
    totals.set(w.account, (totals.get(w.account) ?? 0) + w.amount);
  }
  for (const s of streams) {
    totals.set(s.source, (totals.get(s.source) ?? 0) + s.amount);
  }
  if (totals.size === 0) return "shortfall";
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length > 1 && ranked[1][1] > ranked[0][1] * 0.75) return "mixed";
  return ranked[0][0] as YearPlan["primarySource"];
}

function pushWarning(
  warnings: YearWarning[],
  code: WarningCode,
  severity: YearWarning["severity"],
  message: string,
) {
  if (warnings.some((w) => w.code === code && w.message === message)) return;
  warnings.push({ code, severity, message });
}

function orderForMode(
  mode: StrategyMode,
  age: number,
  profile: RetirementProfile,
  balances: Record<AccountKey, number>,
): AccountKey[] {
  if (mode === "naive") {
    return [
      "traditional_401k",
      "traditional_ira",
      "brokerage",
      "roth_ira",
      "cash",
    ];
  }

  const underPenaltyAge = age < ASSUMPTIONS.earlyWithdrawalAge;
  const acaRelevant = age < ASSUMPTIONS.medicareAge;
  const excessCash = Math.max(0, balances.cash - profile.cashReserve);

  if (acaRelevant && underPenaltyAge) {
    const order: AccountKey[] = ["brokerage"];
    if (excessCash > 0) order.push("cash");
    if (canTake401kPenaltyFree(profile, age)) order.push("traditional_401k");
    order.push("roth_ira");
    if (!canTake401kPenaltyFree(profile, age)) order.push("traditional_401k");
    order.push("traditional_ira");
    order.push("cash");
    return order;
  }

  if (underPenaltyAge) {
    return [
      "brokerage",
      "cash",
      ...(canTake401kPenaltyFree(profile, age)
        ? (["traditional_401k"] as AccountKey[])
        : []),
      "roth_ira",
      "traditional_401k",
      "traditional_ira",
    ];
  }

  return [
    "brokerage",
    "traditional_401k",
    "traditional_ira",
    "cash",
    "roth_ira",
  ];
}

function maybeExecuteRothConversion(
  mode: StrategyMode,
  age: number,
  profile: RetirementProfile,
  balances: Record<AccountKey, number>,
  ordinarySoFar: number,
  gainsSoFar: number,
  ssAmount: number,
): number {
  if (mode !== "optimized" || !profile.executeRothConversions) return 0;
  if (age >= ASSUMPTIONS.medicareAge) return 0;
  if (age < 56 || age > 63) return 0;
  if (age % 2 === 0) return 0;

  const traditional = balances.traditional_401k + balances.traditional_ira;
  if (traditional < 25_000) return 0;

  const limit = acaMagiLimit(profile.filingStatus);
  const magi = estimateMagi(ordinarySoFar, gainsSoFar, ssAmount);
  const headroom = limit - magi - 5_000;
  if (headroom < 8_000) return 0;

  const amount = Math.min(ASSUMPTIONS.maxRothConversion, headroom, traditional);
  if (amount < 5_000) return 0;

  if (balances.traditional_ira >= amount) {
    balances.traditional_ira -= amount;
  } else {
    const fromIra = balances.traditional_ira;
    balances.traditional_ira = 0;
    balances.traditional_401k -= amount - fromIra;
  }
  balances.roth_ira += amount;
  return amount;
}

function suggestRothOnly(
  mode: StrategyMode,
  age: number,
  profile: RetirementProfile,
  balances: Record<AccountKey, number>,
  ordinarySoFar: number,
  gainsSoFar: number,
  ssAmount: number,
): number {
  if (profile.executeRothConversions) return 0;
  if (mode !== "optimized") return 0;
  if (age >= ASSUMPTIONS.medicareAge) return 0;
  if (age < 56 || age > 62 || age % 2 === 0) return 0;
  const traditional = balances.traditional_401k + balances.traditional_ira;
  if (traditional < 25_000) return 0;
  const limit = acaMagiLimit(profile.filingStatus);
  const magi = estimateMagi(ordinarySoFar, gainsSoFar, ssAmount);
  const headroom = limit - magi - 5_000;
  if (headroom < 8_000) return 0;
  return Math.min(ASSUMPTIONS.maxRothConversion, headroom);
}

function computeRmd(balances: Record<AccountKey, number>, age: number): number {
  if (age < ASSUMPTIONS.rmdAge) return 0;
  const traditional =
    balances.traditional_401k + balances.traditional_ira;
  return traditional / ASSUMPTIONS.rmdDivisor;
}

function payObligations(
  balances: Record<AccountKey, number>,
  amount: number,
  age: number,
  profile: RetirementProfile,
  mode: StrategyMode,
): WithdrawalSlice[] {
  if (amount <= 0.5) return [];
  let remaining = amount;
  const order =
    mode === "optimized"
      ? (["cash", "brokerage", "roth_ira", "traditional_401k", "traditional_ira"] as AccountKey[])
      : (["traditional_401k", "traditional_ira", "brokerage", "roth_ira", "cash"] as AccountKey[]);
  const slices: WithdrawalSlice[] = [];
  for (const account of order) {
    if (remaining <= 0.5) break;
    const slice = takeFrom(balances, account, remaining, age, profile);
    if (slice.amount > 0) {
      slices.push(slice);
      remaining -= slice.amount;
    }
  }
  return slices;
}

function summarize(mode: StrategyMode, years: YearPlan[]): StrategySummary {
  const totalTaxes = years.reduce((s, y) => s + y.federalTax + y.stateTax, 0);
  const totalPenalties = years.reduce((s, y) => s + y.penalties, 0);
  const preMedicareDrag = years
    .filter((y) => y.age < ASSUMPTIONS.medicareAge)
    .reduce((s, y) => s + y.federalTax + y.stateTax + y.penalties, 0);
  const yearsWithAca = years.filter(
    (y) => y.acaEligible && y.age < ASSUMPTIONS.medicareAge,
  ).length;
  const last = years[years.length - 1];
  const at65 = years.find((y) => y.age === 65) ?? last;
  const depleted = years.find((y) =>
    y.warnings.some((w) => w.code === "shortfall"),
  );
  const yearsUntilDepletion = depleted ? depleted.yearIndex + 1 : null;
  const moneyLastsUntilAge = depleted
    ? depleted.age
    : (last?.age ?? null);
  const totalWithdrawn = years.reduce(
    (s, y) => s + y.withdrawals.reduce((a, w) => a + w.amount, 0),
    0,
  );
  const totalRothConversions = years.reduce(
    (s, y) => s + (y.rothConversion ?? 0),
    0,
  );

  return {
    strategyId: mode,
    label: mode === "naive" ? "Naive order" : "Optimized order",
    totalTaxes,
    totalPenalties,
    preMedicareDrag,
    yearsWithAca,
    yearsPlanned: years.length,
    finalNetWorth: last ? last.endingNetWorth : 0,
    netWorthAt65: at65 ? at65.endingNetWorth : 0,
    yearsUntilDepletion,
    moneyLastsUntilAge,
    totalWithdrawn,
    totalRothConversions,
    endingRothBalance: last?.endingBalances.roth_ira ?? 0,
    endingTaxFreeBalance: last?.endingBalances.roth_ira ?? 0,
    acaSubsidyLost: years.some(
      (y) =>
        y.age < ASSUMPTIONS.medicareAge &&
        y.warnings.some((w) => w.code === "aca_subsidy_lost"),
    ),
    oasClawbackYears: 0,
  };
}

export function simulateStrategy(
  profile: RetirementProfile,
  mode: StrategyMode,
): StrategyResult {
  if (profile.country === "CA") {
    return simulateCanada(profile, mode);
  }

  const balances = cloneBalances(profile.accounts);
  const years: YearPlan[] = [];
  const startAge = Math.max(profile.currentAge, profile.retirementAge);
  const endAge = Math.max(startAge, profile.planningUntilAge);
  const acaLimit = acaMagiLimit(profile.filingStatus);
  const baseYear = new Date().getFullYear();

  for (let age = startAge; age <= endAge; age += 1) {
    applyMarketShock(balances, profile, age);
    const startingBalances = cloneBalances(balances);
    const yearIndex = age - startAge;
    const need = spendingAtAge(profile, age);
    const streams = streamIncome(profile, age);
    const streamTotal = streams.reduce((s, x) => s + x.amount, 0);
    let remaining = Math.max(0, need - streamTotal);

    const rmd = computeRmd(balances, age);
    if (rmd > remaining) remaining = rmd;

    const withdrawals: WithdrawalSlice[] = [];
    const order = orderForMode(mode, age, profile, balances);

    for (const account of order) {
      if (remaining <= 0.5) break;
      const slice = takeFrom(balances, account, remaining, age, profile);
      if (slice.amount > 0) {
        withdrawals.push(slice);
        remaining -= slice.amount;
      }
    }

    const pensionAmount =
      streams.find((s) => s.source === "pension")?.amount ?? 0;
    const employmentAmount =
      streams.find((s) => s.source === "employment")?.amount ?? 0;
    const ssAmount =
      streams.find((s) => s.source === "social_security")?.amount ?? 0;

    let ordinary =
      pensionAmount +
      employmentAmount +
      withdrawals.reduce((s, w) => s + w.taxableOrdinary, 0);
    let gains = withdrawals.reduce((s, w) => s + w.taxableGains, 0);
    let penalties = withdrawals.reduce((s, w) => s + w.penalty, 0);

    const conversions: YearPlan["conversions"] = [];
    let rothConversion = maybeExecuteRothConversion(
      mode,
      age,
      profile,
      balances,
      ordinary,
      gains,
      ssAmount,
    );
    if (rothConversion > 0) {
      ordinary += rothConversion;
      conversions.push({
        from: "traditional_ira",
        to: "roth_ira",
        amount: rothConversion,
      });
    } else {
      rothConversion = suggestRothOnly(
        mode,
        age,
        profile,
        balances,
        ordinary,
        gains,
        ssAmount,
      );
    }

    let federalTax = estimateFederalTax(ordinary + ssAmount * 0.5, gains);
    let stateTax = estimateStateTax(ordinary + ssAmount * 0.15, profile.stateTaxRate);

    const obligationSlices = payObligations(
      balances,
      federalTax + stateTax + penalties,
      age,
      profile,
      mode,
    );
    for (const slice of obligationSlices) {
      withdrawals.push(slice);
      ordinary += slice.taxableOrdinary;
      gains += slice.taxableGains;
      penalties += slice.penalty;
    }
    federalTax = estimateFederalTax(ordinary + ssAmount * 0.5, gains);
    stateTax = estimateStateTax(ordinary + ssAmount * 0.15, profile.stateTaxRate);

    if (remaining > 1) {
      withdrawals.push({
        account: "shortfall",
        amount: remaining,
        taxableOrdinary: 0,
        taxableGains: 0,
        penalty: 0,
      });
    }

    const magi = estimateMagi(ordinary, gains, ssAmount);
    const acaEligible =
      age < ASSUMPTIONS.medicareAge ? magi <= acaLimit : true;
    const taxBracket = marginalBracket(ordinary);
    const primarySource = primaryFromWithdrawals(withdrawals, streams);
    const spendingWithdrawals = withdrawals
      .filter((w) => w.account !== "shortfall")
      .reduce((s, w) => s + w.amount, 0);

    const warnings: YearWarning[] = [];
    if (age < ASSUMPTIONS.medicareAge && !acaEligible) {
      pushWarning(
        warnings,
        "aca_subsidy_lost",
        "critical",
        `MAGI ~$${Math.round(magi).toLocaleString()} exceeds ACA subsidy threshold ($${acaLimit.toLocaleString()}).`,
      );
    }
    if (penalties > 0) {
      pushWarning(
        warnings,
        "early_withdrawal_penalty",
        "critical",
        `Early withdrawal penalty of $${Math.round(penalties).toLocaleString()} this year.`,
      );
    }
    if (ordinary > 90_000 && age < ASSUMPTIONS.medicareAge) {
      pushWarning(
        warnings,
        "traditional_tax_spike",
        "warning",
        "Traditional account withdrawals create a taxable income spike.",
      );
    }
    if (federalTax > need * 0.18) {
      pushWarning(
        warnings,
        "high_tax_cost",
        "warning",
        "Tax burden is elevated relative to spending this year.",
      );
    }
    if (balances.cash < 1 && profile.accounts.cash > 0 && yearIndex < 5) {
      pushWarning(
        warnings,
        "cash_exhausted",
        "warning",
        "Cash reserves are exhausted early in retirement.",
      );
    }
    if (
      mode === "optimized" &&
      age < profile.socialSecurityClaimAge &&
      age >= 62
    ) {
      pushWarning(
        warnings,
        "social_security_delayed",
        "info",
        `Social Security delayed until ${profile.socialSecurityClaimAge} to improve sequencing.`,
      );
    }
    if (rothConversion > 0) {
      pushWarning(
        warnings,
        "roth_conversion_opportunity",
        "info",
        profile.executeRothConversions
          ? `Executed Roth conversion of $${Math.round(rothConversion).toLocaleString()}.`
          : `Suggested Roth conversion of $${Math.round(rothConversion).toLocaleString()} while income is relatively low.`,
      );
    }
    if (rmd > 0) {
      pushWarning(
        warnings,
        "rmd_due",
        "info",
        `Approximate RMD of $${Math.round(rmd).toLocaleString()} included in this year's plan.`,
      );
    }
    if (
      mode === "optimized" &&
      canTake401kPenaltyFree(profile, age) &&
      withdrawals.some((w) => w.account === "traditional_401k" && w.amount > 0)
    ) {
      pushWarning(
        warnings,
        "rule_of_55_used",
        "info",
        "Using Rule of 55 for penalty-free 401(k) access.",
      );
    }
    if (remaining > 1) {
      pushWarning(
        warnings,
        "shortfall",
        "critical",
        `Unable to fully fund $${Math.round(remaining).toLocaleString()} of spending.`,
      );
    }

    growBalances(balances, profile);
    const endingBalances = cloneBalances(balances);
    const endingNetWorth = netWorthOf(endingBalances);
    const status = yearStatus({
      acaEligible,
      age,
      penalties,
      federalTax,
      spendingNeed: need,
      warnings,
    });

    const recommendation = buildRecommendation({
      mode,
      age,
      profile,
      primarySource,
      withdrawAmount: spendingWithdrawals,
      conversionAmount: conversions[0]?.amount ?? 0,
      acaEligible,
      penalties,
      taxBracket,
      federalTax,
    });

    const year: YearPlan = {
      age,
      calendarYear: baseYear + (age - profile.currentAge),
      yearIndex,
      status,
      spendingNeed: need,
      withdrawals,
      conversions,
      incomeStreams: streams,
      ordinaryIncome: ordinary,
      capitalGains: gains,
      federalTax,
      stateTax,
      penalties,
      magi,
      acaEligible,
      acaLabel:
        age >= ASSUMPTIONS.medicareAge
          ? "Medicare age"
          : acaEligible
            ? "Healthcare help looks intact"
            : "Healthcare help may be reduced",
      taxBracket,
      rmd,
      startingBalances,
      endingBalances,
      endingNetWorth,
      warnings,
      primarySource,
      explanation: "",
      recommendation,
      rothConversion: rothConversion || undefined,
    };
    year.explanation = explainYear(year, mode === "optimized");
    years.push(year);
  }

  return {
    summary: summarize(mode, years),
    years,
  };
}
