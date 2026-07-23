import { compareStrategies } from "./compare";
import { simulateStrategy } from "./simulate";
import type { ComparisonResult, RetirementProfile } from "./types";
import { formatCurrency } from "@/lib/format";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function cloneProfile(profile: RetirementProfile): RetirementProfile {
  return {
    ...profile,
    accounts: { ...profile.accounts },
    oneTimeExpenses: profile.oneTimeExpenses.map((e) => ({ ...e })),
  };
}

function answerFromComparison(
  base: ComparisonResult,
  variant: ComparisonResult,
  headline: string,
): string {
  const b = base.optimized.summary;
  const v = variant.optimized.summary;
  const wealthDelta = v.netWorthAt65 - b.netWorthAt65;
  const lastsBase = b.moneyLastsUntilAge ?? base.profile.planningUntilAge;
  const lastsVar = v.moneyLastsUntilAge ?? variant.profile.planningUntilAge;

  return [
    headline,
    "",
    `• Wealth at 65: ${formatCurrency(b.netWorthAt65)} → ${formatCurrency(v.netWorthAt65)} (${wealthDelta >= 0 ? "+" : ""}${formatCurrency(wealthDelta)})`,
    `• Money lasts until: age ${lastsBase} → age ${lastsVar}`,
    base.profile.country === "CA"
      ? `• OAS clawback years: ${b.oasClawbackYears ?? 0} → ${v.oasClawbackYears ?? 0}`
      : `• Healthcare subsidy risk: ${v.acaSubsidyLost ? "Yes" : "No"}`,
    "",
    "Based on your Deccum plan. Educational only — not tax advice.",
  ].join("\n");
}

function generalPlanAnswer(profile: RetirementProfile): string {
  const base = compareStrategies(profile);
  const year =
    base.optimized.years.find((y) => y.age === profile.retirementAge) ??
    base.optimized.years[0];
  const opt = base.optimized.summary;
  const lasts = opt.moneyLastsUntilAge ?? profile.planningUntilAge;

  return [
    `This year, take about ${formatCurrency(year.recommendation.amount)} from your ${year.recommendation.fromLabel}.`,
    year.recommendation.reasons[0] ?? year.explanation,
    "",
    `• Money lasts until about age ${lasts}`,
    `• About ${formatCurrency(opt.netWorthAt65)} projected at age 65`,
    `• Recommended plan avoids ${formatCurrency(base.deltas.penaltySavings)} in early-withdrawal penalties vs the common guess`,
  ].join("\n");
}

