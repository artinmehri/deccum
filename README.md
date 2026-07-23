# Deccum

**Know which account to withdraw from next — without the jargon.**

Deccum is a free retirement withdrawal sequencing tool for the United States and Canada. It helps people with savings split across multiple account types decide what to spend from each year, and shows how a better order can reduce taxes, penalties, and benefit risk.

**Live:** [https://trydeccum.vercel.app](https://trydeccum.vercel.app)

No signup required. Plans stay in the browser.

---

## Why it exists

Most people know *how much* they’ve saved. Far fewer know *which account to tap first*.

Withdrawing in the wrong order can:

- Trigger early-withdrawal penalties
- Push taxable income into costly brackets
- Risk healthcare subsidy loss (US)
- Increase OAS clawback exposure (Canada)

Deccum compares a common “raid retirement accounts first” approach against a country-aware optimized sequence and explains the difference in plain English.

---

## Features

- **US & Canada support** — localized accounts, benefits, terminology, and tax logic
- **Guided onboarding** — country first, then age, spending, balances, and income
- **Overview** — on-track status, longevity, this year’s action, costly mistakes
- **Timeline** — year-by-year withdrawal plan with milestone markers
- **Explore** — instant what-if sliders, charts, and scenario comparison
- **Optional plan chat** — ask questions grounded in the current projection
- **Demo profiles** — try a filled-in US or Canada plan in seconds

### United States

401(k), Traditional IRA, Roth IRA, brokerage, Social Security, Medicare timing, ACA thresholds, RMDs, Rule of 55, Roth conversions

### Canada

RRSP, TFSA, FHSA, LIRA/LIF/RRIF, non-registered accounts, CPP, OAS, GIS, RRIF minimums, OAS clawback considerations

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run test:engine` | Deterministic engine tests |
| `npm run lint` | ESLint |

---

## How it works

1. Choose where you plan to retire (US or Canada)
2. Enter ages, spending need, account balances, and future income
3. Review Overview, Timeline, and Explore
4. Adjust assumptions instantly — no calculate button

Under the hood, Deccum runs two projections on the same inputs:

- **Naive** — common guess (e.g. retirement accounts first)
- **Optimized** — country-aware withdrawal sequence

It then surfaces taxes, penalties, longevity, and plain-English recommendations for each year.

---

## Stack

- **Next.js** (App Router) · **React** · **TypeScript**
- **Tailwind CSS** · **Framer Motion** · **Recharts**
- Deterministic planning engine in `src/lib/engine/`
- Browser storage only (`localStorage`) — no database required
- Optional OpenAI chat via `OPENAI_API_KEY` (rules-based fallback if unset)

---

## Environment

Copy `.env.example` to `.env.local` if you want LLM-powered chat:

```bash
cp .env.example .env.local
```

```
OPENAI_API_KEY=
```

The core planner works without an API key.

---

## Project structure

```
src/
  app/                 # Routes: landing, plan, results, chat API
  components/          # Overview, Timeline, Explore, onboarding UI
  lib/
    country/           # US / Canada configuration
    engine/            # Simulation, tax, recommendations, chat
    demo.ts            # Demo profiles
    storage.ts         # Browser persistence
docs/                  # Product and architecture notes
```

---

## Deploy

The app is hosted on Vercel:

```bash
npx vercel --prod
```

No required environment variables for the core product. Optionally add `OPENAI_API_KEY` in your Vercel project settings for AI chat.

---

## Disclaimer

Deccum is an educational planning tool with simplified tax and benefit assumptions. It is not tax, legal, or investment advice. Confirm important decisions with a qualified professional.

---

## License

Private / all rights reserved unless otherwise stated by the repository owner.
