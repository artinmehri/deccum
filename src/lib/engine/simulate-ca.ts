import { ASSUMPTIONS } from "./assumptions";
import {
  caEstimateTax,
  caOasClawback,
  caRrifMinimum,
} from "./tax-ca";
import type {
  AccountKey,
  IncomeStreamKey,
  RetirementProfile,
  StrategyResult,
  StrategySummary,
  WarningCode,
  WithdrawalSlice,
  YearPlan,
  YearRecommendation,
  YearWarning,
} from "./types";
import { ALL_ACCOUNT_KEYS, emptyAccounts, mergeAccounts } from "./types";

type StrategyMode = "naive" | "optimized";

function cloneBalances(
  accounts: Record<AccountKey, number>,
): Record<AccountKey, number> {
  return mergeAccounts(accounts);
}

function netWorthOf(balances: Record<AccountKey, number>): number {
  return ALL_ACCOUNT_KEYS.reduce((s, k) => s + (balances[k] ?? 0), 0);
}

function growBalances(
  balances: Record<AccountKey, number>,
  profile: RetirementProfile,
) {
  const g = profile.investmentReturn;
  balances.cash *= 1 + ASSUMPTIONS.cashGrowthRate;
  for (const key of ALL_ACCOUNT_KEYS) {
    if (key === "cash") continue;
    balances[key] *= 1 + g;
  }
}

function applyMarketShock(
  balances: Record<AccountKey, number>,
  profile: RetirementProfile,
  age: number,
) {
  if (profile.marketShockAge == null || age !== profile.marketShockAge) return;
  const mult = 1 + profile.marketShockDrawdown;
  for (const key of [
    "non_registered",
    "rrsp",
    "tfsa",
    "fhsa",
    "lira",
    "lif",
    "rrif",
  ] as AccountKey[]) {
    balances[key] *= mult;
  }
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
  if (age >= profile.cppClaimAge && profile.cppAnnualAtClaimAge > 0) {
    streams.push({ source: "cpp", amount: profile.cppAnnualAtClaimAge });
  }
  if (age >= profile.oasStartAge && profile.oasAnnual > 0) {
    streams.push({ source: "oas", amount: profile.oasAnnual });
  }
  if (age >= profile.oasStartAge && profile.gisAnnual > 0) {
    streams.push({ source: "gis", amount: profile.gisAnnual });
  }
  if (profile.rentalAnnual > 0) {
    streams.push({ source: "rental", amount: profile.rentalAnnual });
  }
  return streams;
}

function takeFrom(
  balances: Record<AccountKey, number>,
  account: AccountKey,
  requested: number,
): WithdrawalSlice {
  const amount = Math.min(requested, balances[account] ?? 0);
  balances[account] -= amount;
  if (account === "tfsa" || account === "fhsa" || account === "cash") {
    return {
      account,
      amount,
      taxableOrdinary: 0,
      taxableGains: 0,
      penalty: 0,
    };
  }
  if (account === "non_registered") {
    return {
      account,
      amount,
      taxableOrdinary: 0,
      taxableGains: amount * ASSUMPTIONS.caNonRegGainFraction,
      penalty: 0,
    };
  }
  // RRSP, RRIF, LIRA, LIF — fully taxable
  return {
    account,
    amount,
    taxableOrdinary: amount,
    taxableGains: 0,
    penalty: 0,
  };
}

function orderForMode(
  mode: StrategyMode,
  age: number,
  balances: Record<AccountKey, number>,
  cashReserve: number,
): AccountKey[] {
  if (mode === "naive") {
    // Common mistake: drain RRSP first
    return ["rrsp", "rrif", "lif", "lira", "non_registered", "tfsa", "fhsa", "cash"];
  }
  const excessCash = Math.max(0, balances.cash - cashReserve);
  const order: AccountKey[] = [];
  // Tax-free first to protect OAS
  order.push("tfsa");
  if (excessCash > 0) order.push("cash");
  order.push("fhsa");
  order.push("non_registered");
  // After 71 / RRIF, take minimums from RRIF (handled separately), then taxable registered
  if (age >= 65) {
    order.push("rrif", "lif", "rrsp", "lira");
  } else {
    order.push("rrsp", "lira", "rrif", "lif");
  }
  order.push("cash");
  return order;
}