export function answerPlanQuestion(
  profile: RetirementProfile,
  question: string,
): string {
  const q = question.toLowerCase().trim();
  const base = compareStrategies(profile);
  const year =
    base.optimized.years.find((y) => y.age === profile.retirementAge) ??
    base.optimized.years[0];

  if (!q) {
    return profile.country === "CA"
      ? "Ask about your age, this year’s withdrawal, retiring earlier, TFSA vs RRSP, CPP, OAS, or a market drop."
      : "Ask about your age, this year’s withdrawal, retiring earlier, Roth conversions, Social Security, or a market drop.";
  }

  // Direct factual answers
  if (
    (q.includes("my age") || q === "age" || q.includes("how old")) &&
    !q.includes("retire")
  ) {
    return `You’re ${profile.currentAge} in this plan, with retirement set at ${profile.retirementAge}.`;
  }

  if (q.includes("how long") || q.includes("last") || q.includes("run out")) {
    const lasts =
      base.optimized.summary.moneyLastsUntilAge ?? profile.planningUntilAge;
    return `With the recommended withdrawal order, your money lasts until about age ${lasts}. At 65, you’d have roughly ${formatCurrency(base.optimized.summary.netWorthAt65)} left.`;
  }

  if (q.includes("on track") || q.includes("am i ok") || q.includes("healthy")) {
    const penalties = base.optimized.summary.totalPenalties;
    const lasts =
      base.optimized.summary.moneyLastsUntilAge ?? profile.planningUntilAge;
    if (penalties === 0 && lasts >= profile.planningUntilAge - 2) {
      return `You’re on track. The recommended order funds spending through about age ${lasts} without early-withdrawal penalties.`;
    }
    return `Mostly on track, with a few items to watch. Money lasts until about age ${lasts}. Open Overview for the full health check.`;
  }

  if (
    q.includes("retire") &&
    (q.includes("earlier") ||
      q.includes("one year") ||
      q.includes("year earlier"))
  ) {
    const variantProfile = cloneProfile(profile);
    variantProfile.retirementAge = Math.max(50, profile.retirementAge - 1);
    variantProfile.currentAge = Math.min(
      variantProfile.currentAge,
      variantProfile.retirementAge,
    );
    const variant = compareStrategies(variantProfile);
    return answerFromComparison(
      base,
      variant,
      `If you retire at ${variantProfile.retirementAge} instead of ${profile.retirementAge}:`,
    );
  }

  if (
    q.includes("vacation") ||
    q.includes("home") ||
    q.includes("house") ||
    (q.includes("buy") && q.includes("home"))
  ) {
    const variantProfile = cloneProfile(profile);
    const age = profile.retirementAge + 2;
    variantProfile.oneTimeExpenses = [
      ...variantProfile.oneTimeExpenses,
      {
        id: "chat-vacation-home",
        age,
        label: "Large purchase",
        amount: 250_000,
      },
    ];
    const variant = compareStrategies(variantProfile);
    return answerFromComparison(
      base,
      variant,
      `If you spend $250,000 at age ${age}:`,
    );
  }

  if (q.includes("roth") && (q.includes("convert") || q.includes("conversion"))) {
    if (profile.country === "CA") {
      return `In Canada, Roth conversions don’t apply. Your plan converts RRSP into RRIF around age ${profile.rrifConversionAge}, then takes required minimum withdrawals. Prefer TFSA withdrawals when you want spending without raising taxable income.`;
    }
    const withConv = cloneProfile(profile);
    withConv.executeRothConversions = true;
    const without = cloneProfile(profile);
    without.executeRothConversions = false;
    const a = simulateStrategy(withConv, "optimized");
    const b = simulateStrategy(without, "optimized");
    const yearWith = a.years.find((y) => (y.rothConversion ?? 0) > 0);
    return [
      yearWith
        ? `Your plan shows conversion room around age ${yearWith.age}: about ${formatCurrency(yearWith.rothConversion ?? 0)}.`
        : "Your current income path leaves limited Roth conversion room before Medicare.",
      `Ending Roth with conversions on: ${formatCurrency(a.summary.endingRothBalance)} · off: ${formatCurrency(b.summary.endingRothBalance)}.`,
    ].join("\n");
  }

  if (
    profile.country === "CA" &&
    (q.includes("tfsa") ||
      q.includes("rrsp") ||
      q.includes("rrif") ||
      (q.includes("withdraw") && q.includes("first")))
  ) {
    return [
      `At age ${year.age}, take about ${formatCurrency(year.recommendation.amount)} from your ${year.recommendation.fromLabel}.`,
      year.recommendation.reasons[0] ?? year.explanation,
      `RRSP → RRIF is planned around age ${profile.rrifConversionAge}. TFSA withdrawals don’t raise taxable income; RRSP/RRIF withdrawals do.`,
    ].join("\n");
  }

  if (
    profile.country === "CA" &&
    (q.includes("cpp") ||
      (q.includes("delay") && q.includes("cpp")) ||
      q.includes("oas"))
  ) {
    const variantProfile = cloneProfile(profile);
    variantProfile.cppClaimAge = Math.min(
      70,
      Math.max(profile.cppClaimAge + 1, 65),
    );
    if (variantProfile.cppClaimAge === profile.cppClaimAge) {
      variantProfile.cppClaimAge = 70;
    }
    const variant = compareStrategies(variantProfile);
    return answerFromComparison(
      base,
      variant,
      `If you claim CPP at ${variantProfile.cppClaimAge} instead of ${profile.cppClaimAge}:`,
    );
  }

  if (
    q.includes("gift") ||
    q.includes("daughter") ||
    q.includes("30k") ||
    q.includes("30,000")
  ) {
    const variantProfile = cloneProfile(profile);
    variantProfile.oneTimeExpenses = [
      ...variantProfile.oneTimeExpenses,
      {
        id: "chat-gift",
        age: profile.retirementAge,
        label: "Gift",
        amount: 30_000,
      },
    ];
    const variant = compareStrategies(variantProfile);
    return answerFromComparison(
      base,
      variant,
      "If you gift $30,000 in your first retirement year:",
    );
  }

  if (
    q.includes("market") ||
    q.includes("drop") ||
    q.includes("crash") ||
    q.includes("25%")
  ) {
    const variantProfile = cloneProfile(profile);
    variantProfile.marketShockAge = profile.retirementAge + 1;
    variantProfile.marketShockDrawdown = -0.25;
    const variant = compareStrategies(variantProfile);
    return answerFromComparison(
      base,
      variant,
      `If markets drop 25% at age ${variantProfile.marketShockAge}:`,
    );
  }

  if (
    q.includes("social security") ||
    q.includes("delay ss") ||
    (q.includes("delay") && q.includes("social"))
  ) {
    const variantProfile = cloneProfile(profile);
    variantProfile.socialSecurityClaimAge = Math.min(
      70,
      Math.max(profile.socialSecurityClaimAge + 1, 67),
    );
    if (variantProfile.socialSecurityClaimAge === profile.socialSecurityClaimAge) {
      variantProfile.socialSecurityClaimAge = 70;
    }
    const variant = compareStrategies(variantProfile);
    return answerFromComparison(
      base,
      variant,
      `If you claim Social Security at ${variantProfile.socialSecurityClaimAge} instead of ${profile.socialSecurityClaimAge}:`,
    );
  }

  if (q.includes("part-time") || q.includes("part time")) {
    const variantProfile = cloneProfile(profile);
    variantProfile.partTimeIncome = 35_000;
    variantProfile.partTimeUntilAge = Math.min(65, profile.retirementAge + 5);
    const variant = compareStrategies(variantProfile);
    return answerFromComparison(
      base,
      variant,
      `If you earn ${formatCurrency(35000)}/year part-time until ${variantProfile.partTimeUntilAge}:`,
    );
  }

  if (
    q.includes("withdraw") ||
    q.includes("this year") ||
    q.includes("what should") ||
    q.includes("which account") ||
    q.includes("401") ||
    q.includes("brokerage")
  ) {
    return [
      `At age ${year.age}, take about ${formatCurrency(year.recommendation.amount)} from your ${year.recommendation.fromLabel}.`,
      year.recommendation.reasons[0] ?? year.explanation,
      `Taxes this year: about ${formatCurrency(year.federalTax + year.stateTax)}. Money left after: ${formatCurrency(year.endingNetWorth)}.`,
    ].join("\n");
  }

  return generalPlanAnswer(profile);
}
