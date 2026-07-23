import { ASSUMPTIONS } from "@/lib/engine/assumptions";
import type { RetirementProfile } from "@/lib/engine";
import { emptyAccounts, mergeAccounts } from "@/lib/engine/types";

/** One-click US demo profile */
export const DEMO_PROFILE_US: RetirementProfile = {
  country: "US",
  province: "ON",
  currentAge: 52,
  retirementAge: 52,
  planningUntilAge: 92,
  annualSpendingNeed: 72_000,
  filingStatus: "single",
  leftEmployerAtAge: 52,
  socialSecurityClaimAge: 67,
  socialSecurityAnnualAtClaimAge: 30_000,
  cppClaimAge: 65,
  cppAnnualAtClaimAge: 0,
  oasStartAge: 65,
  oasAnnual: 0,
  gisAnnual: 0,
  pensionStartAge: 55,
  pensionAnnual: 16_800,
  rentalAnnual: 0,
  accounts: mergeAccounts({
    cash: 55_000,
    brokerage: 310_000,
    traditional_401k: 715_000,
    traditional_ira: 180_000,
    roth_ira: 120_000,
  }),
  inflationRate: ASSUMPTIONS.defaultInflationRate,
  investmentReturn: ASSUMPTIONS.defaultPortfolioGrowthRate,
  cashReserve: 36_000,
  partTimeIncome: 0,
  partTimeUntilAge: 60,
  stateTaxRate: ASSUMPTIONS.defaultStateTaxRate,
  executeRothConversions: true,
  rrifConversionAge: 71,
  oneTimeExpenses: [],
  marketShockAge: null,
  marketShockDrawdown: -0.25,
};

/** One-click Canada demo profile */
export const DEMO_PROFILE_CA: RetirementProfile = {
  country: "CA",
  province: "ON",
  currentAge: 55,
  retirementAge: 55,
  planningUntilAge: 92,
  annualSpendingNeed: 65_000,
  filingStatus: "single",
  leftEmployerAtAge: 55,
  socialSecurityClaimAge: 67,
  socialSecurityAnnualAtClaimAge: 0,
  cppClaimAge: 65,
  cppAnnualAtClaimAge: 14_400,
  oasStartAge: 65,
  oasAnnual: 8_500,
  gisAnnual: 0,
  pensionStartAge: 60,
  pensionAnnual: 12_000,
  rentalAnnual: 0,
  accounts: mergeAccounts({
    cash: 40_000,
    non_registered: 220_000,
    tfsa: 110_000,
    rrsp: 480_000,
    fhsa: 0,
    lira: 95_000,
    rrif: 0,
    lif: 0,
  }),
  inflationRate: ASSUMPTIONS.defaultInflationRate,
  investmentReturn: ASSUMPTIONS.defaultPortfolioGrowthRate,
  cashReserve: 30_000,
  partTimeIncome: 0,
  partTimeUntilAge: 62,
  stateTaxRate: 0.11,
  executeRothConversions: false,
  rrifConversionAge: 71,
  oneTimeExpenses: [],
  marketShockAge: null,
  marketShockDrawdown: -0.25,
};

/** @deprecated Use DEMO_PROFILE_US */
export const DEMO_PROFILE = DEMO_PROFILE_US;

export const DEMO_PERSONA = {
  name: "Jordan Ellis",
  headline: "Age 52 · just left corporate · savings everywhere",
  story:
    "Jordan has retirement accounts across tax treatments — and no idea which to tap first.",
};

export const DEMO_PERSONA_CA = {
  name: "Sam Nguyen",
  headline: "Age 55 · leaving work in Ontario · RRSP + TFSA + LIRA",
  story:
    "Sam has an RRSP, TFSA, non-registered account, and a LIRA — plus CPP and OAS ahead.",
};

export function withScenarioDefaults(
  profile: Partial<RetirementProfile> &
    Pick<
      RetirementProfile,
      | "currentAge"
      | "retirementAge"
      | "planningUntilAge"
      | "annualSpendingNeed"
      | "accounts"
    >,
): RetirementProfile {
  const country = profile.country ?? "US";
  return {
    country,
    province: profile.province ?? "ON",
    filingStatus: profile.filingStatus ?? "single",
    leftEmployerAtAge: profile.leftEmployerAtAge ?? profile.currentAge,
    socialSecurityClaimAge: profile.socialSecurityClaimAge ?? 67,
    socialSecurityAnnualAtClaimAge:
      profile.socialSecurityAnnualAtClaimAge ?? (country === "US" ? 30000 : 0),
    cppClaimAge: profile.cppClaimAge ?? 65,
    cppAnnualAtClaimAge:
      profile.cppAnnualAtClaimAge ?? (country === "CA" ? 14000 : 0),
    oasStartAge: profile.oasStartAge ?? 65,
    oasAnnual: profile.oasAnnual ?? (country === "CA" ? 8500 : 0),
    gisAnnual: profile.gisAnnual ?? 0,
    pensionStartAge: profile.pensionStartAge ?? 60,
    pensionAnnual: profile.pensionAnnual ?? 0,
    rentalAnnual: profile.rentalAnnual ?? 0,
    inflationRate: profile.inflationRate ?? ASSUMPTIONS.defaultInflationRate,
    investmentReturn:
      profile.investmentReturn ?? ASSUMPTIONS.defaultPortfolioGrowthRate,
    cashReserve: profile.cashReserve ?? 36_000,
    partTimeIncome: profile.partTimeIncome ?? 0,
    partTimeUntilAge:
      profile.partTimeUntilAge ??
      Math.min(65, (profile.retirementAge ?? 55) + 5),
    stateTaxRate:
      profile.stateTaxRate ??
      (country === "CA" ? 0.11 : ASSUMPTIONS.defaultStateTaxRate),
    executeRothConversions:
      profile.executeRothConversions ?? country === "US",
    rrifConversionAge: profile.rrifConversionAge ?? 71,
    oneTimeExpenses: profile.oneTimeExpenses ?? [],
    marketShockAge: profile.marketShockAge ?? null,
    marketShockDrawdown: profile.marketShockDrawdown ?? -0.25,
    ...profile,
    accounts: mergeAccounts(profile.accounts ?? emptyAccounts()),
  };
}
