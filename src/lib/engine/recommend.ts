import { ASSUMPTIONS } from "./assumptions";
import type {
  AccountKey,
  IncomeStreamKey,
  RetirementProfile,
  YearRecommendation,
  YearStatus,
  YearWarning,
} from "./types";

const LABELS: Record<string, string> = {
  cash: "Cash",
  brokerage: "Brokerage Account",
  traditional_401k: "401(k)",
  traditional_ira: "Traditional IRA",
  roth_ira: "Roth IRA",
  non_registered: "Non-registered account",
  rrsp: "RRSP",
  tfsa: "TFSA",
  fhsa: "FHSA",
  lira: "LIRA",
  lif: "LIF",
  rrif: "RRIF",
  pension: "Pension",
  social_security: "Social Security",
  employment: "Employment",
  cpp: "CPP",
  oas: "OAS",
  gis: "GIS",
  rental: "Rental income",
  shortfall: "Shortfall",
  mixed: "Mixed sources",
};

export function yearStatus(params: {
  acaEligible: boolean;
  age: number;
  penalties: number;
  federalTax: number;
  spendingNeed: number;
  warnings: YearWarning[];
}): YearStatus {
  if (params.penalties > 0) return "early_penalty";
  if (params.warnings.some((w) => w.code === "oas_clawback")) {
    return "oas_clawback";
  }
  if (params.age < ASSUMPTIONS.medicareAge && !params.acaEligible) {
    return "aca_lost";
  }
  if (params.federalTax > params.spendingNeed * 0.18) return "high_tax";
  if (params.warnings.some((w) => w.severity === "warning")) return "acceptable";
  return "optimal";
}

export function buildRecommendation(params: {
  mode: "naive" | "optimized";
  age: number;
  profile: RetirementProfile;
  primarySource: AccountKey | IncomeStreamKey | "mixed" | "shortfall";
  withdrawAmount: number;
  conversionAmount: number;
  acaEligible: boolean;
  penalties: number;
  taxBracket: number;
  federalTax: number;
}): YearRecommendation {
  const {
    mode,
    age,
    primarySource,
    withdrawAmount,
    conversionAmount,
    acaEligible,
    penalties,
    taxBracket,
    federalTax,
  } = params;

  const fromLabel = LABELS[primarySource] ?? "Mixed sources";

  if (mode === "naive") {
    return {
      actionLabel: "Take money out",
      amount: withdrawAmount,
      fromLabel,
      confidence: 34,
      reasons: [
        "This is the common guess: use retirement accounts first",
        "It doesn’t protect healthcare subsidy limits",
        penalties > 0
          ? "It can trigger an early withdrawal penalty before 59½"
          : "It usually creates more taxable income than needed",
      ],
      estimatedBenefit: {
        federalTaxSaved: 0,
        healthcareSaved: 0,
        lifetimeBenefit: 0,
      },
      mistakeWarning: {
        title: `Taking ${formatMoney(withdrawAmount)} from ${fromLabel}`,
        will: [
          ...(penalties > 0 ? ["Trigger early-withdrawal penalties"] : []),
          ...(!acaEligible && age < ASSUMPTIONS.medicareAge
            ? ["Lose ACA subsidy eligibility"]
            : []),
          "Increase ordinary taxable income unnecessarily",
        ],
        estimatedCost: Math.round(
          penalties +
            (!acaEligible && age < ASSUMPTIONS.medicareAge
              ? ASSUMPTIONS.acaAnnualSubsidyValue
              : 0) +
            federalTax * 0.35,
        ),
      },
      alternative: {
        instead: "Withdraw from brokerage / Roth bridge first",
        resultBenefit: Math.round(
          penalties +
            (!acaEligible && age < ASSUMPTIONS.medicareAge
              ? ASSUMPTIONS.acaAnnualSubsidyValue
              : 4_000),
        ),
      },
    };
  }

  const reasons: string[] = [];
  if (primarySource === "brokerage") {
    reasons.push("Keeps taxable ordinary income below the ACA limit");
    reasons.push("Preserves Roth compounding for later years");
    reasons.push(
      taxBracket <= 0.12
        ? "Stays in a lower ordinary tax bracket"
        : "Avoids filling higher ordinary brackets with IRA withdrawals",
    );
    reasons.push("Reduces pressure to take large traditional withdrawals early");
  } else if (primarySource === "roth_ira") {
    reasons.push("Tax-free Roth bridge keeps MAGI ACA-friendly");
    reasons.push("Avoids early-withdrawal penalties on traditional accounts");
    reasons.push("Lets traditional balances keep growing until 59½+");
  } else if (primarySource === "cash") {
    reasons.push("Uses excess cash above your reserve target");
    reasons.push("Avoids selling investments in a sequencing-sensitive year");
  } else if (
    primarySource === "traditional_401k" ||
    primarySource === "traditional_ira"
  ) {
    reasons.push(
      age >= ASSUMPTIONS.earlyWithdrawalAge
        ? "Penalty-free traditional access after 59½"
        : "Rule of 55 / plan rules allow this withdrawal without penalty",
    );
    reasons.push("Funds spending after more tax-efficient sources");
  } else {
    reasons.push("Blends available income streams with sequenced withdrawals");
  }

  if (conversionAmount > 0) {
    reasons.push(
      `Converts ${formatMoney(conversionAmount)} to Roth while income headroom exists`,
    );
  }

  const healthcareSaved =
    acaEligible && age < ASSUMPTIONS.medicareAge
      ? ASSUMPTIONS.acaAnnualSubsidyValue
      : 0;
  const federalTaxSaved = Math.round(
    Math.max(2_400, withdrawAmount * 0.12 - federalTax * 0.15),
  );

  return {
    actionLabel:
      conversionAmount > 0
        ? "Spend, then optionally convert to Roth"
        : "Spend from this account",
    amount: withdrawAmount,
    fromLabel,
    confidence: acaEligible && penalties === 0 ? 96 : penalties === 0 ? 88 : 62,
    reasons: reasons.slice(0, 4),
    estimatedBenefit: {
      federalTaxSaved,
      healthcareSaved,
      lifetimeBenefit: Math.round(
        federalTaxSaved * 6 + healthcareSaved * 4 + (penalties === 0 ? 8_000 : 0),
      ),
    },
    alternative: {
      instead: "Partial Roth + brokerage mix if markets are volatile",
      resultBenefit: Math.round(federalTaxSaved * 0.45),
    },
    mistakeWarning:
      primarySource === "brokerage"
        ? {
            title: `Taking the same ${formatMoney(withdrawAmount)} from a traditional IRA instead`,
            will: [
              "Push MAGI over the ACA subsidy threshold",
              `Fill the ${Math.round(taxBracket * 100)}% ordinary bracket faster`,
              "Create avoidable tax drag before Medicare",
            ],
            estimatedCost: Math.round(
              ASSUMPTIONS.acaAnnualSubsidyValue + federalTaxSaved,
            ),
          }
        : undefined,
  };
}

function formatMoney(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}
