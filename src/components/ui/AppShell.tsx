"use client";

import { ButtonLink } from "@/components/ui/Button";
import { DEMO_PROFILE } from "@/lib/demo";
import { saveProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type AppSection = "overview" | "timeline" | "adjust";

const APP_SECTIONS: { id: AppSection; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Your retirement at a glance" },
  { id: "timeline", label: "Timeline", hint: "What to do each year" },
  { id: "adjust", label: "Explore", hint: "Try what-if changes" },
];

function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Deccum"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  );
}

export function MarketingHeader() {
  const router = useRouter();
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center">
          <BrandMark size={44} />
        </span>
        <span className="font-display text-2xl font-semibold">Deccum</span>
      </Link>
      <div className="flex items-center gap-2">
        <p className="mr-1 hidden text-sm text-ink-soft md:block">
          No account needed
        </p>
        <button
          type="button"
          className="hidden min-h-11 rounded-2xl px-4 text-base font-semibold text-accent transition hover:bg-accent-soft sm:inline"
          onClick={() => {
            saveProfile(DEMO_PROFILE);
            router.push("/results?demo=1");
          }}
        >
          See a demo
        </button>
        <ButtonLink href="/plan" className="!min-h-11 !px-5">
          Get started
        </ButtonLink>
      </div>
    </header>
  );
}

export function AppHeader({
  section,
  onSectionChange,
  scenarioName,
  attentionCount = 0,
}: {
  section: AppSection;
  onSectionChange: (s: AppSection) => void;
  scenarioName?: string;
  attentionCount?: number;
}) {
  const pathname = usePathname();
  const inApp = pathname?.startsWith("/results");

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center">
              <BrandMark size={40} />
            </span>
            <div>
              <p className="font-display text-xl font-semibold leading-none">
                Deccum
              </p>
              {scenarioName ? (
                <p className="mt-1 text-sm text-ink-soft">{scenarioName}</p>
              ) : null}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ButtonLink
              href="/plan"
              variant="ghost"
              className="!min-h-10 !px-3 !text-sm"
            >
              Edit accounts
            </ButtonLink>
          </div>
        </div>

        {inApp ? (
          <nav
            aria-label="Main"
            className="flex gap-1 rounded-2xl bg-mist/90 p-1.5"
          >
            {APP_SECTIONS.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "relative flex-1 rounded-xl px-3 py-3 text-center transition",
                    active
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-soft hover:text-ink",
                  )}
                >
                  <span className="block text-base font-semibold">
                    {item.label}
                    {item.id === "overview" && attentionCount > 0 ? (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white">
                        {attentionCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 hidden text-xs sm:block">
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
