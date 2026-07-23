import { ASSUMPTIONS } from "./assumptions";
import type { FilingStatus } from "./types";

export function ordinaryIncomeTax(taxableIncome: number): number {
  const income = Math.max(0, taxableIncome);
  let remaining = income;
  let lastCap = 0;
  let tax = 0;

  for (const bracket of ASSUMPTIONS.ordinaryTaxBracketsSingle) {
    const span = Math.min(remaining, bracket.upTo - lastCap);
    if (span <= 0) break;
    tax += span * bracket.rate;
    remaining -= span;
    lastCap = bracket.upTo;
  }

  return tax;
}

export function marginalBracket(ordinary: number): number {
  const taxable = Math.max(0, ordinary - ASSUMPTIONS.standardDeductionSingle);
  let lastCap = 0;
  for (const bracket of ASSUMPTIONS.ordinaryTaxBracketsSingle) {
    if (taxable <= bracket.upTo) return bracket.rate;
    lastCap = bracket.upTo;
  }
  void lastCap;
  return 0.37;
}

export function capitalGainsTax(gains: number): number {
  return Math.max(0, gains) * ASSUMPTIONS.longTermCapGainsRate;
}

export function estimateFederalTax(ordinary: number, gains: number): number {
  const taxableOrdinary = Math.max(
    0,
    ordinary - ASSUMPTIONS.standardDeductionSingle,
  );
  return ordinaryIncomeTax(taxableOrdinary) + capitalGainsTax(gains);
}

export function estimateStateTax(ordinary: number, rate: number): number {
  return Math.max(0, ordinary) * Math.max(0, rate);
}

export function acaMagiLimit(filingStatus: FilingStatus): number {
  if (filingStatus === "married_filing_jointly" || filingStatus === "married") {
    return ASSUMPTIONS.acaSubsidyMagiLimitSingle * 1.7;
  }
  return ASSUMPTIONS.acaSubsidyMagiLimitSingle;
}

export function estimateMagi(
  ordinary: number,
  gains: number,
  socialSecurity: number,
): number {
  return (
    ordinary +
    gains +
    socialSecurity * ASSUMPTIONS.socialSecurityTaxableFraction
  );
}
