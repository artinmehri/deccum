"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line/70 bg-paper">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 py-8 text-sm text-ink-soft sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div className="max-w-xl space-y-2">
          <p className="font-semibold text-ink">Deccum</p>
          <p>
            No account required. Your numbers stay in this browser — nothing is
            saved on our servers.
          </p>
          <p>
            Educational planning tool with simplified tax assumptions. Not tax,
            legal, or investment advice. Confirm decisions with a qualified
            professional.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 font-medium">
          <Link href="/plan" className="hover:text-ink">
            Start planning
          </Link>
          <Link href="/results?demo=1" className="hover:text-ink">
            US demo
          </Link>
          <Link href="/results?demo=1&country=CA" className="hover:text-ink">
            Canada demo
          </Link>
        </div>
      </div>
    </footer>
  );
}
