import { withScenarioDefaults } from "@/lib/demo";
import type { RetirementProfile } from "@/lib/engine";
import { mergeAccounts } from "@/lib/engine/types";

const KEY = "deccum.profile.v1";

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY)
  );
}

export function saveProfile(profile: RetirementProfile) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(profile);
  window.localStorage.setItem(KEY, raw);
  // Clear legacy session key so we don't revive an old plan
  window.sessionStorage.removeItem(KEY);
}

export function loadProfile(): RetirementProfile | null {
  const raw = readRaw();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RetirementProfile>;
    if (!parsed.accounts) return null;
    return withScenarioDefaults({
      country: parsed.country ?? "US",
      province: parsed.province ?? "ON",
      currentAge: parsed.currentAge ?? 52,
      retirementAge: parsed.retirementAge ?? 52,
      planningUntilAge: parsed.planningUntilAge ?? 90,
      annualSpendingNeed: parsed.annualSpendingNeed ?? 72000,
      filingStatus: parsed.filingStatus ?? "single",
      leftEmployerAtAge: parsed.leftEmployerAtAge ?? 52,
      socialSecurityClaimAge: parsed.socialSecurityClaimAge ?? 67,
      socialSecurityAnnualAtClaimAge:
        parsed.socialSecurityAnnualAtClaimAge ?? 30000,
      cppClaimAge: parsed.cppClaimAge,
      cppAnnualAtClaimAge: parsed.cppAnnualAtClaimAge,
      oasStartAge: parsed.oasStartAge,
      oasAnnual: parsed.oasAnnual,
      gisAnnual: parsed.gisAnnual,
      pensionStartAge: parsed.pensionStartAge ?? 55,
      pensionAnnual: parsed.pensionAnnual ?? 0,
      rentalAnnual: parsed.rentalAnnual,
      accounts: mergeAccounts(parsed.accounts),
      inflationRate: parsed.inflationRate,
      investmentReturn: parsed.investmentReturn,
      cashReserve: parsed.cashReserve,
      partTimeIncome: parsed.partTimeIncome,
      partTimeUntilAge: parsed.partTimeUntilAge,
      stateTaxRate: parsed.stateTaxRate,
      executeRothConversions: parsed.executeRothConversions,
      rrifConversionAge: parsed.rrifConversionAge,
      oneTimeExpenses: parsed.oneTimeExpenses,
      marketShockAge: parsed.marketShockAge,
      marketShockDrawdown: parsed.marketShockDrawdown,
    });
  } catch {
    return null;
  }
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
}
