import { explainStrategyDifference } from "./explain";
import { simulateStrategy } from "./simulate";
import type { ComparisonResult, RetirementProfile } from "./types";

export function compareStrategies(
  profile: RetirementProfile,
): ComparisonResult {
  const naive = simulateStrategy(profile, "naive");
  const optimized = simulateStrategy(profile, "optimized");

  const taxSavings =
    naive.summary.preMedicareDrag - optimized.summary.preMedicareDrag;
  const penaltySavings =
    naive.summary.totalPenalties - optimized.summary.totalPenalties;
  const preMedicareDragSavings =
    naive.summary.preMedicareDrag - optimized.summary.preMedicareDrag;
  const netWorthImprovement =
    optimized.summary.finalNetWorth - naive.summary.finalNetWorth;
  const netWorthAt65Improvement =
    optimized.summary.netWorthAt65 - naive.summary.netWorthAt65;
  const extraAcaYears =
    optimized.summary.yearsWithAca - naive.summary.yearsWithAca;

  const naiveLongevity =
    naive.summary.yearsUntilDepletion ?? naive.summary.yearsPlanned;
  const optimizedLongevity =
    optimized.summary.yearsUntilDepletion ?? optimized.summary.yearsPlanned;

  return {
    profile,
    naive,
    optimized,
    deltas: {
      taxSavings,
      penaltySavings,
      preMedicareDragSavings,
      netWorthImprovement,
      netWorthAt65Improvement,
      extraAcaYears,
      longevityGainYears: optimizedLongevity - naiveLongevity,
    },
  };
}

export function comparisonNarrative(result: ComparisonResult): string {
  return explainStrategyDifference(result.deltas);
}