function primaryFrom(
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

function labelOf(key: string): string {
  const map: Record<string, string> = {
    cash: "Cash",
    non_registered: "Non-registered account",
    tfsa: "TFSA",
    rrsp: "RRSP",
    fhsa: "FHSA",
    lira: "LIRA",
    lif: "LIF",
    rrif: "RRIF",
    pension: "Employer pension",
    cpp: "CPP",
    oas: "OAS",
    gis: "GIS",
    employment: "Part-time work",
    rental: "Rental income",
    shortfall: "Not fully funded",
    mixed: "A few accounts",
  };
  return map[key] ?? key;
}

function buildCaRecommendation(params: {
  mode: StrategyMode;
  age: number;
  primary: YearPlan["primarySource"];
  amount: number;
  oasClawed: number;
  taxBracket: number;
}): YearRecommendation {
  const fromLabel = labelOf(params.primary);
  if (params.mode === "naive") {
    return {
      actionLabel: "Take money out",
      amount: params.amount,
      fromLabel,
      confidence: 36,
      reasons: [
        "This is the common guess: use RRSP dollars first",
        "It raises taxable income and can trigger OAS clawback",
        "It spends tax-sheltered growth earlier than needed",
      ],
      estimatedBenefit: {
        federalTaxSaved: 0,
        healthcareSaved: 0,
        lifetimeBenefit: 0,
      },
      mistakeWarning: {
        title: `Taking ${Math.round(params.amount).toLocaleString("en-CA")} from an RRSP first`,
        will: [
          "Increase taxable income this year",
          "Risk OAS recovery tax after 65",
          "Leave less room for tax-free TFSA growth",
        ],
        estimatedCost: Math.round(params.amount * 0.25 + params.oasClawed),
      },
      alternative: {
        instead: "Withdraw from TFSA / non-registered first",
        resultBenefit: Math.round(params.amount * 0.2),
      },
    };
  }

  const reasons: string[] = [];
  if (params.primary === "tfsa") {
    reasons.push("TFSA withdrawals are tax-free and won’t raise taxable income");
    reasons.push("Helps delay OAS clawback risk");
    reasons.push("Lets RRSP/RRIF dollars keep growing");
  } else if (params.primary === "non_registered") {
    reasons.push("Only a portion of gains is taxable in a non-registered account");
    reasons.push("Preserves TFSA room psychology and RRSP deferral");
  } else if (params.primary === "rrif" || params.primary === "rrsp") {
    reasons.push(
      params.age >= 71
        ? "RRIF minimums are required — take them thoughtfully"
        : "Registered withdrawals are taxable — used after tax-free sources",
    );
  } else {
    reasons.push(`Using ${fromLabel} fits this year’s income picture`);
  }

  return {
    actionLabel: "Spend from this account",
    amount: params.amount,
    fromLabel,
    confidence: params.oasClawed > 0 ? 78 : 94,
    reasons: reasons.slice(0, 4),
    estimatedBenefit: {
      federalTaxSaved: Math.round(params.amount * 0.1),
      healthcareSaved: 0,
      lifetimeBenefit: Math.round(params.amount * 0.35 + (params.oasClawed > 0 ? 0 : 6000)),
    },
    mistakeWarning:
      params.primary === "tfsa"
        ? {
            title: "If you withdrew the same amount from your RRSP instead",
            will: [
              "Push more income into higher tax brackets",
              "Increase the chance of OAS clawback",
              "Lose tax-free compounding in the TFSA",
            ],
            estimatedCost: Math.round(params.amount * 0.28),
          }
        : undefined,
  };
}

function explainCa(year: YearPlan, optimized: boolean): string {
  const label = labelOf(year.primarySource);
  if (year.primarySource === "shortfall") {
    return "Spending need exceeds available accounts this year.";
  }
  if (!optimized) {
    return `Naive order spends from ${label} first, which often raises tax and OAS clawback risk.`;
  }
  if (year.primarySource === "tfsa") {
    return "Spend TFSA first — tax-free withdrawals help protect OAS and keep taxable income lower.";
  }
  if (year.primarySource === "non_registered") {
    return "Use non-registered investments next; only capital gains are partially taxable.";
  }
  if (year.conversions.some((c) => c.to === "rrif")) {
    return "RRSP converted to RRIF — plan for required minimum withdrawals going forward.";
  }
  return `This year leans on ${label} after income from CPP, OAS, and pensions.`;
}

function pushWarning(
  warnings: YearWarning[],
  code: WarningCode,
  severity: YearWarning["severity"],
  message: string,
) {
  if (warnings.some((w) => w.code === code)) return;
  warnings.push({ code, severity, message });
}

function summarize(mode: StrategyMode, years: YearPlan[]): StrategySummary {
  const totalTaxes = years.reduce((s, y) => s + y.federalTax + y.stateTax, 0);
  const totalPenalties = years.reduce((s, y) => s + y.penalties, 0);
  const preMedicareDrag = years
    .filter((y) => y.age < 65)
    .reduce((s, y) => s + y.federalTax + y.stateTax + y.penalties, 0);
  const last = years[years.length - 1];
  const at65 = years.find((y) => y.age === 65) ?? last;
  const depleted = years.find((y) =>
    y.warnings.some((w) => w.code === "shortfall"),
  );
  const oasClawbackYears = years.filter((y) =>
    y.warnings.some((w) => w.code === "oas_clawback"),
  ).length;

  return {
    strategyId: mode,
    label: mode === "naive" ? "Naive order" : "Optimized order",
    totalTaxes,
    totalPenalties,
    preMedicareDrag,
    yearsWithAca: years.filter((y) => y.acaEligible && y.age < 65).length,
    yearsPlanned: years.length,
    finalNetWorth: last ? last.endingNetWorth : 0,
    netWorthAt65: at65 ? at65.endingNetWorth : 0,
    yearsUntilDepletion: depleted ? depleted.yearIndex + 1 : null,
    moneyLastsUntilAge: depleted ? depleted.age : (last?.age ?? null),
    totalWithdrawn: years.reduce(
      (s, y) => s + y.withdrawals.reduce((a, w) => a + w.amount, 0),
      0,
    ),
    totalRothConversions: years.reduce(
      (s, y) => s + (y.rothConversion ?? 0),
      0,
    ),
    endingRothBalance: last?.endingBalances.tfsa ?? 0,
    endingTaxFreeBalance: last?.endingBalances.tfsa ?? 0,
    acaSubsidyLost: false,
    oasClawbackYears,
  };
}

export function simulateCanada(
  profile: RetirementProfile,
  mode: StrategyMode,
): StrategyResult {
  const balances = cloneBalances(profile.accounts);
  const years: YearPlan[] = [];
  const startAge = Math.max(profile.currentAge, profile.retirementAge);
  const endAge = Math.max(startAge, profile.planningUntilAge);
  const baseYear = new Date().getFullYear();
  const rrifAge = profile.rrifConversionAge || ASSUMPTIONS.caRrifAge;

  for (let age = startAge; age <= endAge; age += 1) {
    applyMarketShock(balances, profile, age);
    const startingBalances = cloneBalances(balances);
    const yearIndex = age - startAge;
    const need = spendingAtAge(profile, age);
    const streams = streamIncome(profile, age);
    let streamTotal = streams.reduce((s, x) => s + x.amount, 0);

    const conversions: YearPlan["conversions"] = [];
    // RRSP → RRIF at conversion age
    if (age === rrifAge && balances.rrsp > 0) {
      const amt = balances.rrsp;
      balances.rrif += amt;
      balances.rrsp = 0;
      conversions.push({ from: "rrsp", to: "rrif", amount: amt });
    }
    // LIRA → LIF roughly at same window (simplified)
    if (age === rrifAge && balances.lira > 0) {
      const amt = balances.lira;
      balances.lif += amt;
      balances.lira = 0;
      conversions.push({ from: "lira", to: "lif", amount: amt });
    }

    const rrifMin = caRrifMinimum(balances.rrif, age);
    const lifMin = caRrifMinimum(balances.lif, age) * 0.9;
    let remaining = Math.max(0, need - streamTotal);
    remaining = Math.max(remaining, rrifMin + lifMin);

    const withdrawals: WithdrawalSlice[] = [];
    // Satisfy RRIF/LIF minimums first from those accounts
    if (rrifMin > 0) {
      const slice = takeFrom(balances, "rrif", rrifMin);
      if (slice.amount > 0) {
        withdrawals.push(slice);
        remaining = Math.max(0, remaining - slice.amount);
      }
    }
    if (lifMin > 0) {
      const slice = takeFrom(balances, "lif", lifMin);
      if (slice.amount > 0) {
        withdrawals.push(slice);
        remaining = Math.max(0, remaining - slice.amount);
      }
    }

    const order = orderForMode(mode, age, balances, profile.cashReserve);
    for (const account of order) {
      if (remaining <= 0.5) break;
      const slice = takeFrom(balances, account, remaining);
      if (slice.amount > 0) {
        withdrawals.push(slice);
        remaining -= slice.amount;
      }
    }

    if (remaining > 1) {
      withdrawals.push({
        account: "shortfall",
        amount: remaining,
        taxableOrdinary: 0,
        taxableGains: 0,
        penalty: 0,
      });
    }

    const ordinaryFromWd = withdrawals.reduce((s, w) => s + w.taxableOrdinary, 0);
    const gains = withdrawals.reduce((s, w) => s + w.taxableGains, 0);
    const ordinaryIncome =
      ordinaryFromWd +
      (streams.find((s) => s.source === "pension")?.amount ?? 0) +
      (streams.find((s) => s.source === "employment")?.amount ?? 0) +
      (streams.find((s) => s.source === "cpp")?.amount ?? 0) +
      (streams.find((s) => s.source === "rental")?.amount ?? 0) +
      (streams.find((s) => s.source === "gis")?.amount ?? 0);

    let oasAmount = streams.find((s) => s.source === "oas")?.amount ?? 0;
    const incomeBeforeOasClawback = ordinaryIncome + gains * 0.5 + oasAmount;
    const clawback = caOasClawback(oasAmount, incomeBeforeOasClawback);
    oasAmount = Math.max(0, oasAmount - clawback);
    // Update stream display
    const displayStreams = streams.map((s) =>
      s.source === "oas" ? { ...s, amount: oasAmount } : s,
    );

    const tax = caEstimateTax({
      ordinary: ordinaryIncome + oasAmount,
      capitalGains: gains,
      province: profile.province,
    });

    // Fund tax from accounts (simplified one pass)
    let taxBill = tax.federal + tax.provincial;
    for (const account of orderForMode("optimized", age, balances, profile.cashReserve)) {
      if (taxBill <= 0.5) break;
      const slice = takeFrom(balances, account, taxBill);
      if (slice.amount > 0) {
        withdrawals.push(slice);
        taxBill -= slice.amount;
      }
    }

    growBalances(balances, profile);
    const endingBalances = cloneBalances(balances);
    const endingNetWorth = netWorthOf(endingBalances);
    const primarySource = primaryFrom(withdrawals, displayStreams);
    const spendAmt = withdrawals
      .filter((w) => w.account !== "shortfall")
      .reduce((s, w) => s + w.amount, 0);

    const warnings: YearWarning[] = [];
    if (clawback > 0) {
      pushWarning(
        warnings,
        "oas_clawback",
        "critical",
        `OAS clawback of about $${Math.round(clawback).toLocaleString("en-CA")} this year.`,
      );
    }
    if (rrifMin > 0) {
      pushWarning(
        warnings,
        "rrif_minimum",
        "info",
        `RRIF minimum about $${Math.round(rrifMin).toLocaleString("en-CA")} included.`,
      );
    }
    if (
      mode === "optimized" &&
      age < profile.cppClaimAge &&
      age >= 60
    ) {
      pushWarning(
        warnings,
        "cpp_delayed",
        "info",
        `CPP delayed until ${profile.cppClaimAge} to improve sequencing.`,
      );
    }
    if (mode === "optimized" && primarySource === "tfsa") {
      pushWarning(
        warnings,
        "tfsa_opportunity",
        "info",
        "TFSA used first to keep taxable income lower.",
      );
    }
    if (tax.federal + tax.provincial > need * 0.2) {
      pushWarning(
        warnings,
        "high_tax_cost",
        "warning",
        "Tax burden is elevated relative to spending this year.",
      );
    }
    if (remaining > 1) {
      pushWarning(
        warnings,
        "shortfall",
        "critical",
        `Unable to fully fund $${Math.round(remaining).toLocaleString("en-CA")} of spending.`,
      );
    }

    const status =
      clawback > 0
        ? "oas_clawback"
        : tax.federal + tax.provincial > need * 0.2
          ? "high_tax"
          : warnings.some((w) => w.severity === "warning")
            ? "acceptable"
            : "optimal";

    const recommendation = buildCaRecommendation({
      mode,
      age,
      primary: primarySource,
      amount: spendAmt,
      oasClawed: clawback,
      taxBracket: tax.bracket,
    });

    const year: YearPlan = {
      age,
      calendarYear: baseYear + (age - profile.currentAge),
      yearIndex,
      status,
      spendingNeed: need,
      withdrawals,
      conversions,
      incomeStreams: displayStreams,
      ordinaryIncome: ordinaryIncome + oasAmount,
      capitalGains: gains,
      federalTax: tax.federal,
      stateTax: tax.provincial,
      penalties: 0,
      magi: incomeBeforeOasClawback,
      acaEligible: clawback === 0,
      acaLabel:
        age < 65
          ? "Pre-OAS years"
          : clawback > 0
            ? "OAS clawback risk"
            : "OAS intact",
      taxBracket: tax.bracket,
      rmd: rrifMin + lifMin,
      startingBalances,
      endingBalances,
      endingNetWorth,
      warnings,
      primarySource,
      explanation: "",
      recommendation,
      rothConversion: conversions.find((c) => c.to === "rrif")?.amount,
    };
    year.explanation = explainCa(year, mode === "optimized");
    years.push(year);
  }

  return { summary: summarize(mode, years), years };
}
