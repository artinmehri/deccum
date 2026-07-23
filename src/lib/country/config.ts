import type {
  AccountKey,
  CountryCode,
  CanadianProvince,
  IncomeStreamKey,
} from "@/lib/engine/types";

export interface AccountFieldConfig {
  key: AccountKey;
  label: string;
  hint?: string;
  optional?: boolean;
}

export interface MilestoneConfig {
  id: string;
  label: string;
  /** Fixed age, or null if resolved from profile */
  age: number | null;
  fromProfile?: "socialSecurityClaimAge" | "cppClaimAge" | "rrifConversionAge";
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  currencyCode: "USD" | "CAD";
  accounts: AccountFieldConfig[];
  /** Primary public pension claim age field for Explore slider */
  publicPensionLabel: string;
  publicPensionMinAge: number;
  publicPensionMaxAge: number;
  milestones: MilestoneConfig[];
  /** Label for tax-free account in summaries */
  taxFreeAccountLabel: string;
  conversionLabel: string;
  requiredWithdrawalLabel: string;
  healthcareSeniorLabel: string;
  delayPensionTip: string;
  beforeMedicarePhrase: string;
  defaultProvince?: CanadianProvince;
}

export const US_CONFIG: CountryConfig = {
  code: "US",
  name: "United States",
  flag: "🇺🇸",
  currencyCode: "USD",
  accounts: [
    { key: "cash", label: "Cash / savings" },
    { key: "brokerage", label: "Brokerage (taxable)" },
    { key: "traditional_401k", label: "401(k)" },
    { key: "traditional_ira", label: "Traditional IRA" },
    { key: "roth_ira", label: "Roth IRA" },
  ],
  publicPensionLabel: "Social Security",
  publicPensionMinAge: 62,
  publicPensionMaxAge: 70,
  milestones: [
    { id: "now", label: "Now", age: null },
    { id: "medicare", label: "Medicare", age: 65 },
    {
      id: "ss",
      label: "Social Security",
      age: null,
      fromProfile: "socialSecurityClaimAge",
    },
    { id: "rmd", label: "RMDs", age: 73 },
  ],
  taxFreeAccountLabel: "Roth IRA",
  conversionLabel: "Roth conversion",
  requiredWithdrawalLabel: "RMD",
  healthcareSeniorLabel: "Medicare",
  delayPensionTip: "delaying Social Security",
  beforeMedicarePhrase: "before Medicare (65)",
};

export const CA_CONFIG: CountryConfig = {
  code: "CA",
  name: "Canada",
  flag: "🇨🇦",
  currencyCode: "CAD",
  defaultProvince: "ON",
  accounts: [
    { key: "cash", label: "Cash / savings" },
    { key: "non_registered", label: "Non-registered investments" },
    { key: "tfsa", label: "TFSA" },
    { key: "rrsp", label: "RRSP" },
    { key: "fhsa", label: "FHSA", optional: true, hint: "Optional" },
    { key: "lira", label: "LIRA", optional: true, hint: "Locked-in" },
    { key: "rrif", label: "RRIF", optional: true, hint: "If you already have one" },
    { key: "lif", label: "LIF", optional: true, hint: "If you already have one" },
  ],
  publicPensionLabel: "CPP",
  publicPensionMinAge: 60,
  publicPensionMaxAge: 70,
  milestones: [
    { id: "now", label: "Now", age: null },
    { id: "oas", label: "OAS", age: 65 },
    { id: "cpp", label: "CPP", age: null, fromProfile: "cppClaimAge" },
    {
      id: "rrif",
      label: "RRIF",
      age: null,
      fromProfile: "rrifConversionAge",
    },
  ],
  taxFreeAccountLabel: "TFSA",
  conversionLabel: "RRSP → RRIF",
  requiredWithdrawalLabel: "RRIF minimum",
  healthcareSeniorLabel: "Age 65+",
  delayPensionTip: "delaying CPP",
  beforeMedicarePhrase: "before age 65",
};

export function getCountryConfig(country: CountryCode): CountryConfig {
  return country === "CA" ? CA_CONFIG : US_CONFIG;
}

export function accountKeysForCountry(country: CountryCode): AccountKey[] {
  return getCountryConfig(country).accounts.map((a) => a.key);
}

export function incomeKeysForCountry(country: CountryCode): IncomeStreamKey[] {
  if (country === "CA") {
    return ["employment", "pension", "cpp", "oas", "gis", "rental"];
  }
  return ["employment", "pension", "social_security"];
}
