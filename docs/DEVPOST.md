# Devpost Submission Copy

## Title
Deccum — Withdrawal Sequencing Engine

## Tagline
Know exactly which retirement account to withdraw from every year.

## Inspiration
A 52-year-old leaves corporate with savings scattered across a 401(k), Roth IRA, brokerage, pension, cash, and Social Security. Choosing the wrong withdrawal order can trigger penalties, inflate taxes, and blow ACA subsidy limits. Planners charge thousands. Everyone else guesses.

## What it does
Deccum generates a year-by-year retirement withdrawal strategy and compares:
- **Naive order** (raid tax-deferred accounts first)
- **Optimized order** (protect ACA eligibility, avoid penalties, sequence smartly)

Users see an interactive timeline, balance/income/tax charts, warning cards, and a clear outcome comparison.

## How we built it
- Next.js + TypeScript + Tailwind
- Deterministic rules engine with configurable assumptions
- Recharts visualizations + Framer Motion polish
- Local session state (no auth/DB) for hackathon speed
- Plain-English explanations separated from engine decisions (AI explains; engine decides)

## Challenges
Modeling just enough of the U.S. tax/penalty/ACA surface to be believable without pretending to be TurboTax. We isolated assumptions so real tax logic can replace the simplified rules later.

## Accomplishments
- End-to-end demo in under 90 seconds
- Dramatic, defensible naive vs optimized gap
- Premium fintech UX focused on one claim: order matters

## What we learned
The “aha” is comparison. A single timeline is helpful; a side-by-side sequence comparison is persuasive.

## What's next
- Real tax tables / state taxes
- Optional account aggregation
- Roth conversion optimizer that executes inside the projection
- Advisor-ready exportable plans
- Monte Carlo markets (still sequenced)

## Built with
Next.js, React, TypeScript, Tailwind CSS, Recharts, Framer Motion, Lucide, Vercel
