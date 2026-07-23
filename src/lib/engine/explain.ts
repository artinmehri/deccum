import type { AccountKey, IncomeStreamKey, YearPlan } from "./types";

const ACCOUNT_LABELS: Record<
  AccountKey | IncomeStreamKey | "shortfall" | "mixed",
  string
> = {
  cash: "cash reserves",
  brokerage: "taxable brokerage",
  traditional_401k: "traditional 401(k)",
  traditional_ira: "traditional IRA",
  roth_ira: "Roth IRA",
  non_registered: "non-registered investments",
  rrsp: "RRSP",
  tfsa: "TFSA",
  fhsa: "FHSA",
  lira: "LIRA",
  lif: "LIF",
  rrif: "RRIF",
  pension: "pension income",
  social_security: "Social Security",
  employment: "part-time employment",
  cpp: "CPP",
  oas: "OAS",
  gis: "GIS",
  rental: "rental income",
  shortfall: "unfunded spending",
  mixed: "mixed sources",
};

export function explainYear(year: YearPlan, optimized: boolean): string {
  const primary = year.primarySource;
  const label = ACCOUNT_LABELS[primary] ?? "mixed sources";

  if (primary === "shortfall") {
    return "Spending need exceeds available accounts this year — portfolio may be depleted.";
  }

  if (!optimized) {
    if (year.penalties > 0) {
      return `Naive order pulls from ${label} first, triggering early-withdrawal penalties.`;
    }
    return `Naive order spends from ${label} without protecting ACA income limits.`;
  }

  if (year.rothConversion && year.rothConversion > 0) {
    return `Spend from ${label} this year — and consider a Roth conversion while taxable income is still relatively low.`;
  }

  if (primary === "brokerage") {
    return "Spend taxable brokerage first to keep ordinary income lower and preserve ACA subsidy eligibility.";
  }

  if (primary === "traditional_401k") {
    return "Rule of 55 allows penalty-free 401(k) access after leaving your employer at 52+.";
  }

  if (primary === "roth_ira") {
    return "Use Roth IRA for tax-free bridge years so taxable income stays under the ACA threshold.";
  }

  if (primary === "traditional_ira") {
    return "Traditional IRA withdrawals after 59½ avoid the 10% penalty while covering spending.";
  }

  if (primary === "cash") {
    return "Tap cash carefully as a short-term bridge while investment accounts keep compounding.";
  }

  if (primary === "social_security" || primary === "pension") {
    return `Stable ${label} reduces how much you need to sell from investment accounts.`;
  }

  return `Blend withdrawals with ${label} as the primary source this year.`;
}

export function explainStrategyDifference(params: {
  taxSavings: number;
  penaltySavings: number;
  preMedicareDragSavings?: number;
  netWorthImprovement: number;
  netWorthAt65Improvement?: number;
  extraAcaYears: number;
}): string {
  const parts: string[] = [];
  const drag = params.preMedicareDragSavings ?? params.taxSavings;

  if (drag > 0) {
    parts.push(
      `cutting pre-Medicare tax & penalty drag by roughly $${Math.round(drag).toLocaleString()}`,
    );
  } else if (params.penaltySavings > 0) {
    parts.push(
      `avoiding about $${Math.round(params.penaltySavings).toLocaleString()} in early-withdrawal penalties`,
    );
  }
  if (params.extraAcaYears > 0) {
    parts.push(
      `keeping ACA subsidy eligibility for ${params.extraAcaYears} more year(s)`,
    );
  }
  if ((params.netWorthAt65Improvement ?? 0) > 0) {
    parts.push(
      `holding about $${Math.round(params.netWorthAt65Improvement!).toLocaleString()} more at age 65`,
    );
  } else if (params.netWorthImprovement > 0) {
    parts.push(
      `ending with about $${Math.round(params.netWorthImprovement).toLocaleString()} more wealth`,
    );
  }

  if (parts.length === 0) {
    return "Both sequences fund retirement, but the optimized order still smooths taxable income.";
  }

  return `The optimized sequence improves outcomes by ${parts.join(", ")}.`;
}
