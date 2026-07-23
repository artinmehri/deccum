export type CountryCode = "US" | "CA";

export type CanadianProvince =
  | "ON"
  | "BC"
  | "AB"
  | "QC"
  | "MB"
  | "SK"
  | "NS"
  | "NB"
  | "NL"
  | "PE"
  | "NT"
  | "YT"
  | "NU";

export type AccountKey =
  // Shared
  | "cash"
  // United States
  | "brokerage"
  | "traditional_401k"
  | "traditional_ira"
  | "roth_ira"
  // Canada
  | "non_registered"
  | "rrsp"
  | "tfsa"
  | "fhsa"
  | "lira"
  | "lif"
  | "rrif";

export type IncomeStreamKey =
  | "pension"
  | "employment"
  | "social_security"
  | "cpp"
  | "oas"
  | "gis"
  | "rental";

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married"; // Canada couple filing (simplified)

export type YearStatus =
  | "optimal"
  | "acceptable"
  | "high_tax"
  | "aca_lost"
  | "early_penalty"
  | "oas_clawback";

export interface OneTimeExpense {
  id: string;
  age: number;
  label: string;
  amount: number;
}

export interface RetirementProfile {
  country: CountryCode;
  /** Canadian province for provincial tax (architecture-ready) */
  province: CanadianProvince;
  currentAge: number;
  retirementAge: number;
  planningUntilAge: number;
  annualSpendingNeed: number;
  filingStatus: FilingStatus;
  /** US: employer separation age for Rule of 55 */
  leftEmployerAtAge: number;
  /** US Social Security */
  socialSecurityClaimAge: number;
  socialSecurityAnnualAtClaimAge: number;
  /** Canada CPP / OAS */
  cppClaimAge: number;
  cppAnnualAtClaimAge: number;
  oasStartAge: number;
  oasAnnual: number;
  gisAnnual: number;
  pensionStartAge: number;
  pensionAnnual: number;
  rentalAnnual: number;
  accounts: Record<AccountKey, number>;
  inflationRate: number;
  investmentReturn: number;
  cashReserve: number;
  partTimeIncome: number;
  partTimeUntilAge: number;
  /** US state / CA provincial marginal proxy */
  stateTaxRate: number;
  executeRothConversions: boolean;
  /** Canada: convert RRSP → RRIF at this age (default 71) */
  rrifConversionAge: number;
  oneTimeExpenses: OneTimeExpense[];
  marketShockAge: number | null;
  marketShockDrawdown: number;
}

export interface WithdrawalSlice {
  account: AccountKey | IncomeStreamKey | "shortfall";
  amount: number;
  taxableOrdinary: number;
  taxableGains: number;
  penalty: number;
}

export type WarningCode =
  | "aca_subsidy_lost"
  | "early_withdrawal_penalty"
  | "traditional_tax_spike"
  | "cash_exhausted"
  | "social_security_delayed"
  | "roth_conversion_opportunity"
  | "shortfall"
  | "rule_of_55_used"
  | "rmd_due"
  | "high_tax_cost"
  | "oas_clawback"
  | "rrif_minimum"
  | "cpp_delayed"
  | "tfsa_opportunity";

export interface YearWarning {
  code: WarningCode;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface YearRecommendation {
  actionLabel: string;
  amount: number;
  fromLabel: string;
  confidence: number;
  reasons: string[];
  estimatedBenefit: {
    federalTaxSaved: number;
    healthcareSaved: number;
    lifetimeBenefit: number;
  };
  alternative?: {
    instead: string;
    resultBenefit: number;
  };
  mistakeWarning?: {
    title: string;
    will: string[];
    estimatedCost: number;
  };
}

export interface YearPlan {
  age: number;
  calendarYear: number;
  yearIndex: number;
  status: YearStatus;
  spendingNeed: number;
  withdrawals: WithdrawalSlice[];
  conversions: { from: AccountKey; to: AccountKey; amount: number }[];
  incomeStreams: { source: IncomeStreamKey; amount: number }[];
  ordinaryIncome: number;
  capitalGains: number;
  federalTax: number;
  stateTax: number;
  penalties: number;
  magi: number;
  acaEligible: boolean;
  acaLabel: string;
  taxBracket: number;
  /** US RMD or Canada RRIF minimum */
  rmd: number;
  startingBalances: Record<AccountKey, number>;
  endingBalances: Record<AccountKey, number>;
  endingNetWorth: number;
  warnings: YearWarning[];
  primarySource: AccountKey | IncomeStreamKey | "mixed" | "shortfall";
  explanation: string;
  recommendation: YearRecommendation;
  rothConversion?: number;
}

export interface StrategySummary {
  strategyId: "naive" | "optimized";
  label: string;
  totalTaxes: number;
  totalPenalties: number;
  preMedicareDrag: number;
  yearsWithAca: number;
  yearsPlanned: number;
  finalNetWorth: number;
  netWorthAt65: number;
  yearsUntilDepletion: number | null;
  moneyLastsUntilAge: number | null;
  totalWithdrawn: number;
  totalRothConversions: number;
  endingRothBalance: number;
  /** TFSA (CA) or Roth (US) ending balance */
  endingTaxFreeBalance: number;
  acaSubsidyLost: boolean;
  oasClawbackYears: number;
}

export interface StrategyResult {
  summary: StrategySummary;
  years: YearPlan[];
}

export interface ComparisonResult {
  profile: RetirementProfile;
  naive: StrategyResult;
  optimized: StrategyResult;
  deltas: {
    taxSavings: number;
    penaltySavings: number;
    preMedicareDragSavings: number;
    netWorthImprovement: number;
    netWorthAt65Improvement: number;
    extraAcaYears: number;
    longevityGainYears: number;
  };
}

export const ALL_ACCOUNT_KEYS: AccountKey[] = [
  "cash",
  "brokerage",
  "traditional_401k",
  "traditional_ira",
  "roth_ira",
  "non_registered",
  "rrsp",
  "tfsa",
  "fhsa",
  "lira",
  "lif",
  "rrif",
];

export function emptyAccounts(): Record<AccountKey, number> {
  return {
    cash: 0,
    brokerage: 0,
    traditional_401k: 0,
    traditional_ira: 0,
    roth_ira: 0,
    non_registered: 0,
    rrsp: 0,
    tfsa: 0,
    fhsa: 0,
    lira: 0,
    lif: 0,
    rrif: 0,
  };
}

export function mergeAccounts(
  partial?: Partial<Record<AccountKey, number>> | null,
): Record<AccountKey, number> {
  return { ...emptyAccounts(), ...(partial ?? {}) };
}
