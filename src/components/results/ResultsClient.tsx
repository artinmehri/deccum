"use client";

import { ExploreView } from "@/components/explore/ExploreView";
import { OverviewDashboard } from "@/components/overview/OverviewDashboard";
import { TimelineView } from "@/components/timeline/TimelineView";
import { AppHeader, type AppSection } from "@/components/ui/AppShell";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_PROFILE, DEMO_PROFILE_CA, DEMO_PROFILE_US } from "@/lib/demo";
import {
  ASSUMPTIONS,
  compareStrategies,
  simulateStrategy,
  type ComparisonResult,
  type RetirementProfile,
} from "@/lib/engine";
import {
  ensureScenarioWorkspace,
  loadScenarios,
  presetScenarios,
  saveActiveScenarioId,
  saveScenarios,
  type SavedScenario,
} from "@/lib/scenarios";
import { loadProfile, saveProfile } from "@/lib/storage";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function ResultsClient() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const demoCountry = searchParams.get("country") === "CA" ? "CA" : "US";
  const demoProfile =
    demoCountry === "CA" ? DEMO_PROFILE_CA : DEMO_PROFILE_US;

  const [section, setSection] = useState<AppSection>("overview");
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [activeId, setActiveId] = useState("");
  const [compareId, setCompareId] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seed = isDemo ? demoProfile : loadProfile() ?? DEMO_PROFILE;
    if (isDemo) {
      saveProfile(demoProfile);
      const presets = presetScenarios(demoProfile);
      saveScenarios(presets);
      saveActiveScenarioId(presets[0].id);
      setScenarios(presets);
      setActiveId(presets[0].id);
      setReady(true);
      return;
    }

    const existing = loadScenarios();
    if (existing.length === 0) {
      const workspace = ensureScenarioWorkspace(seed);
      const next = workspace.scenarios.map((s, i) =>
        i === 0 ? { ...s, profile: seed, name: "My plan" } : s,
      );
      saveScenarios(next);
      setScenarios(next);
      setActiveId(workspace.activeId);
    } else {
      const workspace = ensureScenarioWorkspace(seed);
      setScenarios(workspace.scenarios);
      setActiveId(workspace.activeId);
    }
    setReady(true);
  }, [isDemo, demoProfile]);

  const activeScenario = scenarios.find((s) => s.id === activeId) ?? null;
  const profile = activeScenario?.profile ?? null;

  const result: ComparisonResult | null = useMemo(
    () => (profile ? compareStrategies(profile) : null),
    [profile],
  );

  const compareScenario = scenarios.find((s) => s.id === compareId) ?? null;
  const compareResult = useMemo(
    () =>
      compareScenario
        ? simulateStrategy(compareScenario.profile, "optimized")
        : null,
    [compareScenario],
  );

  useEffect(() => {
    if (!result) return;
    setSelectedAge((prev) => {
      if (prev != null && result.optimized.years.some((y) => y.age === prev)) {
        return prev;
      }
      return result.optimized.years[0]?.age ?? null;
    });
  }, [result]);

  function persist(next: SavedScenario[], nextActive = activeId) {
    setScenarios(next);
    saveScenarios(next);
    setActiveId(nextActive);
    saveActiveScenarioId(nextActive);
    const active = next.find((s) => s.id === nextActive);
    if (active) saveProfile(active.profile);
  }

  function patchProfile(patch: Partial<RetirementProfile>) {
    if (!activeScenario) return;
    const nextProfile: RetirementProfile = {
      ...activeScenario.profile,
      ...patch,
      accounts: patch.accounts
        ? { ...activeScenario.profile.accounts, ...patch.accounts }
        : activeScenario.profile.accounts,
      oneTimeExpenses:
        patch.oneTimeExpenses ?? activeScenario.profile.oneTimeExpenses,
    };
    persist(
      scenarios.map((s) =>
        s.id === activeId ? { ...s, profile: nextProfile } : s,
      ),
    );
  }

  const attentionCount =
    result?.optimized.years.filter((y) =>
      y.warnings.some((w) => w.severity === "critical"),
    ).length ?? 0;

  if (!ready || !profile || !result || selectedAge == null || !activeScenario) {
    return (
      <div className="min-h-full">
        <AppHeader
          section="overview"
          onSectionChange={() => undefined}
          attentionCount={0}
        />
        <main className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-pulse rounded-full bg-accent-soft" />
          <h1 className="font-display text-3xl font-semibold">
            Preparing your plan…
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Checking withdrawals, taxes, and healthcare risks.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/plan">Start fresh</ButtonLink>
            <ButtonLink href="/results?demo=1" variant="secondary">
              <Sparkles className="h-4 w-4" />
              Open demo
            </ButtonLink>
          </div>
        </main>
      </div>
    );
  }

  const year =
    result.optimized.years.find((y) => y.age === selectedAge) ??
    result.optimized.years[0];

  return (
    <div className="min-h-full pb-16">
      <AppHeader
        section={section}
        onSectionChange={setSection}
        scenarioName={activeScenario.name}
        attentionCount={Math.min(attentionCount, 9)}
      />

      <main className="px-5 py-8 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {section === "overview" ? (
              <OverviewDashboard
                result={result}
                year={year}
                onGo={setSection}
              />
            ) : null}

            {section === "timeline" ? (
              <TimelineView
                years={result.optimized.years}
                selectedAge={selectedAge}
                onSelectAge={setSelectedAge}
                profile={profile}
              />
            ) : null}

            {section === "adjust" ? (
              <ExploreView
                profile={profile}
                result={result}
                scenarios={scenarios}
                activeId={activeId}
                compareId={compareId}
                compareResult={compareResult}
                compareName={compareScenario?.name ?? null}
                onChangeProfile={patchProfile}
                onSelectScenario={(id) => persist(scenarios, id)}
                onCompareScenario={setCompareId}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-ink-soft">
          {ASSUMPTIONS.label}. Simplified on purpose for clarity — not tax or
          investment advice.
        </p>
      </main>
    </div>
  );
}
