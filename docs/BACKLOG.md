# Engineering Backlog (Hackathon MVP)

| Title | Priority | Est. | Files | Acceptance | Deps |
|---|---|---|---|---|---|
| Scaffold Next.js app | P0 | 20m | package.json, app shell | App boots | — |
| Assumptions + types | P0 | 30m | `engine/assumptions.ts`, `types.ts` | Configurable knobs | Scaffold |
| Simulate naive/optimized | P0 | 2h | `engine/simulate.ts`, `tax.ts` | Demo deltas look strong | Types |
| Compare + explain | P0 | 45m | `compare.ts`, `explain.ts` | Narrative + metrics | Simulate |
| Landing page | P0 | 45m | `app/page.tsx` | Demo CTA + brand hero | UI kit |
| Planner multi-step form | P0 | 1h | `PlannerForm.tsx`, `/plan` | Saves profile, navigates | Types |
| Results timeline + detail | P0 | 1.5h | `ResultsClient`, timeline | Year select works | Engine |
| Charts | P0 | 1h | `ResultCharts.tsx` | Balances/income/tax render | Engine |
| Comparison table | P0 | 45m | `ComparisonTable.tsx` | Clear optimized wins | Compare |
| Demo mode | P0 | 20m | `demo.ts`, header/landing | One-click path | Results |
| Docs + pitches | P1 | 45m | `docs/*`, README | Submission-ready | Product |
| Engine tests | P1 | 30m | `engine.test.ts` | All cases pass | Engine |

Nice-to-have deferred: PDF export, live LLM explanations, Plaid, auth, payments.
