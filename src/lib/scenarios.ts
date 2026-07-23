import { DEMO_PROFILE } from "@/lib/demo";
import type { RetirementProfile } from "@/lib/engine";

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: number;
  profile: RetirementProfile;
}

const SCENARIOS_KEY = "deccum.scenarios.v1";
const ACTIVE_KEY = "deccum.activeScenario.v1";

function uid() {
  return `scn_${Math.random().toString(36).slice(2, 10)}`;
}

export function createScenario(
  name: string,
  profile: RetirementProfile,
): SavedScenario {
  return {
    id: uid(),
    name,
    createdAt: Date.now(),
    profile: {
      ...profile,
      accounts: { ...profile.accounts },
      oneTimeExpenses: profile.oneTimeExpenses.map((e) => ({ ...e })),
    },
  };
}

export function presetScenarios(base: RetirementProfile): SavedScenario[] {
  const mk = (name: string, patch: Partial<RetirementProfile>) =>
    createScenario(name, {
      ...base,
      ...patch,
      accounts: { ...base.accounts, ...(patch.accounts ?? {}) },
      oneTimeExpenses: patch.oneTimeExpenses ?? [...base.oneTimeExpenses],
    });

  const delayPension =
    base.country === "CA"
      ? mk("Delay CPP", { cppClaimAge: 70 })
      : mk("Delay Social Security", { socialSecurityClaimAge: 70 });

  return [
    mk("Base Plan", {}),
    mk("Retire at 55", {
      retirementAge: 55,
      currentAge: Math.min(base.currentAge, 55),
    }),
    mk("Retire at 58", {
      retirementAge: 58,
      currentAge: Math.min(base.currentAge, 58),
    }),
    mk("Work Part-Time", {
      partTimeIncome: 36_000,
      partTimeUntilAge: Math.min(65, base.retirementAge + 6),
    }),
    mk("Sell House", {
      oneTimeExpenses: [
        {
          id: "sell-house",
          age: base.retirementAge + 1,
          label: "Home sale proceeds applied as spending event offset",
          amount: -180_000,
        },
      ],
    }),
    delayPension,
    mk("High Inflation", {
      inflationRate: 0.055,
    }),
    mk("Market Crash", {
      marketShockAge: base.retirementAge + 1,
      marketShockDrawdown: -0.25,
    }),
  ];
}

export function loadScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SCENARIOS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedScenario[];
  } catch {
    return [];
  }
}

export function saveScenarios(scenarios: SavedScenario[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
}

export function loadActiveScenarioId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveScenarioId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_KEY, id);
}

export function ensureScenarioWorkspace(
  seed: RetirementProfile = DEMO_PROFILE,
): { scenarios: SavedScenario[]; activeId: string } {
  let scenarios = loadScenarios();
  let activeId = loadActiveScenarioId();

  if (scenarios.length === 0) {
    scenarios = presetScenarios(seed);
    activeId = scenarios[0].id;
    saveScenarios(scenarios);
    saveActiveScenarioId(activeId);
  } else if (!activeId || !scenarios.some((s) => s.id === activeId)) {
    activeId = scenarios[0].id;
    saveActiveScenarioId(activeId);
  }

  return { scenarios, activeId };
}
