"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { MarketingHeader } from "@/components/ui/AppShell";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { DEMO_PROFILE_CA, DEMO_PROFILE_US } from "@/lib/demo";
import {
  presetScenarios,
  saveActiveScenarioId,
  saveScenarios,
} from "@/lib/scenarios";
import { saveProfile } from "@/lib/storage";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  function openDemo(country: "US" | "CA") {
    const demo = country === "CA" ? DEMO_PROFILE_CA : DEMO_PROFILE_US;
    saveProfile(demo);
    const presets = presetScenarios(demo);
    saveScenarios(presets);
    saveActiveScenarioId(presets[0].id);
    router.push(
      country === "CA" ? "/results?demo=1&country=CA" : "/results?demo=1",
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-6 sm:px-8">
        <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              No signup · Free to use · US & Canada
            </p>
            <p className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
              Deccum
            </p>
            <h1 className="mt-6 max-w-xl text-3xl font-medium leading-snug text-ink-soft sm:text-4xl">
              Know which account to use next — without the jargon.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
              Built for people leaving work with money in a few different
              places. In minutes you’ll see if you’re on track, what to withdraw
              this year, and how long the money lasts.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/plan" className="min-w-[190px]">
                Start with my numbers
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <Button
                onClick={() => openDemo("US")}
                variant="secondary"
                className="min-w-[160px]"
              >
                Try US demo
              </Button>
              <Button
                onClick={() => openDemo("CA")}
                variant="secondary"
                className="min-w-[160px]"
              >
                Try Canada demo
              </Button>
            </div>

            <ul className="mt-8 space-y-3 text-base text-ink-soft">
              {[
                "No account — start immediately in your browser",
                "Works for United States and Canadian retirement accounts",
                "Plain English recommendations and year-by-year timeline",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="surface-card p-6 sm:p-8"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              This year
            </p>
            <p className="mt-4 font-display text-3xl font-semibold">
              Use the right account first
            </p>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">
              US plans may start with brokerage to protect healthcare subsidies.
              Canadian plans often draw TFSA first to keep taxable income lower.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-mist/80 p-4">
                <p className="text-sm text-ink-soft">Money lasts until</p>
                <p className="mt-1 font-display text-3xl font-semibold">85+</p>
              </div>
              <div className="rounded-2xl bg-accent-soft/80 p-4">
                <p className="text-sm text-accent-deep">Costly mistakes</p>
                <p className="mt-1 font-display text-3xl font-semibold text-accent-deep">
                  Avoided
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
