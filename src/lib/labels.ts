import type {
  AccountKey,
  CountryCode,
  IncomeStreamKey,
  WarningCode,
  YearStatus,
} from "@/lib/engine";

const BASE_ACCOUNT_LABELS: Record<
  AccountKey | IncomeStreamKey | "shortfall" | "mixed",
  string
> = {
  cash: "Cash",
  brokerage: "Brokerage",
  traditional_401k: "401(k)",
  traditional_ira: "Traditional IRA",
  roth_ira: "Roth IRA",
  non_registered: "Non-registered",
  rrsp: "RRSP",
  tfsa: "TFSA",
  fhsa: "FHSA",
  lira: "LIRA",
  lif: "LIF",
  rrif: "RRIF",
  pension: "Pension",
  social_security: "Social Security",
  employment: "Part-time work",
  cpp: "CPP",
  oas: "OAS",
  gis: "GIS",
  rental: "Rental income",
  shortfall: "Not fully funded",
  mixed: "A few accounts",
};

/** @deprecated Prefer accountLabel(country, key) — kept for charts */
export const ACCOUNT_LABELS = BASE_ACCOUNT_LABELS;

export function accountLabel(
  country: CountryCode | undefined,
  key: AccountKey | IncomeStreamKey | "shortfall" | "mixed",
): string {
  void country;
  return BASE_ACCOUNT_LABELS[key] ?? key;
}

export const ACCOUNT_COLORS: Record<AccountKey | IncomeStreamKey, string> = {
  cash: "#94a3b8",
  brokerage: "#0d7a5f",
  traditional_401k: "#1d4e89",
  traditional_ira: "#3b82f6",
  roth_ira: "#a8842f",
  non_registered: "#0d7a5f",
  rrsp: "#1d4e89",
  tfsa: "#a8842f",
  fhsa: "#c4a35a",
  lira: "#6366f1",
  lif: "#8b5cf6",
  rrif: "#3b82f6",
  pension: "#7c3aed",
  social_security: "#0ea5e9",
  employment: "#64748b",
  cpp: "#0ea5e9",
  oas: "#0284c7",
  gis: "#38bdf8",
  rental: "#78716c",
};

export const WARNING_LABELS: Record<WarningCode, string> = {
  aca_subsidy_lost: "Healthcare help at risk",
  early_withdrawal_penalty: "Early withdrawal penalty",
  traditional_tax_spike: "Taxes jump this year",
  cash_exhausted: "Cash cushion is gone",
  social_security_delayed: "Social Security starts later",
  roth_conversion_opportunity: "Good year to convert to Roth",
  shortfall: "Money may run short",
  rule_of_55_used: "Rule of 55 applies",
  rmd_due: "Required withdrawal (RMD)",
  high_tax_cost: "Taxes look high",
  oas_clawback: "OAS clawback",
  rrif_minimum: "RRIF minimum withdrawal",
  cpp_delayed: "CPP delayed",
  tfsa_opportunity: "TFSA used first",
};

export const STATUS_META: Record<
  YearStatus,
  { label: string; hint: string; className: string; dot: string }
> = {
  optimal: {
    label: "Looking good",
    hint: "This year follows a low-cost path.",
    className: "bg-accent-soft text-accent-deep border-accent/15",
    dot: "bg-accent",
  },
  acceptable: {
    label: "Worth a look",
    hint: "Fine overall, with a detail to review.",
    className: "bg-warn-soft text-warn border-warn/20",
    dot: "bg-warn",
  },
  high_tax: {
    label: "Higher taxes",
    hint: "Taxes take a bigger bite this year.",
    className: "bg-danger-soft text-danger border-danger/15",
    dot: "bg-danger",
  },
  aca_lost: {
    label: "Healthcare risk",
    hint: "Income may reduce healthcare subsidies.",
    className: "bg-danger-soft text-danger border-danger/15",
    dot: "bg-danger",
  },
  early_penalty: {
    label: "Penalty risk",
    hint: "An early withdrawal penalty may apply.",
    className: "bg-danger-soft text-danger border-danger/15",
    dot: "bg-danger",
  },
  oas_clawback: {
    label: "OAS clawback",
    hint: "Income may reduce Old Age Security.",
    className: "bg-danger-soft text-danger border-danger/15",
    dot: "bg-danger",
  },
};

export function chartAccountKeys(country: CountryCode): AccountKey[] {
  if (country === "CA") {
    return [
      "tfsa",
      "non_registered",
      "rrsp",
      "rrif",
      "fhsa",
      "lira",
      "lif",
      "cash",
    ];
  }
  return [
    "brokerage",
    "roth_ira",
    "traditional_401k",
    "traditional_ira",
    "cash",
  ];
}

export function chartIncomeKeys(country: CountryCode): IncomeStreamKey[] {
  if (country === "CA") {
    return ["cpp", "oas", "gis", "pension", "employment", "rental"];
  }
  return ["social_security", "pension", "employment"];
}
