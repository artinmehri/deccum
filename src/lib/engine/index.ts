export { ASSUMPTIONS } from "./assumptions";
export { answerPlanQuestion } from "./chat";
export type { ChatMessage } from "./chat";
export { buildPlanContext } from "./planContext";
export { compareStrategies, comparisonNarrative } from "./compare";
export { explainStrategyDifference, explainYear } from "./explain";
export { buildRecommendation, yearStatus } from "./recommend";
export { simulateStrategy } from "./simulate";
export type {
  AccountKey,
  CanadianProvince,
  ComparisonResult,
  CountryCode,
  FilingStatus,
  IncomeStreamKey,
  OneTimeExpense,
  RetirementProfile,
  StrategyResult,
  WarningCode,
  YearPlan,
  YearRecommendation,
  YearStatus,
  YearWarning,
} from "./types";
export { emptyAccounts, mergeAccounts } from "./types";
export { getCountryConfig } from "@/lib/country";
