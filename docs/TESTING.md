# Testing Report

## Engine suite
Run:

```bash
npm run test:engine
```

Covers:
- Empty accounts → shortfall warnings
- Large balances → optimized still ahead at 65, zero penalties
- Small balances → completes without crash
- Retirement at 52 and 60
- No Roth / no pension
- Different Social Security claim ages
- Demo profile acceptance criteria (penalty savings, ACA years, wealth at 65)

## Manual UI checklist
- [ ] Landing CTA → Demo mode loads results
- [ ] `/plan` multi-step form → Run strategy
- [ ] Timeline year selection updates explanation
- [ ] Naive / Optimized toggle changes warnings + stats
- [ ] Comparison table shows clear optimized wins
- [ ] Charts render on desktop and mobile widths
- [ ] Empty session on `/results` shows recovery CTAs

## Known simplifications
Labeled in-app and in `assumptions.ts`. Not tax advice.
