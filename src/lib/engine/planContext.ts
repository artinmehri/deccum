import { compareStrategies } from "./compare";
import type { RetirementProfile } from "./types";
import { formatCurrency } from "@/lib/format";

/** Compact, factual snapshot the LLM must ground answers in. */
export function buildPlanContext(profile: RetirementProfile): string {
  const result = compareStrategies(profile);
  const opt = result.optimized;
  const naive = result.naive;
  const year = opt.years[0];
  const mid = opt.years.find((y) => y.age === 65) ?? opt.years[Math.floor(opt.years.length / 2)];

  const earlyYears = opt.years.slice(0, 8).map((y) => ({
    age: y.age,
    primary: y.primarySource,
    spendFrom: y.recommendation.fromLabel,
    amount: Math.round(y.recommendation.amount),
    federalTax: Math.round(y.federalTax),
    stateTax: Math.round(y.stateTax),
    penalties: Math.round(y.penalties),
    aca: y.acaLabel,
    status: y.status,
    endingNetWorth: Math.round(y.endingNetWorth),
    explanation: y.explanation,
    reasons: y.recommendation.reasons,
  }));

  return JSON.stringify(
    {
      profile: {
        currentAge: profile.currentAge,
        retirementAge: profile.retirementAge,
        planningUntilAge: profile.planningUntilAge,
        annualSpendingNeed: profile.annualSpendingNeed,
        filingStatus: profile.filingStatus,
        leftEmployerAtAge: profile.leftEmployerAtAge,
        socialSecurityClaimAge: profile.socialSecurityClaimAge,
        socialSecurityAnnualAtClaimAge: profile.socialSecurityAnnualAtClaimAge,
        pensionStartAge: profile.pensionStartAge,
        pensionAnnual: profile.pensionAnnual,
        accounts: profile.accounts,
        inflationRate: profile.inflationRate,
        investmentReturn: profile.investmentReturn,
        cashReserve: profile.cashReserve,
        partTimeIncome: profile.partTimeIncome,
        partTimeUntilAge: profile.partTimeUntilAge,
        oneTimeExpenses: profile.oneTimeExpenses,
      },
      optimizedSummary: {
        moneyLastsUntilAge: opt.summary.moneyLastsUntilAge,
        netWorthAt65: Math.round(opt.summary.netWorthAt65),
        totalTaxes: Math.round(opt.summary.totalTaxes),
        totalPenalties: Math.round(opt.summary.totalPenalties),
        preMedicareDrag: Math.round(opt.summary.preMedicareDrag),
        yearsWithAca: opt.summary.yearsWithAca,
        acaSubsidyLost: opt.summary.acaSubsidyLost,
        endingRothBalance: Math.round(opt.summary.endingRothBalance),
      },
      naiveSummary: {
        moneyLastsUntilAge: naive.summary.moneyLastsUntilAge,
        netWorthAt65: Math.round(naive.summary.netWorthAt65),
        totalPenalties: Math.round(naive.summary.totalPenalties),
        preMedicareDrag: Math.round(naive.summary.preMedicareDrag),
        acaSubsidyLost: naive.summary.acaSubsidyLost,
      },
      deltas: {
        preMedicareDragSavings: Math.round(result.deltas.preMedicareDragSavings),
        penaltySavings: Math.round(result.deltas.penaltySavings),
        netWorthAt65Improvement: Math.round(result.deltas.netWorthAt65Improvement),
        extraAcaYears: result.deltas.extraAcaYears,
      },
      thisYear: year
        ? {
            age: year.age,
            calendarYear: year.calendarYear,
            recommendation: year.recommendation.actionLabel,
            from: year.recommendation.fromLabel,
            amount: Math.round(year.recommendation.amount),
            confidence: year.recommendation.confidence,
            reasons: year.recommendation.reasons,
            explanation: year.explanation,
            taxes: formatCurrency(year.federalTax + year.stateTax),
            endingNetWorth: formatCurrency(year.endingNetWorth),
          }
        : null,
      at65: mid
        ? {
            age: mid.age,
            endingNetWorth: Math.round(mid.endingNetWorth),
            primarySource: mid.primarySource,
          }
        : null,
      earlyTimeline: earlyYears,
      notes:
        "Numbers come from Deccum's simplified sequencing engine (hackathon assumptions). Not tax, legal, or investment advice.",
    },
    null,
    2,
  );
}
