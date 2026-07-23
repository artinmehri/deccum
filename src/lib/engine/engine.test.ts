import assert from "node:assert/strict";
import { DEMO_PROFILE, DEMO_PROFILE_CA } from "@/lib/demo";
import { answerPlanQuestion } from "@/lib/engine/chat";
import { compareStrategies } from "@/lib/engine/compare";
import { simulateStrategy } from "@/lib/engine/simulate";
import type { RetirementProfile } from "@/lib/engine/types";
import { mergeAccounts } from "@/lib/engine/types";

function base(overrides: Partial<RetirementProfile> = {}): RetirementProfile {
  return {
    ...DEMO_PROFILE,
    oneTimeExpenses: [...DEMO_PROFILE.oneTimeExpenses],
    ...overrides,
    accounts: mergeAccounts({
      ...DEMO_PROFILE.accounts,
      ...(overrides.accounts ?? {}),
    }),
  };
}

function run() {
  {
    const r = compareStrategies(
      base({
        accounts: mergeAccounts({
          cash: 0,
          brokerage: 0,
          traditional_401k: 0,
          traditional_ira: 0,
          roth_ira: 0,
        }),
        pensionAnnual: 0,
        socialSecurityAnnualAtClaimAge: 0,
        partTimeIncome: 0,
      }),
    );
    assert.ok(r.naive.years.length > 0);
    assert.ok(
      r.naive.years.some((y) => y.warnings.some((w) => w.code === "shortfall")),
    );
  }

  {
    const r = compareStrategies(
      base({
        accounts: mergeAccounts({
          cash: 200_000,
          brokerage: 2_000_000,
          traditional_401k: 3_000_000,
          traditional_ira: 500_000,
          roth_ira: 400_000,
        }),
      }),
    );
    assert.equal(r.optimized.summary.totalPenalties, 0);
    assert.ok(r.optimized.summary.netWorthAt65 > r.naive.summary.netWorthAt65);
  }

  {
    const r = simulateStrategy(
      base({
        annualSpendingNeed: 40_000,
        accounts: mergeAccounts({
          cash: 5_000,
          brokerage: 40_000,
          traditional_401k: 80_000,
          traditional_ira: 20_000,
          roth_ira: 10_000,
        }),
      }),
      "optimized",
    );
    assert.ok(r.years.length > 0);
    assert.ok(r.years[0].recommendation.confidence > 0);
    assert.ok(r.years[0].startingBalances);
    assert.ok(typeof r.years[0].stateTax === "number");
  }

  {
    const early = compareStrategies(base({ currentAge: 52, retirementAge: 52 }));
    const later = compareStrategies(base({ currentAge: 60, retirementAge: 60 }));
    assert.ok(early.deltas.penaltySavings > 0);
    assert.ok(later.optimized.years[0].age === 60);
  }

  {
    const r = compareStrategies(
      base({
        accounts: mergeAccounts({
          ...DEMO_PROFILE.accounts,
          roth_ira: 0,
        }),
      }),
    );
    assert.ok(r.optimized.years.length > 0);
  }

  {
    const r = compareStrategies(base({ pensionAnnual: 0 }));
    assert.ok(r.optimized.summary.yearsPlanned > 10);
  }

  {
    const a = compareStrategies(base({ socialSecurityClaimAge: 62 }));
    const b = compareStrategies(base({ socialSecurityClaimAge: 70 }));
    assert.notEqual(
      a.optimized.years.find((y) => y.age === 62)?.incomeStreams.length,
      b.optimized.years.find((y) => y.age === 62)?.incomeStreams.length,
    );
  }

  {
    const r = compareStrategies(DEMO_PROFILE);
    assert.ok(r.deltas.penaltySavings > 40_000);
    assert.ok(r.deltas.preMedicareDragSavings > 80_000);
    assert.ok(r.deltas.netWorthAt65Improvement > 80_000);
    assert.ok(r.deltas.extraAcaYears >= 4);
    assert.equal(r.optimized.years[0].primarySource, "brokerage");
    assert.equal(r.naive.years[0].primarySource, "traditional_401k");
    assert.ok(["optimal", "acceptable"].includes(r.optimized.years[0].status));
    assert.equal(r.naive.years[0].status, "early_penalty");
  }

  {
    const answer = answerPlanQuestion(
      DEMO_PROFILE,
      "Can I retire one year earlier?",
    );
    assert.ok(answer.includes("Wealth at 65"));
    assert.ok(answer.includes("retire"));
  }

  {
    const normal = compareStrategies(DEMO_PROFILE);
    const inflated = compareStrategies(base({ inflationRate: 0.06 }));
    assert.notEqual(
      normal.optimized.summary.moneyLastsUntilAge,
      inflated.optimized.summary.moneyLastsUntilAge,
    );
  }

  {
    const r = compareStrategies(DEMO_PROFILE_CA);
    assert.equal(r.profile.country, "CA");
    assert.ok(r.optimized.years.length > 0);
    assert.equal(r.optimized.years[0].primarySource, "tfsa");
    assert.ok(
      r.optimized.years.some((y) =>
        y.incomeStreams.some((s) => s.source === "cpp" || s.source === "oas"),
      ),
    );
    assert.ok(
      r.optimized.years.some(
        (y) => y.age >= DEMO_PROFILE_CA.rrifConversionAge,
      ),
    );
    const answer = answerPlanQuestion(
      DEMO_PROFILE_CA,
      "Should I delay CPP until 70?",
    );
    assert.ok(answer.toLowerCase().includes("cpp") || answer.includes("65"));
  }

  console.log("✓ All engine tests passed");
}

run();
