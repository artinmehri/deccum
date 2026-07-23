import { ASSUMPTIONS } from "./assumptions";
import type { CanadianProvince } from "./types";

export function caFederalTax(taxableIncome: number): number {
  const income = Math.max(0, taxableIncome - ASSUMPTIONS.caFederalBasicPersonal);
  let remaining = income;
  let lastCap = 0;
  let tax = 0;
  for (const bracket of ASSUMPTIONS.caFederalBrackets) {
    const span = Math.min(remaining, bracket.upTo - lastCap);
    if (span <= 0) break;
    tax += span * bracket.rate;
    remaining -= span;
    lastCap = bracket.upTo;
  }
  return tax;
}

export function caProvincialTax(
  taxableIncome: number,
  province: CanadianProvince,
): number {
  const rate =
    ASSUMPTIONS.caProvincialRateByProvince[province] ??
    ASSUMPTIONS.caProvincialRateByProvince.ON;
  return Math.max(0, taxableIncome) * rate;
}

export function caCapitalGainsTaxable(gains: number): number {
  return Math.max(0, gains) * ASSUMPTIONS.caCapitalGainsInclusion;
}

export function caEstimateTax(params: {
  ordinary: number;
  capitalGains: number;
  province: CanadianProvince;
}): { federal: number; provincial: number; bracket: number } {
  const taxableGains = caCapitalGainsTaxable(params.capitalGains);
  const taxable = params.ordinary + taxableGains;
  const federal = caFederalTax(taxable);
  const provincial = caProvincialTax(taxable, params.province);
  let bracket = 0.15;
  let lastCap = 0;
  const income = Math.max(0, taxable - ASSUMPTIONS.caFederalBasicPersonal);
  for (const b of ASSUMPTIONS.caFederalBrackets) {
    if (income <= b.upTo) {
      bracket = b.rate;
      break;
    }
    lastCap = b.upTo;
    bracket = b.rate;
  }
  void lastCap;
  return { federal, provincial, bracket };
}

export function caOasClawback(oasAnnual: number, netIncome: number): number {
  if (oasAnnual <= 0) return 0;
  if (netIncome <= ASSUMPTIONS.caOasClawbackThreshold) return 0;
  const excess = netIncome - ASSUMPTIONS.caOasClawbackThreshold;
  return Math.min(oasAnnual, excess * ASSUMPTIONS.caOasClawbackRate);
}

export function caRrifMinimum(rrifBalance: number, age: number): number {
  if (rrifBalance <= 0 || age < 55) return 0;
  // Simplified: use 71 factor, slightly higher later
  const factor =
    age >= 95
      ? 0.2
      : ASSUMPTIONS.caRrifFactorAt71 + Math.max(0, age - 71) * 0.0015;
  return rrifBalance * factor;
}
