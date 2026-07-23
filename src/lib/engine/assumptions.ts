/**
 * Hackathon-simplified assumptions.
 * Country-specific ages/taxes also live in tax modules and country config.
 */
export const ASSUMPTIONS = {
  label: "Hackathon MVP assumptions (not tax advice)",
  earlyWithdrawalAge: 59.5,
  medicareAge: 65,
  rmdAge: 73,
  earlyWithdrawalPenaltyRate: 0.1,
  brokerageGainFraction: 0.4,
  longTermCapGainsRate: 0.15,
  ordinaryTaxBracketsSingle: [
    { upTo: 11_925, rate: 0.1 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  standardDeductionSingle: 15_000,
  acaSubsidyMagiLimitSingle: 60_240,
  acaAnnualSubsidyValue: 8_400,
  defaultPortfolioGrowthRate: 0.05,
  defaultInflationRate: 0.025,
  cashGrowthRate: 0.02,
  maxRothConversion: 25_000,
  socialSecurityTaxableFraction: 0.85,
  defaultPlanningUntilAge: 90,
  defaultStateTaxRate: 0.05,
  rmdDivisor: 26.5,
  // Canada
  caRrifAge: 71,
  caOasStartAge: 65,
  /** Simplified OAS clawback starts around this net income (single) */
  caOasClawbackThreshold: 90_997,
  caOasClawbackRate: 0.15,
  caCapitalGainsInclusion: 0.5,
  caNonRegGainFraction: 0.4,
  caFederalBasicPersonal: 15_705,
  caFederalBrackets: [
    { upTo: 55_867, rate: 0.15 },
    { upTo: 111_733, rate: 0.205 },
    { upTo: 173_205, rate: 0.26 },
    { upTo: 246_752, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 },
  ],
  /** Ontario proxy — architecture supports swapping by province */
  caProvincialRateByProvince: {
    ON: 0.11,
    BC: 0.1,
    AB: 0.1,
    QC: 0.14,
    MB: 0.12,
    SK: 0.105,
    NS: 0.12,
    NB: 0.12,
    NL: 0.12,
    PE: 0.12,
    NT: 0.1,
    YT: 0.1,
    NU: 0.1,
  } as Record<string, number>,
  /** Approx RRIF factor at 71+ (simplified declining) */
  caRrifFactorAt71: 0.0528,
  maxTfsaRoomHint: 7_000,
} as const;

export type Assumptions = typeof ASSUMPTIONS;
