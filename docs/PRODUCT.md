# Phase 1 — Product Understanding

## Target user
Early retirees / corporate leavers (≈50–60) with savings split across tax treatments.

## Core pain
They know *how much* they have, not *which account to spend from first*. Wrong order triggers penalties, taxes, and ACA subsidy loss.

## Current alternatives
Fee-only planners ($thousands), generic retirement calculators, spreadsheets, guessing.

## Main innovation
A **withdrawal sequencing engine** with naive vs optimized comparison — not another balance dashboard.

## Required data
Ages, spending need, filing status, employer exit age, account balances, pension + SS timing/amounts.

## Required calculations
Year-by-year funding, tax/penalty estimates, MAGI/ACA eligibility proxy, balance growth, sequence comparison.

## Required rules (MVP)
Rule of 55 (simplified), early-withdrawal penalty, brokerage-first ACA protection, Roth as bridge, traditional last before 59½, SS/pension as income streams, Roth conversion *suggestions*.

## Assumptions
Isolated in `src/lib/engine/assumptions.ts` (brackets, ACA cliff, growth, penalties).

## Biggest technical risks
Oversimplified tax realism vs demo clarity; comparison metrics that don’t show a clear win.

## One-sentence product
Deccum tells early retirees exactly which account to withdraw from each year, and proves that a better sequence can save six figures before Medicare.
