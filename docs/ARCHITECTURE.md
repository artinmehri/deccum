# Deccum Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Next.js App                         │
│  Landing → /plan (inputs) → /results (timeline + compare)   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Deterministic Engine                      │
│  assumptions.ts → simulate(naive|optimized) → compare.ts    │
│  explain.ts (plain-English reasons; not used for math)      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
                     sessionStorage profile (no DB)
```

## Why this stack

| Tech | Why |
|---|---|
| Next.js + React + TypeScript | Fastest path to a polished, deployable demo |
| Tailwind CSS | Premium fintech UI without design-system overhead |
| Recharts | Interactive timeline charts with minimal setup |
| Framer Motion | Smooth demo polish (timeline entrance, step transitions) |
| Lucide | Clean iconography |
| sessionStorage | Zero-auth local state for hackathon speed |
| No database / no Plaid | Out of scope — slows the demo without strengthening the claim |

## Core claim

> A better withdrawal sequence can significantly improve retirement outcomes.

Everything in the product funnel reinforces that claim:

1. Inputs collect the accounts that make order matter
2. Engine produces **naive** vs **optimized** sequences
3. Results show timeline, warnings, charts, and a comparison table

## Engine rules (simplified)

- **Naive:** traditional 401(k) → traditional IRA → brokerage → Roth → cash
- **Optimized (pre-59½):** brokerage / cash bridge → Roth bridge → traditional last (avoid penalties; protect ACA MAGI)
- **Rule of 55:** penalty-free 401(k) only if `leftEmployerAtAge >= 55`
- **Taxes:** simplified ordinary brackets + LTCG fraction on brokerage
- **ACA:** warn when approximate MAGI exceeds configurable threshold before Medicare
- **Roth conversions:** suggested in explain/warnings only (not auto-executed)

Assumptions are isolated in `src/lib/engine/assumptions.ts` so real tax logic can replace them later.
